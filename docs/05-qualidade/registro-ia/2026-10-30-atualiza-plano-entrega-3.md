# 2026-10-30 — Atualiza o plano de trabalho para o fechamento da Entrega 3

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/00-introducao/07-plano-de-trabalho.md` |

## O que foi pedido

O professor confere o plano de trabalho no GitHub na revisão de hoje. As
semanas de 09/10 e 30/10 ainda apareciam como "Planejado". Pedido: refletir o
estado real do repositório.

## O que a IA produziu

* Status e responsáveis das semanas de 09/10, 23/10 e 30/10 a partir do
  histórico de commits e PRs (#3, #32, #33 a #36).
* Gantt por integrante: modelo v3 (Arthur, 05–06/10), fechamento da Entrega 3
  (Octávio, 29/10) e redesign do front e MinIO (Rafael, 30/10).

## O que a IA errou

* **Atribuição trocada.** O primeiro texto creditava o PR #33 a Rafael. O autor
  é Octávio (`SecreTavin`); a atribuição foi corrigida conferindo `gh pr view`.
* **Semana 23/10.** A IA não tem como saber se a Prova A1 ocorreu como planejado;
  por isso a linha diz "sem rastro no repositório" em vez de "Concluído".

## Como o time validou

Conferência de cada afirmação contra `git log`, `gh pr list` e os registros de IA
já existentes; o texto da semana 30/10 diz "em andamento" porque a tag
`entrega-3` só sai depois da revisão.

## Decisão final

Entra a atualização do plano. O Gantt segue só com o que tem rastro.
