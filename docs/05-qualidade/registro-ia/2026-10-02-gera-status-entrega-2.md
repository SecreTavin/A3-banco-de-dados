# 2026-10-02 — Regenera status da Entrega 2

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/07-entregas/README.md`, `docs/07-entregas/entrega-2-modelagem.md` |

## O que foi pedido

Rodar `scripts/entregas/gerar-entregas.mjs` depois do merge do PR #18, para
fechar a Entrega 2.

## O que a IA produziu

Execução do script e commit da saída (status da Entrega 2 de "Pronta" para
"Entregue").

## O que a IA errou

* O roteiro anterior mandava criar a tag `entrega-2` ao final. A tag já existia
  no remoto, apontando para o merge do PR #17, e a IA só percebeu ao listar as
  tags depois de rodar o script. A tag **não foi movida**: ela não inclui a
  correção de contagem do PR #18 (só números em dois docs). Mover tag publicada
  é decisão do time.

## Como o time validou

Saída do script conferida contra `git diff` (só as duas linhas de status
mudaram) e `git ls-remote --tags origin` para a situação da tag.

## Decisão final

Entra apenas o status regenerado. A tag `entrega-2` permanece em `56eef64`.
