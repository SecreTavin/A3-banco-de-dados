# 2026-10-02 — Público-alvo na introdução e no documento 06

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/00-introducao/06-publico-alvo.md`, `docs/00-introducao/02-introducao.md` |

## O que foi pedido

Explicar na introdução geral para quem o projeto é direcionado.

## O que a IA produziu

* `06-publico-alvo.md` expandido: seção "Para quem é" (grupos de amigos a
  partir de 16 anos, por lazer) e tabela dos três papéis de uso.
* Parágrafo em `02-introducao.md` com o público e link para o `06`.

## O que a IA errou

* Ao propor o texto, a IA primeiro levantou a hipótese de uma faixa etária-alvo
  (ex.: universitários), que não está documentada em lugar nenhum. Foi
  descartada: só entram fatos já registrados (RF16, ADR 0015, justificativa).
* A tabela de papéis descreve o que cada papel faz com base no fluxo de
  apostas já documentado; não foi conferida tela por tela.

* Numa segunda rodada, o time informou o perfil (estudantes e amigos) e a IA
  o incorporou. O parágrafo sobre o meio estudantil (turmas, rotina de aulas e
  provas, uso do celular, júri que se conhece) é **argumento da IA, sem
  pesquisa ou dado por trás**. O time deve conferir se reflete o público real.

## Como o time validou

Conferência da regra dos 16 anos e da moderação contra RF16 e contra a seção
(e) de `09-evolucao-modelagem.md`; conferência do link para o ADR 0015.

## Decisão final

Entra sem perfil demográfico além dos 16 anos. Alteração mantida só no
working tree, sem commit, a pedido do grupo (apresentação).
