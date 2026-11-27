# 2026-11-26 — Vídeo "Demonstracao": passeio pelas telas reais

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-26 (registro escrito em 27/11/2026) |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/video/src/demonstracao/` (novo), `apps/video/src/Raiz.tsx`, `apps/video/scripts/capturar-demonstracao.mjs` e `roteiro.mjs` (novos), `apps/video/public/demonstracao/capturas/` (novo), `apps/video/DEMONSTRACAO.md` e `ELEVENLABS.md` (novos), `apps/video/README.md`, `package.json`, `package-lock.json`, `tsconfig.json` |

## O que foi pedido

Um segundo vídeo, separado do trailer: a aplicação real funcionando, capítulo
por capítulo, ligando cada passo ao objeto do banco que o garante, com o
roteiro de narração para gerar à mão no ElevenLabs.

## Prompt utilizado

O prompt completo tem cerca de 140 linhas e foi guardado fora do repositório
(`prompt-video-demonstracao.txt`). O trecho que define a tarefa:

> # Tarefa: vídeo de demonstração da aplicação (passeio pelas telas reais), em
> Remotion, com roteiro de áudio para ElevenLabs
>
> Você é um diretor de motion design e roteirista que também programa em
> Remotion. Trabalhe na raiz do repositório (`a3`). Entregue (1) o roteiro de
> áudio que eu vou gerar à mão no ElevenLabs e (2) uma composição Remotion que
> **mostra a aplicação real funcionando**, caso de uso por caso de uso.

O prompt também fixava a jornada (10 capítulos, de `abertura` a `proximo`), a
duração alvo (2:15 a 2:45), as regras de captura (só banco local, e-mails de
exemplo, valores conferidos no PostgreSQL) e o trabalho em quatro fases, com
parada para aprovação do texto antes do código.

## O que a IA produziu

* **Composição `Demonstracao`** em Remotion, registrada em `Raiz.tsx` ao lado
  do trailer, sem alterar `Demo.tsx`. São 10 capítulos com moldura de navegador
  ou de celular, cursor, zoom, contadores de CP, legendas queimadas e a faixa
  "O que o banco garante".
* **`cenas.ts` como fonte única** das falas, legendas, marcos e faixas. O
  `ELEVENLABS.md` é gerado dela por `npm run roteiro`. A duração de cada cena
  vem do mp3, quando ele existe, ou da estimativa por contagem de palavras.
* **Script de captura** (`capturar-demonstracao.mjs`), que faz o ciclo pela
  interface num banco local vazio, captura 35 telas e confere saldos, pote,
  júri, status e as views de contabilidade no PostgreSQL a cada passo.
* **Levantamento de divergências na documentação** (nomes de trigger contra
  nomes de função, RN04 citando constraint do modelo antigo, "Central de
  Votação"), anotado no `DEMONSTRACAO.md` como sugestão para o time.

## O que a IA errou

Este registro foi escrito um dia depois, a partir do prompt e dos arquivos. Os
erros intermediários da sessão de 26/11 não ficaram anotados. Os que dá para
verificar nos artefatos:

* **O vídeo envelheceu em horas.** As capturas são de 26/11, 19:50. Na mesma
  noite entrou o PR #83 (voto e comentário do júri na tela do desafio, aba
  Votação) e, em 27/11, o CSS de desktop da correção do U11. As capturas dos
  capítulos 2, 3 e 4 ficaram diferentes da aplicação e foram regeneradas em
  27/11 ([registro](2026-11-27-slide-do-goal-e2e.md)).
* **Fim amarrado à ordem da apresentação.** A última fala ("vamos abrir o
  sistema ao vivo") supunha a demonstração logo depois do vídeo. Com o deck de
  14 slides, o vídeo passou para antes do slide 10, e a fala foi trocada em
  27/11.
* **Plano diferente do executado.** O `DEMONSTRACAO.md` previa o script em
  `scripts/telas/gravar-demonstracao.mjs` e clipes `.webm`. O script ficou em
  `apps/video/scripts/capturar-demonstracao.mjs`, só com capturas estáticas.
* **Render sem áudio.** O `out/demonstracao.mp4` de 26/11 não tem trilha de
  áudio: os mp3 ainda não tinham sido gerados. A duração (2:42) é a estimada.

## Como o time validou

* As conferências do script no PostgreSQL passaram nas duas execuções (26/11 e
  27/11): saldos finais Luís 112, Arthur 110, Octávio 102, Rafael 100 e Mario
  80, pote liberado e as duas views vazias (`capturas/conferencia.txt`).
* `tsc --noEmit` sem erro em 27/11.
* `ffprobe` no render: 162,3 s, só trilha de vídeo.
* **Falta:** gerar os 10 áudios no ElevenLabs, renderizar de novo e conferir
  se cada fala casa com a tela.

## Decisão final

A composição, o script e as capturas entram no repositório. O vídeo passa
entre os slides 9 e 10 do deck da banca. A narração e o render final ficam para
depois da geração dos áudios.
