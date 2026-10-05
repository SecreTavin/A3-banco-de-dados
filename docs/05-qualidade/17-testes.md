# 17 - Casos de Teste e Validação

Três níveis de teste, com prioridade deliberada: **as constraints do banco vêm
primeiro**, porque são o que a disciplina avalia e o que é mais barato de
escrever ([ADR 0014](../02-arquitetura/adr/0014-estrategia-de-testes.md)).

> **Situação em 2026-09-03:** 21 testes implementados e **passando** contra
> PostgreSQL real via Testcontainers — 15 de constraint e 6 de integração.
> Execução: `dotnet test` em `apps/api`.
>
> **Situação em 2026-10-05:** suíte reescrita para o modelo v3 (20 de
> constraint, 6 de integração e testes puros da integração com IA em
> `IaTests.cs`). **Ainda não executada** depois da reescrita — rodar
> `dotnet test` antes do merge.

## Nível 1 — Constraints do banco

Cada caso tenta violar uma regra e espera que o **banco** recuse. Não é a
aplicação que protege; é o SGBD.

| ID | Regra | Ação | Resultado esperado |
| --- | --- | --- | --- |
| T01 | RN03 | `INSERT` em `aposta` com `status = 'INVENTADO'` | Violação de `chk_aposta_status` |
| T02 | RN27 | `nivel_filtro = 'NENHUM'` em `grupo_amigos` | Violação de `chk_grupo_nivel_filtro` |
| T03 | RN07 | `INSERT` com `valor_cp = 0` | Violação de `chk_aposta_valor_cp` |
| T04 | RN04 | Segundo voto do mesmo jurado na mesma evidência | Exceção do trigger `trg_jurado_evidencia_valida` ("já votou") |
| T05 | — | `INSERT` em `aposta` com `id_grupo` inexistente | Violação de FK `fk_aposta_grupo` |
| T06 | RN09 | Dois `DESAFIADO` na mesma aposta | Violação de `unq_aposta_papel_unico` |
| T07 | RN14 | `DESAFIANTE` incluído no júri da própria aposta | Exceção do trigger `trg_jurado_evidencia_valida` |
| T08 | RN08 | Débito que deixaria `saldo_cp` negativo | Violação de `chk_membro_saldo` |
| T09 | RN24 | `UPDATE` em `transacao_cp` | Exceção do trigger `trg_transacao_cp_imutavel` |
| T10 | RN24 | `DELETE` em `transacao_cp` | Exceção do mesmo trigger |
| T11 | RN19 | Voto em evidência `ACEITA` | Exceção do trigger `trg_jurado_evidencia_valida` |
| T12 | RN15 | Voto sem `data_voto` | Violação de `chk_jurado_voto_data` |
| T13 | RN10 | Sexta evidência na mesma aposta | Violação de `chk_evidencia_ordem` |
| T14 | RN26 | Usuário com 15 anos | Exceção do trigger `trg_usuario_idade_minima` |
| T15 | RN12 | `status = 'CANCELADA'` sem motivo | Violação de `chk_aposta_cancelamento` |
| T16 | RN28 | Moderação reprovada sem motivo | Violação de `chk_moderacao_motivo` |
| T17 | RN28 | Moderação reprovada ligada a uma aposta | Violação de `chk_moderacao_aposta` |
| T18 | RN29 | Verificação de prova recusada ligada a uma evidência | Violação de `chk_verificacao_evidencia` |
| T19 | RN25 | Saída do grupo com aposta em curso | Exceção da procedure `remover_membro` |
| T20 | RN25 | Saída e volta ao grupo | Ledger da conta zerado por `SAIDA_GRUPO`; `vw_reconciliacao_saldo` vazia |

## Nível 2 — Domínio, sem banco

> **Especificado, não implementado.** O domínio rico existe e é exercitado
> indiretamente pelos testes de integração; estes casos isolados ficaram para
> a próxima iteração.

xUnit puro, rápido. Cobre o que é lógica de agregado antes de qualquer
persistência.

| ID | Cenário | Espera |
| --- | --- | --- |
| D01 | Cálculo de quórum com 3, 4, 5 e 6 validadores | 2, 3, 3, 4 |
| D02 | Transição inválida (`ABERTA` → `FINALIZADA_CUMPRIU`) | `Result.Fail` |
| D03 | Aceitar aposta já `EM_VOTACAO` | `Result.Fail` |
| D04 | Divisão de pote com resto (7 CP para 2 vencedores) | 4 e 3, somando 7 |
| D05 | Cancelar aposta sem motivo | `Result.Fail` |

O caso D04 existe porque CP é inteiro: a divisão do pote precisa somar
exatamente o pote, sem centavo perdido.

## Nível 3 — Integração com PostgreSQL real

Testcontainers subindo PostgreSQL de verdade. Reservado às duas coisas onde um
bug seria invisível e caro.

| ID | Cenário | Verificação |
| --- | --- | --- |
| I01 | Ciclo completo: cria aposta → aceita → evidência → votos até quórum | Aposta `FINALIZADA_CUMPRIU`, CP transferido |
| I02 | **Reconciliação após o ciclo** | `vw_reconciliacao_saldo` retorna **zero linhas** |
| I03 | Soma do ledger do grupo | Igual a `100 × membros + recompensas de voto` |
| I04 | Dois votos simultâneos atingindo quórum | Aposta encerra **uma** vez só |
| I05 | `apurar_votacao` chamada duas vezes | Segunda chamada não altera nada |
| I06 | Cancelamento após escrow | Todos os participantes recebem estorno integral |
| I07 | Três evidências recusadas | Aposta `FINALIZADA_PERDEU`, sem escrow órfão |

Estes seis rodam de fato. **I02 é o teste mais importante do projeto.** A view
`economia.vw_reconciliacao_saldo` deve estar sempre vazia; qualquer linha
significa que o saldo materializado divergiu do ledger. Um teste que a consulta
após um ciclo completo prova que a contabilidade fecha.

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

Requer Docker: cada classe de teste sobe seu próprio PostgreSQL via
Testcontainers e aplica as migrations — incluindo procedures e triggers, que são
justamente o que se quer exercitar.

Quando houver CI, os níveis 1, 3 e 4 rodam a cada PR em `ubuntu-latest` — os runners
Windows e macOS hospedados não têm Docker utilizável para contêineres Linux. O
CI também aplica o `schema.sql` num PostgreSQL limpo, o que prova a cada commit
que o DDL do [documento 12](../03-banco-de-dados/implementacao/12-ddl-schema.md)
é válido e aplicável.
