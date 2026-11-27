# 2026-11-27 — Deck da banca com a meta dos testes e2e e dados atualizados

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5), com o MCP do Figma |
| **Artefato afetado** | Slides 10 e 13 do deck "Eu Duvido! — Banca Final A3" no Figma Slides; `docs/06-encerramento/roteiro-dos-slides.md`; `docs/06-encerramento/roteiro-da-demonstracao.md`; `docs/05-qualidade/18-registro-ia.md`; `SUMMARY.md`; `apps/video/src/demonstracao/cenas.ts` e `capitulos.tsx`; `apps/video/ELEVENLABS.md`; `apps/video/DEMONSTRACAO.md`; `apps/video/public/demonstracao/capturas/` |

## O que foi pedido

1. Trocar o último slide do Rafael para falar da meta (`/goal`) que cobriu e
   corrigiu todos os cenários do roteiro de testes de ponta a ponta.
2. Revisar todos os slides e atualizar só os dados desatualizados, sem
   acrescentar conteúdo.
3. Atualizar o roteiro dos slides.

## Prompt utilizado

> dando continuidade no slide da apresentação no figma, eu quero mudar o ultimo
> slide meu Rafael para falar sobre esse /goal que rodei para preenchermos todos
> os testes e2e...

> pode atualizar o slide onde informações estão desatualizadas, revise todas,
> não adicione o que não tem, so atualize os dados

> pode autalizar o roteiro-dos-slides

> hmm acho que seria legal o vídeo da demonstração após o slide 9 então, o que
> acha? Depois da apresentação a gente inicia a demo ao vivo com as instruções
> que o professor for passar, o que acha?

## O que a IA produziu

* **Slide 13**, reescrito no mesmo layout, sem mudar cores, fontes ou
  posições:
  * título "/goal: a IA só parava com tudo passando";
  * destaque **201** cenários de ponta a ponta, todos passando;
  * cartão "Como a meta funcionou": a meta, o hook que recusava parar com
    falha e a IA perguntando antes de decidir regra;
  * faixa com os 10 defeitos reais (pote de CP preso e hub sem login);
  * rodapé com 81 registros de IA e 24 ADRs (antes, 69 e 23). Mais tarde,
    essa linha foi apagada do slide no Figma, fora desta sessão; a IA não a
    recolocou. Com o registro do vídeo de 26/11, escrito no fim do dia, o
    projeto chegou a 82 registros, número usado na fala do roteiro.
* **Slide 10**, com a execução de 27/11 no lugar da de 20/11: 170 → **183**
  testes da API, 18/18 → **30/30** pela API, 14/15 → **21/21** pela tela com
  o U11 aprovado. O número da tela deixou a cor de alerta e passou à cor dos
  demais.
* **Demais slides conferidos e mantidos:** contagens do banco (slide 6; a
  migration de 27/11 só alterou procedures), RN14, RN18, RN26 e RN28 (slide
  4), estatísticas da Pesquisa Game Brasil 2026 (slide 3), stack .NET 10 e
  React 19 (slide 9) e limitações e próximos passos (slide 14, contra o
  documento 19).
* **Roteiro dos slides** reescrito para o deck de 14 slides, com quem fala
  segundo o rodapé de cada slide, tempos, o vídeo entre os slides 9 e 10 e a
  demonstração ao vivo no fim, conduzida pelo professor.

Os números vêm dos registros
[roteiro-e2e-executado](2026-11-27-roteiro-e2e-executado.md) e
[correcao-dos-defeitos-e2e](2026-11-27-correcao-dos-defeitos-e2e.md) e da
execução final no [documento 17](../17-testes.md).

## O que a IA errou

* **Slide errado, quase.** O pedido citava o "último slide" do Rafael, e o
  roteiro do repositório (então com 26 slides) apontava o slide 19 como o
  último dele. O deck do Figma tem 14 slides e outra divisão. A IA só acertou o
  alvo depois de ler o rodapé "quem fala" de cada slide. Entre os dois slides
  do Rafael, escolheu o 13, que já falava de IA, e preservou o 14, que fecha a
  apresentação com "Perguntas?".
* **Rodapé quebrado em duas linhas** na primeira versão do slide 13. A caixa
  de texto foi alargada até caber em uma linha.
* **Contagem do próprio registro esquecida.** A primeira edição pôs 80
  registros, sem contar este. O número final é 81.
* **Contagem estática enganosa.** Contar objetos no `schema.sql` dava 5
  triggers e 12 índices únicos, porque o script idempotente guarda o histórico
  de todas as migrations, inclusive objetos já removidos. A conferência do
  slide 6 passou a se apoiar na própria migration de 27/11, que só altera
  procedures.

## Como o time validou

* Captura de tela dos slides 10 e 13 depois de cada edição, conferindo que
  nenhum texto vazou da caixa ou ficou sobreposto.
* Cada dado dos 14 slides conferido contra o repositório: documentos 08, 17,
  19 e `jogos-online-em-numeros.md`, `package.json`, `.csproj` e a migration
  `RegrasDeEncerramentoECancelamento`.
* Contagem de arquivos em `registro-ia/` (sem o modelo) e em `adr/` (sem o
  template).
* Roteiro: 16:20 com o trailer (1:30) e o vídeo "Demonstracao" (2:45). Com a
  demonstração de reserva (14:00), ficam em 30:20, dentro dos 40 a 45 minutos
  do edital. **Falta** o ensaio cronometrado.

## Decisão final

Os slides 10 e 13 do Figma e o roteiro passam a refletir o estado de 27/11.

O deck de 14 slides não tem slide de demonstração. A primeira versão do roteiro,
por escolha da IA, abria com o vídeo e punha a demonstração ao vivo depois do
slide 9. O responsável mudou a ordem:

* o **vídeo** passa a rodar entre os slides 9 e 10, ligando a arquitetura aos
  testes ("o que vocês viram no vídeo também foi testado");
* a **demonstração ao vivo** vai para depois do slide 14 e é **conduzida pelo
  professor**. Os 10 passos do roteiro da demonstração viram a ordem de reserva
  e o mapa para achar o que ele pedir.

Depois, o responsável confirmou que o **trailer** (pronto e publicado no
YouTube) continua abrindo a apresentação, antes do slide 1. O vídeo entre os
slides 9 e 10 é o **"Demonstracao"** (cerca de 2:45), e não o trailer, como a
IA tinha posto. Com os dois vídeos, a apresentação leva 16:20, e sobram de
23:40 a 28:40 para a demonstração e as perguntas.

## Atualização: vídeo "Demonstracao" conferido contra as mudanças

> temos que verificar se o vídeo está de acordo com as novas mudanças

> gere um documetno .txt em downloads para eu gerar os aúdios no eleven labs

> sim o trailer abre e ele ja ta em produção no youtube, ja está pronto e
> finalizado

* **Duração.** O render de 26/11 (`apps/video/out/demonstracao.mp4`, igual ao
  da pasta Downloads) tem 2:42 e **nenhuma trilha de áudio**: os mp3 do
  ElevenLabs ainda não existiam, e a duração é a estimada.
* **Telas.** As capturas eram de 26/11, 19:50, anteriores ao PR #83 e ao CSS
  da correção do U11. O `capturar-demonstracao.mjs` rodou de novo numa pilha
  local (`euduvido-video`) com o código de 27/11. Todas as conferências do
  banco passaram, com os mesmos valores. Pelo SSIM do ffmpeg, mudaram as
  capturas dos capítulos 2, 3 e 4 e, de leve, quatro outras.
* **Última cena.** "Agora, sem rede de proteção: vamos abrir o sistema ao
  vivo" deixou de valer, porque depois do vídeo vem o slide 10. A fala virou
  "Do primeiro acesso ao pagamento, cada regra é garantida pelo banco",
  ecoando a abertura, e o letreiro, "A regra mora no banco". O arquivo
  continua `09-proximo.mp3`.
* `ELEVENLABS.md` regenerado por `npm run roteiro`, `DEMONSTRACAO.md`
  atualizado e `Downloads/eu-duvido-falas-elevenlabs.txt` gerado das mesmas
  cenas, com a configuração e o nome de cada mp3.

**O que a IA errou aqui:** na primeira resposta, tratou os 2:30 como duração
do vídeo; 2:30 é só a fala. E o roteiro dos slides tinha posto o trailer
(63 s) depois do slide 9, em vez do vídeo "Demonstracao".

**Validação:** `ffprobe` na duração e nas trilhas, `cmp` entre o arquivo da
pasta Downloads e o render, `tsc --noEmit` sem erro e as conferências do
script de captura no PostgreSQL. **Falta:** gerar os áudios e renderizar de
novo.
