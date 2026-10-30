# 2026-10-30 — Correções de responsividade, legibilidade e toque no front

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `apps/web/src/estilos/global.css`, `shared/ui/shell.module.css`, `shared/ui/ui.module.css`, `shared/ui/Avatar.tsx`, `features/grupos/grupos.module.css`, `features/perfil/perfil.module.css`, `features/desafios/desafios.module.css`, `features/ranking/ranking.module.css` |

## O que foi pedido

Corrigir o que uma auditoria de responsividade e legibilidade achou no front
antes da apresentação: conteúdo inalcançável por causa do `overflow: hidden`,
estouro horizontal no detalhe do grupo no celular, avatares quebrados,
contraste abaixo de 4,5:1 (WCAG AA) e alvos de toque pequenos.

## O que a IA produziu

* **Rolagem na área de conteúdo.** `.conteudo` passou de `overflow: hidden` para
  `overflow-y: auto` com `overscroll-behavior: contain` e barra discreta. `html`,
  `body` e `#root` seguem travados em `100dvh`; topo e navegação continuam fixos.
  O padding inferior ganhou `env(safe-area-inset-bottom)`.
* **Linha de membro.** A lista usa `minmax(0, 1fr)`, a linha quebra
  (`flex-wrap`) e o apelido tem `min-width: 0`. O botão "Remover" desce para a
  linha de baixo quando não cabe.
* **Avatar** cai nas iniciais quando a imagem falha (`onError`), sem mudar as
  props do componente. As URLs do seed (`lh3.googleusercontent.com/a/...`) não
  existem.
* **Contraste**, só nos tokens: escuro `--texto-fraco` `#6b7389`→`#8189a0`,
  `--primaria` `#7c5cff`→`#7552f5` (texto branco do botão), `--em-votacao`
  `#a855f7`→`#b66dff`, `--cancelada` `#6b7280`→`#8b93a1`; claro `--perdeu`
  `#dc2626`→`#cc1f1f`. Valores calculados antes de aplicar.
* **Toque:** botões de tema e sair 34→44px; chips de filtro e botão pequeno
  com padding vertical de 10px (≈44px); "voltar" com 44px de altura; o link do
  grupo no Perfil passou a cobrir a linha inteira (mesmo padrão do card de
  desafio).

## O que a IA errou

* **A primeira auditoria não listou os alvos de toque.** A saída daquela etapa
  veio vazia e a IA tratou como "não verificado" em vez de "nada encontrado"; só
  a segunda medição, com script novo, mostrou 19 alvos abaixo de 40px.
* **Regressão que a própria correção causou.** Com os botões do topo em 44px, em
  360px de largura o título "Eu Duvido!" quebrava em duas linhas. Só apareceu
  ao olhar a captura de tela, não nas métricas. Corrigido com `white-space:
  nowrap` e escondendo o apelido abaixo de 400px (o avatar permanece).
* **Medição de toque com falso positivo.** Os botões de 40px saíam como "<40"
  por arredondamento de fração; subiram para 44px. O `getBoundingClientRect` não
  conta o `::after` que estende a área clicável: os links `saldoGrupo` (Perfil) e
  `desafioTitulo` (card) continuam listados com 23px/26px, embora a linha/card
  inteiro seja clicável — conferido por `elementFromPoint` no canto da linha.
* **Contraste estimado fora dos tokens.** O medidor só considera o fundo sólido
  mais próximo; fundos com gradiente e `backdrop-filter` (topo, navegação)
  foram aproximados. O hover do botão primário usa `brightness(1.12)`, que
  clareia o fundo e reduz o contraste do texto branco; esse estado não foi
  medido.

## Como o time validou

* Script em Chrome headless (Playwright) contra a API local, em 4 tamanhos
  (360×640, 390×844, 1366×768, 1920×1080), nos dois temas e em 8 rotas, antes e
  depois. Depois: nenhum overflow horizontal, zero contrastes abaixo de AA,
  rolagem até o fim sem o último item ficar atrás da navegação, e os alvos de
  toque reduzidos de 19 para os 5 falsos positivos acima.
* `tsc -b` e `npm run build` sem erro.
* **Pendente:** validação visual pelo time, em celular real (inclusive iOS
  Safari, onde `100dvh` e a barra de endereço se comportam diferente do Chrome
  emulado) e no projetor da apresentação.

## Decisão final

Entram as correções acima em `fix/ux-responsividade`. A rolagem volta a existir
dentro da área de conteúdo — a decisão de "página sem rolagem" de 02/10 passa a
valer só para a página, não para o conteúdo, porque cortar conteúdo era pior do
que rolar.
