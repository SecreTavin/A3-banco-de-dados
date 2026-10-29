# 12 - Implementação do Banco de Dados (DDL)

SGBD: **PostgreSQL 16** ([ADR 0001](../../02-arquitetura/adr/0001-stack-tecnologica.md)).
O DDL está em
[`database/scripts/ddl/schema.sql`](../../../database/scripts/ddl/schema.sql) e
materializa o [11 - Modelo Lógico](../modelagem/11-modelo-logico.md): **10
tabelas em um único schema (`public`)**, 18 chaves estrangeiras, 24 `CHECK`,
24 índices, 4 triggers, 7 procedures e 5 views.

## Executado e verificado

O DDL roda contra um PostgreSQL 16 real a cada execução dos testes
automatizados (Testcontainers) e a cada `docker compose up`. A verificação de
29/10/2026 aplicou o `schema.sql` e o
[`seed.sql`](../../../database/scripts/dml/seed.sql) num banco vazio e
conferiu, no catálogo do PostgreSQL, que tabelas, colunas, tipos,
obrigatoriedade, constraints, índices e triggers batem um a um com o 11. As
duas views de reconciliação contábil voltaram vazias.

## O arquivo é gerado, não escrito

`schema.sql` é **gerado a partir das migrations do EF Core** e nunca editado à
mão ([ADR 0004](../../02-arquitetura/adr/0004-schema-sql-gerado-por-migration.md)):

```bash
dotnet ef migrations script --idempotent --output database/scripts/ddl/schema.sql
```

Mudança de schema começa no modelo C#, vira migration, e só então o `.sql` é
regenerado. O script é *idempotente*: aplica só as migrations que o banco ainda
não tem, por isso serve tanto para banco vazio quanto para banco antigo.

O que o EF **não** gera — procedures, triggers e views — vive em
[`database/scripts/ddl/functions/`](../../../database/scripts/ddl/functions/) e
é aplicado por migration, carregando o `.sql` como *embedded resource* e
passando a string para `migrationBuilder.Sql()` (o EF Core não tem
`migrationBuilder.SqlFile()`).

### Histórico de migrations

| Migration | O que faz |
| --- | --- |
| `InicialSchema` (03/09) | Primeiro desenho: 15 tabelas em 6 schemas |
| `ProceduresTriggersViews` (03/09) | Procedures, triggers e views do primeiro desenho |
| `RenomeiaApostaParaDesafio` (03/10) | `aposta` → `desafio` com `RENAME`, preservando as linhas ([ADR 0017](../../02-arquitetura/adr/0017-desafio-no-lugar-de-aposta.md)) |
| `AlinhamentoModeloV3` (06/10) | Leva ao modelo atual: schema único, `jurado_evidencia`, idade mínima, nível de filtro, moderação; remove convite, comentário, credencial e notificações ([ADR 0016](../../02-arquitetura/adr/0016-schema-unico-e-modelo-enxuto.md)) |

Migrations aplicadas nunca são reescritas: quem já tem o banco antigo recebe só
a diferença. A `AlinhamentoModeloV3` converte os dados existentes — validador e
voto se fundem em `jurado_evidencia` sem perder nenhum voto — e há teste
automatizado (`MigracaoModeloV3Tests`) que povoa um banco no desenho anterior,
aplica a migration e confere o resultado. Os scripts de procedures de cada
versão ficam congelados (`Sql/01..03`, `Sql/v2-*`) porque as migrations antigas
ainda os leem; a versão atual é `Sql/v3-*`, cópia de `ddl/functions/`.

## Schema único

Até a `AlinhamentoModeloV3` havia um schema por módulo do monólito
([ADR 0005](../../02-arquitetura/adr/0005-schema-por-modulo-postgres.md),
substituído). As FKs já atravessavam todos eles, então a separação só obrigava
a qualificar cada nome sem acrescentar integridade. Os módulos continuam
existindo no código C#; no banco, tudo está em `public`.

## Objetos em `ddl/functions/`

### [`01-apurar-votacao.sql`](../../../database/scripts/ddl/functions/01-apurar-votacao.sql)

`apurar_votacao(p_id_evidencia INT)` — o coração do sistema. Chamada pela
aplicação após cada voto e pelo `BackgroundService` ao expirar o prazo.

* Trava a evidência com `FOR UPDATE`, serializando votos concorrentes.
* Idempotente: evidência já apurada retorna sem efeito.
* Calcula o quórum sobre o júri congelado em `jurado_evidencia`, nunca sobre o
  grupo atual (RN14, RN15).
* Decide `ACEITA` / `RECUSADA` / `EXPIRADA`; empate dentro do prazo mantém
  aberto (RN16).
* Aciona `creditar_recompensa_voto` quando a decisão coletiva se concretiza (RN17).
* Encerra o desafio em `ACEITA`, ou quando acumulam 3 recusadas ou a quinta
  evidência se esgota (RN10).

Roda inteira em uma transação: não existe estado em que a evidência foi aceita
mas o CP não foi pago.

### [`02-economia.sql`](../../../database/scripts/ddl/functions/02-economia.sql)

Toda movimentação de CP passa por aqui.

| Procedure | Papel | Regra |
| --- | --- | --- |
| `lancar` | Lançamento primitivo: escreve no ledger e atualiza o saldo materializado na mesma transação | RN24 |
| `debitar_escrow` | Débito no aceite — duas linhas, o CP muda de lugar e não é destruído | RN18 |
| `creditar_recompensa_voto` | 2 CP para quem votou em evidência que atingiu quórum | RN17 |
| `encerrar_desafio` | Divide o pote entre quem acertou; o resto da divisão inteira vai para o primeiro vencedor | RN23 |
| `cancelar_desafio` | Estorna o escrow de cada participante e grava o motivo | RN12 |
| `remover_membro` | Recusa a saída de quem está em desafio em andamento ou em júri aberto; senão zera o saldo com `SAIDA_GRUPO` e remove o membro | RN25 |

### [`03-triggers-e-views.sql`](../../../database/scripts/ddl/functions/03-triggers-e-views.sql)

Triggers guardam o que nunca pode ser violado, mesmo por acesso direto ao banco.

| Trigger | Tabela | Momento | Garante | Regra |
| --- | --- | --- | --- | --- |
| `trg_usuario_idade_minima` | `usuario` | `BEFORE INSERT OR UPDATE` | Idade ≥ 16 anos na data do cadastro | RN26 |
| `trg_jurado_evidencia_valida` | `jurado_evidencia` | `BEFORE INSERT OR UPDATE` | Só se vota em evidência `EM_VOTACAO` e dentro do prazo | RN19 |
| `trg_transacao_cp_imutavel` | `transacao_cp` | `BEFORE UPDATE OR DELETE` | Ledger append-only — levanta exceção sempre | RN24 |
| `trg_membro_credito_inicial` | `membro_grupo` | `AFTER INSERT` | Lança os 100 CP de entrada no ledger | RN06 |

A idade mínima é trigger, e não `CHECK`, porque depende da data corrente e o
PostgreSQL só aceita expressões imutáveis em `CHECK`. O trigger compara com
`data_cadastro`, não com `CURRENT_DATE`, para a linha continuar válida em
qualquer reavaliação.

Views no mesmo arquivo — `vw_reconciliacao_saldo`, `vw_escrow_orfao`,
`vw_status_votacao`, `vw_cp_em_escrow` e `vw_moderacao_por_nivel` — descritas em
[16 - Consultas SQL](16-consultas-sql.md).

## Chaves estrangeiras

18 FKs. O comportamento na exclusão segue o significado da relação:

| Comportamento | Onde | Por quê |
| --- | --- | --- |
| `CASCADE` | grupo → membros, desafios, lançamentos, moderações; desafio → participantes, evidências; evidência → jurados; usuário → participações em grupo | A linha filha não tem sentido sem a mãe |
| `SET NULL` | `moderacao_desafio.id_desafio` | A avaliação é auditoria e sobrevive ao desafio |
| `RESTRICT` | usuário como criador, autor, jurado ou titular de lançamento; categoria; `transacao_cp.id_desafio` | Apagar a mãe apagaria histórico — o ledger é append-only |

## Constraints e as regras que garantem

### `CHECK`

| Constraint | Tabela | O que recusa | Regra |
| --- | --- | --- | --- |
| `chk_grupo_nivel_filtro` | `grupo_amigos` | Nível fora de `LEVE`, `MODERADO`, `PESADO` | RN27 |
| `chk_membro_papel` | `membro_grupo` | Papel fora de `ADMIN`, `MEMBRO` | RN25 |
| `chk_membro_saldo` | `membro_grupo` | Saldo negativo | RN08 |
| `chk_desafio_tipo` | `desafio` | Tipo de recompensa fora dos 4 valores | RN01 |
| `chk_desafio_valor_cp` | `desafio` | Desafio que não custa CP | RN07 |
| `chk_desafio_status` | `desafio` | Status fora dos 6 valores | RN03 |
| `chk_desafio_cancelamento` | `desafio` | Cancelamento sem motivo | RN12 |
| `chk_desafio_encerramento` | `desafio` | Status terminal sem `data_encerramento` | RN03 |
| `chk_moderacao_nivel` | `moderacao_desafio` | Nível fora dos 3 valores | RN27 |
| `chk_moderacao_motivo` | `moderacao_desafio` | Reprovação sem motivo | RN28 |
| `chk_moderacao_desafio` | `moderacao_desafio` | Avaliação reprovada ligada a um desafio | RN28 |
| `chk_participante_papel` | `participante_desafio` | Papel fora de `DESAFIANTE`, `DESAFIADO`, `APOSTADOR` | RN09 |
| `chk_participante_escolha` | `participante_desafio` | Escolha fora de `VAI_CUMPRIR`, `NAO_VAI_CUMPRIR` | — |
| `chk_evidencia_midia` | `evidencia` | Mídia fora de `FOTO`, `VIDEO`, `LINK`, `TEXTO` | — |
| `chk_evidencia_status` | `evidencia` | Status fora dos 4 valores | RN13 |
| `chk_evidencia_ordem` | `evidencia` | Ordem fora de 1..5 | RN10 |
| `chk_evidencia_votacao` | `evidencia` | Prazo de votação anterior ao envio | RN11 |
| `chk_evidencia_apuracao` | `evidencia` | Evidência apurada sem `data_apuracao` | RN13 |
| `chk_jurado_voto` | `jurado_evidencia` | Voto fora de `VALIDO`, `INVALIDO` | RN15 |
| `chk_jurado_voto_data` | `jurado_evidencia` | Voto sem data, ou data sem voto | RN15 |
| `chk_transacao_tipo` | `transacao_cp` | Tipo fora dos lançamentos previstos | RN24 |
| `chk_transacao_valor` | `transacao_cp` | Lançamento de valor zero | RN24 |
| `chk_transacao_conta` | `transacao_cp` | Lançamento sem usuário e sem desafio | RN24 |
| `chk_transacao_escrow` | `transacao_cp` | Retenção (escrow) sem desafio | RN18 |

`chk_transacao_tipo` aceita `CREDITO_INICIAL`, `DESAFIO_ESCROW`, `PREMIO`,
`ESTORNO`, `RECOMPENSA_VOTO` e `SAIDA_GRUPO`, mais o legado `APOSTA_ESCROW`: os
lançamentos gravados antes da renomeação não podem ser reescritos, porque o
ledger é append-only ([ADR 0017](../../02-arquitetura/adr/0017-desafio-no-lugar-de-aposta.md)).

### `UNIQUE` e chaves compostas

| Restrição | Tabela | O que impede | Regra |
| --- | --- | --- | --- |
| `unq_usuario_email` | `usuario` | Dois cadastros com o mesmo e-mail | RN05 |
| `unq_categoria_nome` | `categoria_desafio` | Categoria duplicada | — |
| `unq_membro_grupo` | `membro_grupo` | Entrada duplicada no grupo | — |
| `unq_participante_desafio` | `participante_desafio` | Dois papéis para o mesmo usuário no desafio | RN09 |
| `unq_desafio_papel_unico` (parcial) | `participante_desafio` | Segundo `DESAFIANTE` ou segundo `DESAFIADO` | RN09 |
| `unq_evidencia_ordem` | `evidencia` | Duas evidências na mesma posição da sequência | RN10 |
| `unq_moderacao_desafio` | `moderacao_desafio` | Duas avaliações para o mesmo desafio | RN28 |
| PK `(id_evidencia, id_usuario)` | `jurado_evidencia` | Voto em dobro e voto de quem não está no júri | RN04, RN14 |

A chave composta de `jurado_evidencia` faz o trabalho que no primeiro desenho
exigia duas tabelas e uma FK composta: como votar é preencher a linha que já
existe, não há como votar duas vezes nem votar sem ter sido convocado.

## Índices parciais

Três dos 24 índices são parciais — cobrem só o subconjunto de linhas que as
consultas realmente varrem, o que os mantém pequenos mesmo com a tabela
crescendo.

| Índice | Predicado | Por que existe |
| --- | --- | --- |
| `unq_desafio_papel_unico` | `WHERE papel_desafio IN ('DESAFIANTE','DESAFIADO')` | **Único**, não de busca. Uma `UNIQUE (id_desafio, papel_desafio)` completa proibiria o segundo `APOSTADOR`; o predicado aplica a unicidade só onde a RN09 pede |
| `idx_desafio_data_limite` | `WHERE status IN ('ABERTA','EM_ANDAMENTO')` | O `BackgroundService` varre prazos vencidos a cada ciclo (RN21). Desafio encerrado nunca aparece nessa varredura |
| `idx_evidencia_pendente` | `WHERE status = 'EM_VOTACAO'` | Mesma varredura, do lado da votação: só evidência em aberto pode expirar (RN16) |

## Como aplicar

```bash
docker compose up
```

O contêiner do PostgreSQL executa `schema.sql` e depois `seed.sql` na primeira
subida; a API, ao iniciar, aplica qualquer migration que falte. Povoamento em
[13 - Povoamento](13-povoamento-dml.md).
