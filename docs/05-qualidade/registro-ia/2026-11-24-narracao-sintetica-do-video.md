# 2026-11-24 — Narração sintética do vídeo de demonstração

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-24 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5); voz sintética Luciana, do macOS (`say`) |
| **Artefato afetado** | `apps/video/narracao.json`, `apps/video/scripts/narrar.mjs`, `apps/video/public/narracao/`, `ROTEIRO.md` e `README.md` do vídeo |

## O que foi pedido

Narrar com voz sintética as seis cenas que mostram o sistema. As falas dos clipes
filmados continuam sendo do time.

## Prompt utilizado

> consegue narrar as partes do vídeo que mostram o projeto em si "sem ser as falas
> nossas durante os clipes"? utilizando uma voz sintetica de IA

## O que a IA produziu

* `narracao.json`, com a voz, o ritmo e o texto falado de cada cena.
* `scripts/narrar.mjs` (`npm run narrar`): gera um MP3 por cena com o `say` do
  macOS e normaliza o volume para -16 LUFS. Roda localmente, sem internet e sem
  chave de API, então nenhum texto sai do computador.
* Os seis arquivos em `public/narracao/`, que o vídeo já toca no começo de cada
  cena.
* Texto adaptado para a voz: "CP" virou "cê pê", "IA" virou "inteligência
  artificial", "PostgreSQL" virou "Postgres" e "views" virou "visões".

## O que a IA errou

* **Formato do áudio.** O `say` gera AIFF compactado por padrão, e o ffmpeg do
  Remotion não lê esse formato. O script passou a gerar WAV PCM.
* **Filtro que não existe.** A IA tentou cortar o silêncio das pontas com o filtro
  `silenceremove`, que o ffmpeg do Remotion não tem. Depois mediu que o `say` deixa
  só 0,03 a 0,05 s de silêncio e tirou o corte, que era desnecessário.
* **Fala longa demais.** A primeira fala do "Criar" tinha 10,0 s e invadiria a
  narração seguinte em 1 s. O texto foi encurtado para 8,0 s.

## Como o time validou

* Duração de cada faixa comparada com o tempo disponível na cena. Todas cabem, com
  folga de 0,3 a 4,6 s.
* Vídeo renderizado com a narração: 81,2 s, com faixa de áudio AAC.
* Áudio do MP4 analisado em janelas de 50 ms: as seis falas começam no tempo
  previsto (11,8 s, 21,2 s, 35,0 s, 46,5 s, 62,2 s e 75,6 s) e nenhuma invade a
  seguinte.
* **Falta:** ouvir o vídeo inteiro. A conferência acima mede tempo e volume, não a
  pronúncia nem a entonação.

## Decisão final

A voz Luciana entra como narração. Se o time preferir uma voz humana, basta gravar
as seis falas com os mesmos nomes de arquivo.
