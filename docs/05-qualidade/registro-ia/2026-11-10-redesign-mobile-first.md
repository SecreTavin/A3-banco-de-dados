# 2026-11-10 — Redesign mobile-first com tema claro padrão

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-10 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Fable 5.1) |
| **Artefato afetado** | `apps/web/index.html`, `apps/web/src/main.tsx`, `apps/web/src/estilos/global.css`, `apps/web/src/shared/ui/*` (shell, botão de tema, componentes), os `*.module.css` de todas as features, `LoginView.tsx`, `PerfilView.tsx`, `apps/web/package.json` (fontes), `docs/04-ux/propostas/redesign-mobile/` |

## O que foi pedido

Redesenhar toda a UI com prioridade para o celular, temas claro e escuro com o
claro como padrão, buscando referências de design para o produto ficar
reconhecível num pitch, em uma branch própria, sem deixar o desktop de lado.

## Prompt utilizado

> Fala chefe, quero que redesenhe toda a UI do sistema interno, facilitando e otimizando para telefone, com temas claro e escuro, sendo o claro primário do sistema... Busque as melhores referências e padrões de design para tornar nosso produto único e diferenciado de outros, facilitando para apresentação em pitch, crie uma branch para essa re-adaptação de layout, priorize mobile mas faça desktop também

## O que a IA produziu

* Pesquisa de referências (navegação inferior no celular segundo HIG e
  Material 3, temas por tokens com `color-scheme`, pareamento de fontes) e a
  direção visual "papel, tinta e dourado", com o desafio como bilhete picotado,
  o júri como carimbo e a marca "?!". Tudo documentado em
  [Redesign mobile-first](../../04-ux/propostas/redesign-mobile/README.md).
* Tokens novos em `global.css` com o claro em `:root` e o escuro só redefinindo
  valores; tema claro como padrão no `index.html`; favicon e `theme-color`.
* Fontes Bricolage Grotesque e Figtree servidas pelo próprio app
  (`@fontsource-variable`), sem dependência de rede na apresentação.
* `AppShell` novo: um DOM que no celular vira topo fino mais barra inferior com
  o "Novo desafio" no centro, e no desktop vira coluna lateral. O botão de tema
  continua único e com o mesmo `aria-label` que o roteiro de tela usa.
* Reescrita de todos os CSS Modules das telas, sem mexer nos hooks nem na API.
  Mudanças de TSX só onde a estrutura exigiu: marca "?!" no login, "Sair da
  conta" no perfil (o topo do celular perdeu o botão de sair).
* Roteiro de captura em Playwright (390x844 e 1440x900, claro e escuro, todas
  as rotas e o diálogo de voto), usado para revisar cada rodada.

## O que a IA errou

* **Barra inferior presa no topo.** O `backdrop-filter` do cabeçalho vira
  *containing block* para descendentes `position: fixed`, e a navegação, que é
  filha do cabeçalho, ficou grudada em cima dele, por cima da marca. Só apareceu
  na primeira captura. O cabeçalho do celular passou a ter fundo opaco e sem
  desfoque.
* **Revisou contra uma API velha.** A primeira rodada de capturas rodou contra
  a imagem da API construída 10 dias antes: o detalhe do desafio ficava em
  branco (`jurados` não existia e o `.map` quebrava a página inteira) e a lista
  mostrava "undefined pessoas entraram". A IA levou isso para a lista de
  correções antes de perceber que era o container, não o CSS. A imagem foi
  reconstruída com `docker compose build api` e os sintomas sumiram.
* **Colunas trocadas em "Meus grupos" no desktop.** O formulário de criar
  grupo vem antes da lista no DOM (ordem certa para o celular) e, sem
  `grid-column` explícito, caiu na coluna larga da esquerda com a lista
  espremida à direita.
* **Rótulo do pote estourando a ficha redonda** e **linha do tempo cortada no
  celular** (a quarta etapa, "Resultado", ficava fora da tela). Ajustados o
  tamanho da ficha e a quebra dos rótulos.
* **Tentou recriar o banco com `docker compose down -v`** para voltar ao seed e
  ter a prova pendente da demonstração. A ação foi barrada por ser destrutiva e
  a IA não insistiu: enviou uma prova nova pelo endpoint da API, como desafiado
  do desafio 1, só para capturar a tela de votação. Essa evidência (#7) ficou
  no banco local de desenvolvimento.
* **Escreveu o `index.html` novo na raiz do repositório.** O diretório de
  trabalho do shell foi redefinido entre dois comandos e o arquivo foi parar em
  `/index.html`, não em `apps/web/`. As capturas não denunciaram, porque o
  roteiro forçava o tema pelo `localStorage`; o `git status` sim. Movido para o
  lugar certo e conferido no navegador: sem preferência salva, o app abre claro
  mesmo com o sistema no escuro.
* **Não rodou os roteiros de ponta a ponta.** Eles escrevem no banco (criam
  grupo, votam) e consomem o desafio aberto; ficaram para antes do merge.

## Como o time validou

* `tsc -b && vite build` passando; CSS de 73 kB (14 kB gzip) e 150 kB de fontes.
* Cinco rodadas de captura (71 imagens na última configuração), cada uma lida
  tela a tela nos dois tamanhos e nos dois temas, com os erros de página
  registrados pelo Playwright. As capturas finais estão em
  `docs/04-ux/propostas/redesign-mobile/img/`.
* Conferência dos seletores de `roteiro-e2e-ui.mjs` contra o DOM novo:
  `[class*=conteudo]`, `[class*=lista]`, `role=tab`, rótulos dos botões,
  `button[aria-label^="Mudar para o tema"]` único.
* Dados reais do banco local nas capturas (API reconstruída do código atual).

## Decisão final

Entra o redesign na branch `feat/redesign-mobile-first`, com a página de UX e
este registro. Pendente antes do merge: rodar `roteiro-e2e-ui.mjs` e
`roteiro-e2e-ia.mjs`, testar no iPhone real (`100dvh`, área segura, teclado
sobre a folha) e refazer as capturas dos documentos 22–30 com
`scripts/telas/capturar-telas.mjs`.
