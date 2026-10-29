# 12 - Implementação do Banco de Dados (DDL)

SGBD alvo: PostgreSQL 16+. O DDL está em
[`database/scripts/ddl/schema.sql`](../../../database/scripts/ddl/schema.sql) e
materializa o [11 - Modelo Lógico](../modelagem/11-modelo-logico.md): 6 schemas,
15 tabelas, 14 índices.

> **Validação pendente.** O DDL ainda **não foi executado** contra uma instância
> real de PostgreSQL — o Docker não estava disponível no ambiente durante esta
> sessão. O script está escrito e revisado, mas nenhuma das constraints,
> procedures ou views foi exercitada. Nada aqui deve ser lido como "funciona";
> leia como "está especificado". Os testes de constraint em SQL contra
> PostgreSQL real são o nível 1 da estratégia de testes
> ([ADR 0014](../../02-arquitetura/adr/0014-estrategia-de-testes.md)) e os casos
> em [17 - Testes](../../05-qualidade/17-testes.md) só valem depois da primeira
> execução bem-sucedida.

## O arquivo é gerado, não escrito

`schema.sql` é **gerado a partir das migrations do EF Core** e nunca editado à
mão ([ADR 0004](../../02-arquitetura/adr/0004-schema-sql-gerado-por-migration.md)):

```bash
dotnet ef migrations script --idempotent --output database/scripts/ddl/schema.sql
```

A consequência prática: mudança de schema começa no modelo C#, vira migration,
e só então o `.sql` é regenerado. Editar o arquivo diretamente cria divergência
entre o banco e o que o EF acha que o banco é — e a próxima migration falha ou,
pior, apaga a alteração.

O que o EF **não** gera — procedures, triggers e views — vive em
[`database/scripts/ddl/functions/`](../../../database/scripts/ddl/functions/) e
é aplicado por migration, carregando o `.sql` como *embedded resource* e
passando a string para `migrationBuilder.Sql()` (o EF Core não tem
`migrationBuilder.SqlFile()`).

## Organização em schemas

Um schema por módulo do monólito
([ADR 0005](../../02-arquitetura/adr/0005-schema-por-modulo-postgres.md)):
`identidade`, `grupos`, `desafios`, `validacao`, `economia`, `notificacoes`.

A separação é lógica. As chaves estrangeiras atravessam schemas normalmente e a
integridade referencial é do banco, não da aplicação.

## Objetos em `ddl/functions/`

### [`01-apurar-votacao.sql`](../../../database/scripts/ddl/functions/01-apurar-votacao.sql)

`validacao.apurar_votacao(p_id_evidencia INT)` — o coração do sistema. Chamada
pela aplicação após cada voto e pelo `BackgroundService` ao expirar o prazo.

* Trava a evidência com `FOR UPDATE`, serializando votos concorrentes.
* Idempotente: evidência já apurada retorna sem efeito.
* Calcula o quórum sobre `validador_evidencia`, nunca sobre o grupo atual (RN14, RN15).
* Decide `ACEITA` / `RECUSADA` / `EXPIRADA`; empate dentro do prazo mantém aberto (RN16).
* Aciona `economia.creditar_recompensa_voto` quando a decisão coletiva se concretiza (RN17).
* Encerra o desafio em `ACEITA`, ou quando acumulam 3 recusadas ou a quinta evidência se esgota (RN10).

Roda inteira em uma transação: não existe estado em que a evidência foi aceita
mas o CP não foi pago.

### [`02-economia.sql`](../../../database/scripts/ddl/functions/02-economia.sql)

Toda movimentação de CP passa por aqui.

| Procedure | Papel | Regra |
| --- | --- | --- |
| `economia.lancar` | Lançamento primitivo: escreve no ledger e atualiza o saldo materializado na mesma transação | RN24 |
| `economia.debitar_escrow` | Débito no aceite — duas linhas, o CP muda de lugar e não é destruído | RN18 |
| `economia.creditar_recompensa_voto` | 2 CP para quem votou em evidência que atingiu quórum | RN17 |
| `desafios.encerrar_desafio` | Divide o pote entre quem acertou; o resto da divisão inteira vai para o primeiro vencedor | RN23 |
| `desafios.cancelar_desafio` | Estorna o escrow de cada participante e grava o motivo | RN12 |

### [`03-triggers-e-views.sql`](../../../database/scripts/ddl/functions/03-triggers-e-views.sql)

Triggers guardam o que nunca pode ser violado, mesmo por acesso direto ao banco.

| Trigger | Tabela | Garante | Regra |
| --- | --- | --- | --- |
| `trg_voto_evidencia_valida` | `voto_evidencia` (`BEFORE INSERT`) | Só se vota em evidência `EM_VOTACAO` e dentro do prazo | RN19 |
| `trg_transacao_cp_imutavel` | `transacao_cp` (`BEFORE UPDATE OR DELETE`) | Ledger append-only — levanta exceção sempre | RN24 |
| `trg_membro_credito_inicial` | `membro_grupo` (`AFTER INSERT`) | Lança os 100 CP de entrada no ledger | RN06 |

Views no mesmo arquivo: `economia.vw_reconciliacao_saldo`,
`validacao.vw_status_votacao` e `economia.vw_cp_em_escrow` — descritas em
[16 - Consultas SQL](16-consultas-sql.md).

## Constraints e as regras que garantem

### `CHECK`

| Constraint | Tabela | O que recusa | Regra |
| --- | --- | --- | --- |
| `chk_credencial_provedor` | `credencial_usuario` | Provedor fora de `GOOGLE`, `SENHA` | RN05 |
| `chk_credencial_segredo` | `credencial_usuario` | `GOOGLE` com segredo, `SENHA` sem | RN05 |
| `chk_membro_papel` | `membro_grupo` | Papel fora de `ADMIN`, `MEMBRO` | RN25 |
| `chk_membro_saldo` | `membro_grupo` | Saldo negativo | RN08 |
| `chk_convite_expiracao` | `convite_grupo` | Expiração anterior à criação | RN20 |
| `chk_convite_uso` | `convite_grupo` | Uso pela metade (só um dos dois campos) | RN20 |
| `chk_desafio_tipo` | `desafio` | Tipo de recompensa fora dos 4 valores | RN01 |
| `chk_desafio_valor` | `desafio` | Valor monetário ≤ 0 | RN02 |
| `chk_desafio_valor_cp` | `desafio` | Desafio que não custa CP | RN07 |
| `chk_desafio_status` | `desafio` | Status fora dos 6 valores | RN03 |
| `chk_desafio_cancelamento` | `desafio` | Cancelamento sem motivo | RN12 |
| `chk_desafio_encerramento` | `desafio` | Status terminal sem `data_encerramento` | RN03 |
| `chk_participante_papel` | `participante_desafio` | Papel fora de `DESAFIANTE`, `DESAFIADO`, `APOSTADOR` | RN09 |
| `chk_participante_escolha` | `participante_desafio` | Escolha fora de `VAI_CUMPRIR`, `NAO_VAI_CUMPRIR` | — |
| `chk_comentario_texto` | `comentario_desafio` | Comentário vazio ou só espaços | — |
| `chk_evidencia_midia` | `evidencia` | Mídia fora de `FOTO`, `VIDEO`, `LINK`, `TEXTO` | — |
| `chk_evidencia_status` | `evidencia` | Status fora dos 4 valores | RN13 |
| `chk_evidencia_ordem` | `evidencia` | Ordem fora de 1..5 | RN10 |
| `chk_evidencia_votacao` | `evidencia` | Prazo de votação anterior ao envio | RN11 |
| `chk_evidencia_apuracao` | `evidencia` | Evidência apurada sem `data_apuracao` | RN13 |
| `chk_voto_tipo` | `voto_evidencia` | Voto fora de `VALIDO`, `INVALIDO` | RN15 |
| `chk_transacao_tipo` | `transacao_cp` | Tipo fora dos 5 lançamentos previstos | RN24 |
| `chk_transacao_valor` | `transacao_cp` | Lançamento de valor zero | RN24 |
| `chk_transacao_conta` | `transacao_cp` | Lançamento sem usuário e sem desafio | RN24 |
| `chk_transacao_escrow` | `transacao_cp` | `DESAFIO_ESCROW` sem desafio | RN18 |
| `chk_notificacao_tipo` | `notificacao` | Tipo fora dos 5 valores | — |

### `UNIQUE` e chaves compostas

| Restrição | Tabela | O que impede | Regra |
| --- | --- | --- | --- |
| `usuario.email` | `usuario` | Dois cadastros com o mesmo e-mail | — |
| `unq_credencial_provedor` | `credencial_usuario` | Duas contas para a mesma identidade externa | RN05 |
| `unq_credencial_usuario_provedor` | `credencial_usuario` | Duas credenciais do mesmo provedor por usuário | RN05 |
| `unq_membro_grupo` | `membro_grupo` | Entrada duplicada no grupo | — |
| `convite_grupo.codigo` | `convite_grupo` | Código de convite repetido | RN20 |
| `categoria_desafio.nome` | `categoria_desafio` | Categoria duplicada | — |
| `unq_participante_desafio` | `participante_desafio` | Dois papéis para o mesmo usuário no desafio | RN09 |
| `unq_evidencia_ordem` | `evidencia` | Duas evidências na mesma posição da sequência | RN10 |
| `pk_validador_evidencia` | `validador_evidencia` | Validador duplicado no júri | RN14 |
| `unq_voto_usuario` | `voto_evidencia` | Voto em dobro | RN04 |
| `fk_voto_validador` (FK composta) | `voto_evidencia` | Voto de quem não estava no júri congelado | RN14 |
| `push_subscription.endpoint` | `push_subscription` | Inscrição push duplicada | — |

## Índices parciais

Três dos 14 índices são parciais — cobrem só o subconjunto de linhas que as
consultas realmente varrem, o que os mantém pequenos mesmo com a tabela
crescendo.

| Índice | Predicado | Por que existe |
| --- | --- | --- |
| `unq_desafio_papel_unico` | `WHERE papel_desafio IN ('DESAFIANTE','DESAFIADO')` | **Único**, não de busca. Uma `UNIQUE (id_desafio, papel_desafio)` completa proibiria o segundo `APOSTADOR`; o predicado aplica a unicidade só onde a RN09 pede |
| `idx_desafio_data_limite` | `WHERE status IN ('ABERTA','EM_ANDAMENTO')` | O `BackgroundService` varre prazos vencidos a cada ciclo (RN21). Desafio encerrado nunca aparece nessa varredura e não precisa estar no índice |
| `idx_evidencia_pendente` | `WHERE status = 'EM_VOTACAO'` | Mesma varredura, do lado da votação: só evidência em aberto pode expirar (RN16) |

Há ainda um quarto índice com predicado, `idx_notificacao_nao_lida`
(`WHERE data_leitura IS NULL`), pelo mesmo motivo: o contador de não lidas é
consultado a cada abertura do app e notificação lida só é buscada por lista
paginada.

## Próximo passo

Subir um PostgreSQL 16 (contêiner ou Aiven), aplicar `schema.sql`, aplicar os
três arquivos de `ddl/functions/` e então rodar
[`seed.sql`](../../../database/scripts/dml/seed.sql) e os casos de
[17 - Testes](../../05-qualidade/17-testes.md). Até lá, este documento descreve
uma especificação verificada por leitura, não por execução.
