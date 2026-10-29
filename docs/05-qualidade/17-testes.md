# 17 - Casos de Teste e Validação

Quatro níveis de teste, com prioridade deliberada: **as constraints do banco vêm
primeiro**, porque são o que a disciplina avalia e o que é mais barato de
escrever ([ADR 0014](../02-arquitetura/adr/0014-estrategia-de-testes.md)).

> **Situação em 2026-10-06 (modelo v3):** 147 casos implementados e
> **passando** — 19 de constraint, 108 de domínio e aplicação sem banco e 20 de
> integração contra PostgreSQL real via Testcontainers. O xUnit conta cada linha
> de `Theory` como um caso. Execução: `dotnet test` em `apps/api`.

## Nível 1 — Constraints do banco

Cada caso tenta violar uma regra e espera que o **banco** recuse. Não é a
aplicação que protege; é o SGBD. Arquivo: `ConstraintTests.cs`.

| ID | Regra | Ação | Resultado esperado |
| --- | --- | --- | --- |
| T01 | RN03 | `INSERT` em `desafio` com `status = 'INVENTADO'` | Violação de `chk_desafio_status` |
| T02 | RN27 | `nivel_filtro` fora de `LEVE`/`MODERADO`/`PESADO` | Violação de `chk_grupo_nivel_filtro` |
| T03 | RN07 | `INSERT` com `valor_cp = 0` | Violação de `chk_desafio_valor_cp` |
| T04 | RN04 | Segundo voto do mesmo jurado | Exceção do trigger `trg_jurado_evidencia_valida` |
| T05 | — | `INSERT` em `desafio` com `id_grupo` inexistente | Violação de FK `fk_desafio_grupo` |
| T06 | RN09 | Dois `DESAFIADO` no mesmo desafio | Violação de `unq_desafio_papel_unico` |
| T07 | RN14 | `DESAFIANTE` inserido no júri da própria evidência | Exceção do trigger `trg_jurado_evidencia_valida` |
| T08 | RN08 | Débito que deixaria `saldo_cp` negativo | Violação de `chk_membro_saldo` |
| T09 | RN24 | `UPDATE` em `transacao_cp` | Exceção do trigger `trg_transacao_cp_imutavel` |
| T10 | RN24 | `DELETE` em `transacao_cp` | Exceção do mesmo trigger |
| T11 | RN19 | Voto em evidência `ACEITA` | Exceção do trigger `trg_jurado_evidencia_valida` |
| T12 | RN15 | Voto preenchido sem `data_voto` | Violação de `chk_jurado_voto_data` |
| T13 | RN10 | Sexta evidência no mesmo desafio | Violação de `chk_evidencia_ordem` |
| T14 | RN26 | Usuário com menos de 16 anos | Exceção do trigger `trg_usuario_idade_minima` |
| T15 | RN12 | `status = 'CANCELADA'` sem motivo | Violação de `chk_desafio_cancelamento` |
| T16 | RN28 | Moderação reprovada sem motivo | Violação de `chk_moderacao_motivo` |
| T17 | RN28 | Moderação reprovada ligada a um desafio | Violação de `chk_moderacao_desafio` |
| T18 | RN25 | `remover_membro` de quem está em desafio em curso | Recusa da procedure (SQLSTATE `EUD01`) |
| T19 | RN24, RN25 | Saída do grupo e volta | `SAIDA_GRUPO` zera a conta; `vw_reconciliacao_saldo` vazia na volta |

## Nível 2 — Domínio e aplicação, sem banco

xUnit puro, rápido (menos de um segundo). Cobre o que é lógica de agregado,
validação de entrada e integração com a IA antes de qualquer persistência.
Arquivos em `Unidade/`.

| Arquivo | O que cobre |
| --- | --- |
| `DesafioTests` | Máquina de estados: `ABERTA` → `EM_ANDAMENTO` com os dois duelistas (RN21), papel único e `APOSTADOR` livre (RN09), só entra em `ABERTA`, cancelamento só do criador e com motivo (RN12), status terminais (RN03) |
| `GrupoAmigosTests` | Criador é `ADMIN` e filtro padrão `MODERADO`; só `ADMIN` adiciona membro e muda o nível (RN25, RN27); quem pode remover quem; único `ADMIN` não sai com outros membros |
| `UsuarioTests` | Idade mínima: 16 anos exatos passam, um dia a menos é recusado com HTTP 422 (RN26) |
| `EvidenciaTests` | Júri congelado sem voto e prazo de 7 dias (RN11, RN14); quórum `floor(n/2)+1` com 1 a 5 jurados (RN15); voto só de jurado, único e com data (RN04) |
| `ModeracaoDesafioTests` | Cópia do nível, motivo obrigatório na reprovação, corte em 500 caracteres, só aprovada se liga a desafio (RN27, RN28) |
| `ValidadoresTests` | `CriarDesafioValidator`, `EnviarEvidenciaValidator` e `RegistrarVotoValidator`: cada campo inválido barrado antes do handler |
| `ModeradorDesafioTests` | Prompt com a régua do nível do grupo, texto do usuário delimitado como dado, resposta sem decisão vira falha (nunca aprovação) |
| `ChatIaTests` | Cliente da Groq contra HTTP falso: rota `/chat/completions`, modelo e temperatura; sem configuração, erro HTTP, sem rede ou resposta fora do formato viram `IaIndisponivelException` (503) |
| `ResultExtensionsTests` | Erro de domínio → status HTTP (404, 400, 409, 403, 422) com o código do erro no título |
| `IaTests` | Extração tolerante do JSON da resposta e neutralização de marcas no texto do usuário |

## Nível 3 — Integração com PostgreSQL real

Testcontainers subindo PostgreSQL de verdade. Reservado ao que um bug deixaria
invisível e caro: a liquidação dentro do banco e a conversão de dados.

| ID | Cenário | Verificação |
| --- | --- | --- |
| I01 | Ciclo completo: evidência → votos até quórum | Desafio `FINALIZADA_CUMPRIU`, CP transferido na mesma transação |
| I02 | **Reconciliação após o ciclo** | `vw_reconciliacao_saldo` e `vw_escrow_orfao` com **zero linhas** |
| I03 | Soma do ledger do grupo | Igual a `100 × membros + recompensas de voto` |
| I04 | `apurar_votacao` chamada duas vezes | Segunda chamada não altera nada |
| I05 | Maioria `INVALIDO` | Evidência recusada sem encerrar o desafio na primeira |
| I06 | Três evidências recusadas | Desafio `FINALIZADA_PERDEU`, sem escrow órfão |
| I07 | Criar desafio com a IA aprovando | Desafio criado e linha em `moderacao_desafio` ligada a ele, com o nível do grupo copiado |
| I08 | Criar desafio com a IA reprovando | Nenhum desafio; linha em `moderacao_desafio` com `aprovado = false` e o motivo |
| I09 | Criar desafio com a IA fora do ar | Exceção; nada gravado em `desafio` nem em `moderacao_desafio` |
| I10 | Envio de evidência | Júri congelado em `jurado_evidencia` sem as partes; desafio `EM_VOTACAO` |
| I11 | Migration `AlinhamentoModeloV3` sobre banco povoado no modelo anterior | Só o schema `public`, com as 10 tabelas; linhas e saldos preservados; validador + voto viram `jurado_evidencia`; valor monetário e prenda viram `descricao_recompensa`; o voto que faltava fecha o desafio |

**I02 é o teste mais importante do projeto.** A view `vw_reconciliacao_saldo`
deve estar sempre vazia; qualquer linha significa que o saldo materializado
divergiu do ledger.

Os testes de criação de desafio substituem a Groq por um moderador falso: o
comportamento do provedor em si é coberto no nível 2 (`ChatIaTests`), e a
chamada real depende da chave, que fica fora do repositório.

## Nível 4 — Arquitetura

> **Especificado, não implementado.** A convenção é hoje garantida por revisão.

Testes que falham quando uma convenção é violada, para que a regra não dependa
de alguém lembrar na revisão:

* Nenhum handler de `Query` referencia `DbContext`.
* Nenhum handler de `Command` referencia Dapper.
* Nenhum módulo referencia tipos internos de outro módulo.

## Execução

```bash
cd apps/api && dotnet test
```

Requer Docker: cada classe de integração sobe seu próprio PostgreSQL via
Testcontainers e aplica as migrations — incluindo procedures e triggers, que são
justamente o que se quer exercitar. Só os testes sem banco:

```bash
cd apps/api && dotnet test --filter "FullyQualifiedName~Tests.Unidade"
```

Quando houver CI, os níveis 1, 3 e 4 rodam a cada PR em `ubuntu-latest` — os runners
Windows e macOS hospedados não têm Docker utilizável para contêineres Linux. O
CI também aplica o `schema.sql` num PostgreSQL limpo, o que prova a cada commit
que o DDL do [documento 12](../03-banco-de-dados/implementacao/12-ddl-schema.md)
é válido e aplicável.
