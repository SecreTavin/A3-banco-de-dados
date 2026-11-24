# 2026-11-24 — Vídeo na abertura da banca

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-24 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/video/src/Demo.tsx`, `Raiz.tsx` e `cenas/Clipe.tsx`; `docs/06-encerramento/video-de-demonstracao.md` (nova) e `video/`; roteiro dos slides; slide 21 |

## O que foi pedido

Passar o vídeo de demonstração antes dos slides e registrar no GitBook, com data,
a versão que vai para a banca.

## Prompt utilizado

> o vídeo vai entrar em ação antes dos slides, pois vamos aprofundar mais sobre o
> sistema nos slides, e deve realizar o merge da #78 pois precisamos ter datado na
> documentação ele também.

## O que a IA produziu

* **O vídeo pula as cenas filmadas que ainda não existem.** Antes, cada uma virava
  uma claquete com "CLIPE PENDENTE", e o vídeo da banca abriria com ela. Agora a
  duração é calculada pelos clipes presentes: 63 s sem nenhum, 81 s com os três.
  A claquete continua disponível com a prop `claquetes: true`, para edição.
* Página [Vídeo de demonstração](../../06-encerramento/video-de-demonstracao.md),
  datada de 24/11/2026, com o MP4 da banca, dois quadros, a história, como gerar
  de novo e o histórico de versões.
* Roteiro dos slides com o bloco de abertura (1:30): a apresentação passa de 34:00
  para 35:30, e as perguntas ficam com 4:30 a 9:30 dentro dos 40 a 45 minutos.
* Slide 21 e a fala dele com 68 registros.

## O que a IA errou

Nenhum erro identificado nesta alteração. O problema da claquete na abertura vinha
da versão anterior, que deixava o vídeo da banca dependente de três gravações que
ainda não existem.

## Como o time validou

* `npm run tipos` sem erros.
* Duração conferida pelo Remotion: 1902 quadros (63,4 s) sem clipes e 2436 quadros
  (81,2 s) com `claquetes: true`.
* Render sem clipes: o primeiro quadro é a frase animada, e o áudio do MP4,
  analisado em janelas de 50 ms, tem as seis falas nos tempos previstos (3,8 s,
  13,2 s, 21,6 s, 33,1 s, 44,5 s e 57,8 s), sem sobreposição.
* Tempos do roteiro dos slides somados por script: 20:00 de fala, 1:30 de vídeo e
  14:00 de demonstração, total de 35:30.

## Decisão final

O MP4 da banca fica versionado em `docs/06-encerramento/video/`, para ninguém
precisar renderizar no dia. Se as cenas filmadas forem gravadas, o vídeo é
renderizado de novo e a página é atualizada.
