# 2026-10-02 — Visão MVP no DER

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/03-banco-de-dados/modelagem/10-der.md` |

## O que foi pedido

Simplificar a modelagem para a explicação oral da Entrega 2: um "MVPzão",
sem considerar migration ou app.

## O que a IA produziu

Seção "Visão MVP" no início do `10-der.md`, com DER de 8 tabelas (as da v1) e
lista das extensões. O DER completo foi mantido.

## O que a IA errou

* A IA entendeu o pedido como "reduzir o modelo" e propôs, antes de editar,
  apenas um roteiro de fala. O time esclareceu que queria a simplificação no
  documento.
* A IA decidiu **não** apagar tabelas do DER: isso faria `09`, `11` e os ADRs
  0007/0008 contradizerem o diagrama. Escolheu uma visão adicional. Essa é uma
  decisão de escopo da IA, não do time, e está aberta a revisão.

## Como o time validou

O diagrama foi conferido contra as relações do DER completo (mesmos nomes e
cardinalidades, só um subconjunto). A renderização do Mermaid **não** foi
testada localmente nem no GitBook.

## Decisão final

Entra a visão MVP como adição. Nenhuma tabela, regra ou ADR foi alterada.
