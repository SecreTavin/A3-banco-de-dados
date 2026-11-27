# 2026-11-27 — Narração do vídeo "Demonstracao" no Eleven v4

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Martins Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) para o roteiro e a conferência; ElevenLabs Eleven v4 para a voz |
| **Artefato afetado** | `apps/video/src/demonstracao/cenas.ts`, `apps/video/scripts/roteiro.mjs`, `apps/video/ELEVENLABS.md`, `apps/video/public/demonstracao/audio/*.mp3`, `apps/video/DEMONSTRACAO.md`, `apps/video/README.md`, `docs/06-encerramento/roteiro-dos-slides.md` |

## O que foi pedido

Trocar o texto da narração do vídeo "Demonstracao" (que passa entre os slides 9 e
10) para o modelo Eleven v4, gerar as dez falas e montar o vídeo com o áudio.

## Prompt utilizado

> vou gerar as narrações mas irei utilizar o modelo v4 do eleven labs, se precisar, pesquise e mude nos textos que irei usar de base e faça uma copia para downloads para eu copiar os textos

## O que a IA produziu

* Pesquisa na documentação do ElevenLabs: o v4 não aceita SSML e segue tags
  entre colchetes.
* As nove pausas `<break time="0.4s" />` viraram `[pause]` em `cenas.ts`; o
  estimador de duração passou a contar a tag.
* O gerador do roteiro (`roteiro.mjs`) e o `ELEVENLABS.md` ganharam a
  configuração do v4.
* Revisão dos docs: data da Banca Final (04/12 → 27/11, no `banca-final.md`, no manifest e no plano de trabalho), índice e contagem do `18-registro-ia.md` (82 → 83) e link do segundo vídeo em `06-encerramento`. A página de entregas foi regerada com `gerar-entregas.mjs`.
* Cópia dos textos em `~/Downloads/narracao-elevenlabs-v4.txt`.
* Instalação dos dez mp3 gerados pelo time e render do vídeo (2:28, 148 s).

## O que a IA errou

* O `ELEVENLABS.md` anterior recomendava o Multilingual v2 e descrevia o v4
  como "sem pausa possível"; estava desatualizado para a escolha do time.
* A estimativa de duração ficou em 2:43 e o vídeo real saiu com 2:28: a voz do
  v4 fala mais rápido que as 2,4 palavras por segundo usadas na conta.
* Os mp3 baixados não trazem o número do capítulo no nome. Assumir a ordem de
  download seria arriscado (duas falas de 18 s e três de 16 s). A IA casou cada
  arquivo com o capítulo pela transcrição, e não pela ordem.
* O `banca-final.md` dizia que a primeira janela era 20/11 e marcava a revisão em 04/12, mas o grupo apresenta em 27/11; o plano de trabalho ainda dizia que a janela estava indefinida.
* O README citava "slides 18 e 19" (deck antigo) e o roteiro dos slides tinha a
  duração do vídeo como estimativa. Os dois foram corrigidos.

## Como o time validou

* O Rafael ouviu as tomadas: pausas e pronúncia aprovadas.
* Transcrição automática (faster-whisper) dos dez arquivos, conferida contra o
  texto de cada capítulo.
* `tsc` sem erro, `npm run roteiro` regerado, composição lida com 4451 quadros.
* Render concluído; quadros dos capítulos 7 e 8 conferidos contra a fala.

## Decisão final

Narração em Eleven v4, voz "André - Natural excitement" (PVC), Stability 0,65 e
Similarity 0,75. Vídeo final com 2:28; o tempo do roteiro dos slides foi
recalculado (apresentação de 16:03).
