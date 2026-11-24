# 2026-11-24 — Vídeo de demonstração com os integrantes e render 3x mais rápido

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-24 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/video/` (cenas, `Demo.tsx`, `Grao.tsx`, `Capitulos.tsx`, `ROTEIRO.md`, `README.md`) |

## O que foi pedido

Lapidar e otimizar o rascunho do vídeo de demonstração feito pelo Rafael na
branch `feat/video-demo`.

## Prompt utilizado

> Claude, nova missão para o PO faz tudo aqui, precisamos terminar de lapidar e
> otimizar a branch "feat/video-demo".

## O que a IA produziu

* **História com os integrantes.** O rascunho usava os usuários fictícios do seed
  (Tavin, Biel, Theus e Lari), que saíram da apresentação em 22/11. Agora o Mario
  duvida do Arthur, o Luís aposta a favor, e o voto do Octávio fecha o júri. Os
  papéis, os 20 CP de cada um e o pagamento são os do roteiro da banca: Luís 112,
  Arthur 110, Octávio 102, Rafael 100 e Mario 80.
* **Render 3x mais rápido.** O grão em SVG (`feTurbulence` com `mix-blend-mode`) virou
  uma textura PNG de 5 KB, e a barra de capítulos deixou de usar `backdrop-filter`.
* **Áudio ligado.** Narração por cena (`public/narracao/<id>.mp3`) e trilha
  (`public/trilha.mp3`), opcionais, no mesmo padrão dos clipes: o vídeo usa o
  arquivo assim que ele existe.
* **Correções.** O cursor do "Criar" clicava uns 50 px abaixo do botão desde o
  rascunho, e a contagem do pote chamava um hook dentro de um `reduce`.
* `ROTEIRO.md` com a nova história, as falas por cena e a recomendação de o time
  gravar os clipes, porque os personagens agora são pessoas reais.

## O que a IA errou

* **Grão forte demais.** A primeira textura tinha transparência de até 6%. O render
  ficou 3x mais rápido, mas o MP4 dobrou, de 8,1 para 17,3 MB, porque ruído custa
  bitrate. Medindo o desvio do fundo nos quadros, o grão novo era 3,6 vezes mais
  forte que o antigo (2,59 contra 0,71). Com transparência de até 1%, a
  intensidade voltou à original, e o MP4 ficou com 9,2 MB.
* **Cursor do júri.** A linha nova do Rafael no júri desceu os botões, e o cursor
  passou a clicar na borda de cima do "Vale" e do "Confirmar voto". Apareceu nos
  quadros renderizados e foi corrigido.

## Como o time validou

* `npm run tipos` (TypeScript) sem erros.
* Quadros renderizados de cada cena e dos quatro cliques, conferidos um a um.
* Render completo: 81,2 s, 1920x1080, 30 fps e H.264, conferidos com `ffprobe`.
* Tempo de render medido na mesma máquina: **180 s antes e 63 s depois**. No trecho
  de 600 quadros, sem as duas camadas caras, o tempo foi de 36 a 39 s para 19 s.
* Valores do pagamento e do ranking iguais aos do ensaio do roteiro da banca, feito
  pela API e conferido no PostgreSQL em 22/11.
* **Não testado:** narração, trilha e clipes reais, porque os arquivos ainda não
  existem. O vídeo usa as claquetes no lugar dos clipes.

## Decisão final

Entra na branch `feat/video-demo`, em cima do rascunho do Rafael. O registro dele
(`2026-11-20-video-de-demonstracao.md`) não estava nos índices e foi incluído.
