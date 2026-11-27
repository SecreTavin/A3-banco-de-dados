# 2026-11-27 — Banca Final marcada como entregue

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Martins Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/07-entregas/README.md`, `docs/07-entregas/banca-final.md`, `docs/05-qualidade/18-registro-ia.md` |

## O que foi pedido

Deixar a Banca Final como "Entregue" nos documentos, em vez de "Pronta para entrega".

## Prompt utilizado

> atualize os documentos para deixar a banca como entregue, la ta pronta para entrega, ou ta certo?

## O que a IA produziu

* Rodou `node scripts/entregas/gerar-entregas.mjs` depois da tag `banca-final` existir no repositório. O script trocou o status para "🟢 Entregue (3/3) · tag `banca-final` em 2026-11-27" nos dois documentos. Nada foi editado à mão.
* Índice de registros de IA e contagem (83 → 84).

## O que a IA errou

* Ao criar a tag, a IA avisou que o status só mudaria numa geração posterior, mas não regerou os documentos na hora. Ficou "Pronta para entrega" até o Rafael perguntar.
* A tag `banca-final` aponta para o merge do PR #87, que não tem esta mudança. Mover a tag para o merge deste PR depende de push forçado e fica para decisão do Rafael.

## Como o time validou

* O script rodou sem erro e só os dois trechos esperados mudaram no `git diff`.

## Decisão final

Status "Entregue" nos documentos, gerado pelo script.
