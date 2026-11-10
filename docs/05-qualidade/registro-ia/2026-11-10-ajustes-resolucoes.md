# 2026-11-10 — Ajustes nas resoluções mais usadas e medição de rolagem

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-10 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Fable 5.1) |
| **Artefato afetado** | `apps/web/src/shared/ui/shell.module.css`, `trilha.module.css`, `features/desafios/inicio.module.css`, `detalhe.module.css`, `criar.module.css`, `features/autenticacao/login.module.css`, `features/votacao/votacao.module.css`, `features/perfil/perfil.module.css`, `scripts/telas/medir-rolagem.mjs`, `docs/04-ux/propostas/redesign-mobile/README.md`, `docs/04-ux/propostas/redesign-mobile/capturas/` (folhas de contato e PDF) |

## O que foi pedido

Capturar cada tela do redesign nas resoluções mais usadas de celular e de
desktop, corrigir o que aparecesse e garantir que não exista rolagem vertical
da janela: se algo rola, rola por dentro.

## Prompt utilizado

> okay, tire prints de cada tela em visualização desktop e mobile nas resoluções mais utilizadas de ambos e faça os ajustes necessarios, remova qualquer scroll vertical, se for ter, deixe interno somente

## O que a IA produziu

* Roteiro de captura e medição (`scripts/telas/medir-rolagem.mjs`) para oito
  viewports: 360x800, 375x667, 390x844 e 412x915 no celular; 1280x720,
  1366x768, 1536x864 e 1920x1080 no desktop, descontando a interface do
  navegador na altura. Em cada tela ele compara a altura e a largura do
  documento com a janela, lê `scrollX`/`scrollY` e lista todo elemento que
  rola, acusando qualquer contêiner fora dos esperados (`main`, tela de login,
  folha do diálogo, carrossel horizontal).
* 175 capturas em duas rodadas, lidas em folhas de contato com as quatro
  resoluções de cada aparelho lado a lado.
* Oito ajustes de CSS, todos saídos da leitura das imagens, descritos na
  seção "Rolagem e resoluções mais usadas" da
  [página do redesign](../../04-ux/propostas/redesign-mobile/README.md).

## O que a IA errou

* **Menu lateral encostado à direita, com "Novo desafio" cortado.** A regra do
  celular põe `align-items: end` na barra inferior para alinhar as abas
  embaixo; no desktop, quando a barra vira coluna, esse `end` continuou valendo
  e empurrou tudo para a direita. O erro estava em **todas** as capturas de
  desktop das duas rodadas e a IA não viu: revisou o conteúdo e não a moldura.
  Quem apontou foi o responsável, abrindo o app no Firefox. Corrigido com
  `align-items: stretch` na coluna e os itens alinhados à esquerda; as imagens
  de desktop da página do redesign foram refeitas.
* **A primeira entrega do redesign não tinha sido testada em 360px.** A rodada
  anterior usou só 390x844 e 1440x900. Em 360px, a resolução Android mais
  comum, cinco coisas quebravam: o rótulo "Novo desafio" em duas linhas, o
  filtro de grupos saindo da tela, o título do bilhete cortado, "Em andamento"
  partido no meio e "Não vale" em duas linhas. Nenhum desses erros aparece em
  390px.
* **Tampouco em 1280 e 1366px.** O confronto do detalhe do desafio foi
  desenhado com a coluna da prova em até 440px; em notebooks comuns a coluna da
  esquerda ficava com 180px por painel e tudo quebrava em três linhas.
* **Login do desktop rolava.** A lista de contas de demonstração cresceu para
  dez e a IA não tinha reavaliado a altura; a tela rolava até em Full HD.
* **Comando de montagem errado.** O primeiro `montage` falhou porque o zsh não
  divide uma variável em vários nomes de arquivo; corrigido usando o glob
  direto no comando. Não afetou o produto.
* **Hifenização depende do navegador.** `hyphens: auto` na linha do tempo só
  funciona onde há dicionário de português; a garantia real é o tamanho menor
  abaixo de 400px, e o `overflow-wrap: anywhere` fica de rede de segurança.

## Como o time validou

* `tsc -b && vite build` passando; CSS de 74 kB (14 kB gzip).
* Segunda rodada do roteiro após os ajustes: nenhuma anomalia de rolagem em
  nenhuma das oito resoluções; login sem rolar a partir de 1366x768 (em
  1280x609 restam 6px).
* Folhas de contato das telas relidas uma a uma. A rodada final, já com o menu
  lateral corrigido, está em `docs/04-ux/propostas/redesign-mobile/capturas/`
  (41 folhas) e no PDF `telas-redesign.pdf` da mesma pasta, gerado por
  HTML impresso pelo Chrome para o time revisar.
* Seletores dos roteiros de tela intactos: as mudanças foram só de CSS.

## Decisão final

Entram os ajustes na branch `feat/redesign-mobile-first`, junto com o roteiro
de medição, para rodar de novo sempre que uma tela mudar. Continuam pendentes
os itens do registro anterior: roteiros de ponta a ponta, teste em iPhone real
e as capturas dos documentos 22–30.
