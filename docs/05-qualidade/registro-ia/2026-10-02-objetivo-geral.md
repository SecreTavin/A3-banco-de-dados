# 2026-10-02 — Objetivo geral descreve o que o sistema é

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/00-introducao/05-objetivos.md` |

## O que foi pedido

Trocar a menção solta ao nome "Eu Duvido!" no objetivo geral por uma descrição
do que o sistema é.

## O que a IA produziu

Objetivo geral reescrito: "plataforma web de desafios sociais entre amigos",
com criação de desafios, evidências, votação do júri e recompensas em créditos
virtuais ou prendas. O nome permanece entre parênteses.

## O que a IA errou

* "Créditos virtuais" é a leitura da IA para o CP; conferir se o termo bate
  com o glossário do projeto.
* O texto antigo falava em "apostas, prendas e votações"; a IA acrescentou
  "desafios" sem checar se o projeto trata desafio e aposta como a mesma
  entidade (no modelo, `aposta`).

## Como o time validou

Leitura contra os objetivos específicos, para que o geral não prometa nada
que eles não cubram.

## Decisão final

Entra com a descrição ampliada. Alteração só no working tree, sem commit, a
pedido do grupo (apresentação).
