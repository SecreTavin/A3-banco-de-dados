# 0017 - "Desafio" no lugar de "aposta"

* **Status:** Aceita
* **Data:** 2026-10-02
* **Decisores:** Rafael Alves

## Contexto

O núcleo do domínio se chamava `aposta`. A palavra carrega a ideia de jogo de
azar e contradiz o que o produto é: um jeito de grupos de amigos se divertirem
com desafios ([04 - Justificativa](../../00-introducao/04-justificativa.md)). Além
disso, o projeto já usava "desafio" para a categoria e para a moderação, então o
vocabulário estava dividido em dois.

## Decisão

`aposta` passa a se chamar `desafio` em todo o projeto: documentação, banco, API
e front.

| Antes | Depois |
| --- | --- |
| `aposta`, `apostas` (tabela e schema) | `desafio`, `desafios` |
| `participante_aposta`, `comentario_aposta` | `participante_desafio`, `comentario_desafio` |
| `id_aposta`, `papel_aposta` | `id_desafio`, `papel_desafio` |
| `encerrar_aposta`, `cancelar_aposta` | `encerrar_desafio`, `cancelar_desafio` |
| `APOSTA_ESCROW`, `APOSTA_ENCERRADA` | `DESAFIO_ESCROW`, `DESAFIO_ENCERRADO` |

Duas decisões acompanham a troca:

* **`APOSTADOR` continua.** É o papel de quem põe CP em um dos lados do desafio
  (`VAI_CUMPRIR` ou `NAO_VAI_CUMPRIR`); aí a ideia de apostar CP é literal. O
  nome do papel pode ser revisto à parte.
* **Proposta × desafio.** O que o usuário submete à moderação por IA é uma
  *proposta de desafio*. Aprovada, vira `desafio`; reprovada nunca vira. A tabela
  `moderacao_desafio` mantém o nome.

## Como foi aplicado no banco

A migration `RenomeiaApostaParaDesafio` usa `RENAME` (schema, tabelas, colunas,
constraints e índices), que preserva as linhas. O diff automático do EF derrubaria
e recriaria tabelas, por isso a migration é escrita à mão. Procedures, triggers e
views guardam o nome antigo no texto e são recriadas a partir de `Sql/v2-*.sql`,
cópias de `database/scripts/ddl/functions/*.sql`. Os arquivos `Sql/01..03`
ficam congelados porque a migration `ProceduresTriggersViews` ainda os lê.

**Ledger.** `economia.transacao_cp` é append-only (ADR 0007): os lançamentos
antigos com `tipo = 'APOSTA_ESCROW'` não são reescritos. A constraint aceita os
dois valores, `DESAFIO_ESCROW` (novo) e `APOSTA_ESCROW` (legado, só leitura).
Nenhuma regra lê esse campo, então a coexistência não afeta a contabilidade.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Trocar só a documentação | Pouco risco | Banco e código ficam com o nome antigo, e a banca vê dois vocabulários | Diverge do que roda |
| Editar as migrations antigas | Histórico "limpo" | Quem já aplicou as migrations não reaplica; o banco divergiria do código | Quebra bancos existentes |
| Desligar o trigger do ledger para renomear `APOSTA_ESCROW` | Valor único | Reescreve história do ledger, que a regra proíbe | Viola o ADR 0007 |

## Consequências

* Os ADRs anteriores mudaram só de terminologia; as decisões registradas
  neles permanecem.
* `docs/04-ux/telas/24` e `26` mudaram de nome de arquivo (`meus-desafios`,
  `detalhe-desafio`).
* As rotas da API passam de `/api/apostas` para `/api/desafios`, e o evento do
  SignalR de `apostaEncerrada` para `desafioEncerrado`. Clientes antigos
  deixam de funcionar.
