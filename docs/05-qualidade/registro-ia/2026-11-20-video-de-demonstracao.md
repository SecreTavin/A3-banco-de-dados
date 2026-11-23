# 2026-11-20 — Rascunho do vídeo de demonstração em Remotion

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/video/` (novo) |

## O que foi pedido

Pesquisar como equipes fazem vídeo de demonstração de produto hoje e montar um
rascunho inicial do vídeo do Eu Duvido!.

## Prompt utilizado

> Como podemos criar um motion da plataforma bem moderno e atual, pesquise como as pessoas estão fazendo atualmente.

> eu falo de criar um video de demonstração da plataforma

> sim, vamos fazer um rascunho inicial para ver se é isso mesmo

> eu quero que vc busque as melhores formas, melhoreis roteiros formas de apresentar para aplicar nessa apresentação... Vamos fazer algo muito top... Posso gerar um vídeo de duas pessoas uma duvidando da outra para encaixar

## O que a IA produziu

* Pesquisa: gravação com zoom automático (Screen Studio, Cap), vídeo em código
  (Remotion) e motion clássico (After Effects). A IA recomendou o Remotion,
  com espaço para trocar cenas por gravações reais depois.
* Projeto `apps/video/` com sete cenas (~72s) e o roteiro na ordem do ciclo
  de vida do desafio: gancho, criar com moderação da IA, escrow, júri e
  carimbo, apuração e ranking, banco por dentro e encerramento.
* As cenas usam as cores e as fontes do app e os números do roteiro da banca
  (Tavin 80 → 110, Theus 10 → 42, Lari 100 → 102, pote de 60 CP).
* Sem narração: o rascunho tem só legendas na tela.
* Segunda versão (~81s), depois de pesquisar roteiro de demo: o vídeo conta uma
  história só, a do desafio 1 do seed (Biel duvida que Tavin corre 5 km em
  menos de 25 minutos; Theus aposta a favor). Tem três vagas para clipes
  filmados (abertura, corrida e reação), que aparecem como claquete enquanto o
  arquivo não existe, além de tipografia cinética na virada, barra de
  capítulos, grão e transições por mola.
* `apps/video/ROTEIRO.md`, com a linha do tempo, o texto da narração por cena e
  os prompts do Veo para os três clipes.

## O que a IA errou

* Na primeira resposta, a IA entendeu "motion da plataforma" como animação de
  interface dentro do app e propôs tokens de movimento e View Transitions. O
  Rafael corrigiu: o pedido era um vídeo de demonstração.
* No primeiro render, as cenas ficaram presas no topo da tela, o cursor falso
  clicava fora dos botões e o carimbo "VALE" cobria o placar. A IA conferiu os
  quadros renderizados, centralizou o layout e reposicionou o cursor e o
  carimbo.

* A primeira versão mostrava um desafio diferente em cada cena (o hino na
  cantina, a nota no A3 e a corrida de 5 km), e a história se perdia. A segunda
  versão segue o desafio 1 do começo ao fim.
* A legenda do júri dizia "quem não está no desafio, julga", mas o Theus
  apostou no desafio e vota no júri. Pelo seed e pelo roteiro da banca, só o
  desafiado e o desafiante ficam de fora. A IA corrigiu a legenda ao conferir o
  `participante_desafio` do seed.
* A IA não confirmou que o Veo 3.1 sincroniza os lábios em português. O
  ROTEIRO.md manda testar antes e traz dois planos B.

## Como o time validou

* `npx tsc` sem erros em `apps/video`.
* Quadros renderizados com `remotion still` e conferidos visualmente, um por
  cena, além do quadro do clique no voto.
* MP4 completo renderizado (2160 quadros, 30 fps, ~3 MB) para o Rafael assistir.
* Segunda versão renderizada (2436 quadros, ~81s), com os quadros de cada cena
  conferidos e os números comparados com o seed e com o passo 7 do roteiro da
  banca.

## Decisão final

Rascunho na branch `feat/video-demo`, aguardando a avaliação do time.
