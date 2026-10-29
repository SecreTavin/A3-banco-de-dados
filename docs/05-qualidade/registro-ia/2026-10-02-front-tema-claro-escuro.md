# 2026-10-02 — Front: tema claro e escuro, fontes maiores, sem rolagem vertical

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `apps/web/index.html`, `apps/web/src/estilos/global.css`, `apps/web/src/shared/ui/*` (shell, `BotaoTema`, `tema.ts`), CSS dos módulos |

## O que foi pedido

Protótipo final da apresentação com fontes legíveis, sem rolagem vertical, e
otimizado para tema claro e escuro e para celular.

## O que a IA produziu

* Tokens de cor para os dois temas, aplicados antes da primeira pintura por um
  script em `index.html` (preferência salva ou a do sistema), e botão de tema
  no topo.
* Fonte base de 15px para 17px e escala dos tamanhos menores (mínimo 13px).
* Página em `100dvh` com `overflow: hidden`.
* Cores fixas dos módulos CSS trocadas por tokens.

## O que a IA errou

* **Rolagem desligada corta conteúdo.** Com `overflow: hidden`, telas com mais
  itens que a janela (lista de desafios, ranking, detalhe) perdem o que passa
  da altura. A IA seguiu o pedido ao pé da letra; o time deve decidir, tela por
  tela, se compacta o conteúdo ou aceita a rolagem interna.
* **Não verificado visualmente.** As telas exigem login e API; só `tsc` e
  `vite build` rodaram. Contrastes do tema claro foram escolhidos por estimativa,
  sem medição.

## Como o time validou

`tsc --noEmit` e `vite build` sem erro. Falta passar pelas telas nos dois temas,
em tela de celular e de projetor.

## Decisão final

Entra sem commit, a pedido do grupo (apresentação).
