# Roteiro do vídeo de demonstração

Vídeo de ~81s que conta **uma história só**: o desafio 1 do seed, em que o Biel
duvida que o Tavin corre 5 km em menos de 25 minutos e o Theus aposta a favor.
Os números batem com o [roteiro da banca](../../docs/06-encerramento/roteiro-da-demonstracao.md).

## Por que essa estrutura

| Escolha | Motivo |
| --- | --- |
| Abre com uma cena filmada, não com o logo | O gancho precisa mostrar a situação que o público já viveu. Começar com o nome do produto desperdiça os primeiros segundos |
| Cena filmada no começo e no fim, telas no meio | É a estrutura híbrida mais usada: emoção na abertura, prova pela interface e retorno na resposta |
| Um personagem e um desafio do começo ao fim | Na primeira versão, cada cena mostrava um desafio diferente e a história se perdia |
| Tipografia cinética na virada | É a tendência mais citada de 2026, e a frase também funciona sem som |
| Cena do banco antes do fim | É o que a disciplina avalia. Ela entra depois da história, quando o público já sabe o que está em jogo |
| 60 a 90 segundos | A taxa de quem assiste até o fim cai depois de um minuto |

## Linha do tempo

| # | Tempo | Cena | Imagem | Narração (voz em off) |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:08 | **Abertura** (clipe) | Biel provoca o Tavin no pátio | — (fala dos personagens) |
| 2 | 0:08–0:12 | Virada | A frase vira o card do desafio | — (batida da trilha) |
| 3 | 0:11–0:21 | Criar | O Tavin cria o desafio, a IA aprova; uma proposta perigosa é recusada | "No Eu Duvido!, a provocação vira desafio. O Tavin cria, aposta vinte CP, e uma IA avalia antes de publicar. Desafio perigoso não passa." |
| 4 | 0:20–0:29 | Apostar | Tavin, Biel e Theus entram, e o pote chega a 60 CP | "Quem entra na aposta tem o CP retido na hora. Ninguém dá calote: ele só sai dali com o resultado." |
| 5 | 0:29–0:35 | **Corrida** (clipe) | O Tavin correndo no parque | — (respiração e passos) |
| 6 | 0:34–0:46 | Julgar | O print da corrida, o voto da Lari e o carimbo VALE | "O Tavin manda o print da corrida. Os amigos viram júri, e o voto não tem volta." |
| 7 | 0:46–0:58 | Apurar | O pagamento e o Tavin subindo para o 1º lugar | "Quando o último voto fecha o quórum, o PostgreSQL apura e paga todo mundo numa única transação. O ranking muda na hora." |
| 8 | 0:57–1:02 | **O troco** (clipe) | O Biel vê a notificação, e o Tavin cobra | — (fala dos personagens) |
| 9 | 1:02–1:16 | Banco | Terminal: transação, views vazias e `UPDATE` bloqueado | "Por baixo dos panos, quem manda é o banco: procedure transacional, views que provam que a conta fecha e um extrato que ninguém consegue alterar." |
| 10 | 1:15–1:21 | Fim | Logo, frase e "Duvida? euduvido.falveshub.com" | "Eu Duvido! A aplicação pode errar. O banco não deixa o erro virar dado." |

O ritmo da narração é de ~2,5 palavras por segundo. Se uma fala estourar o
tempo da cena, ajuste a duração em `src/Demo.tsx`; não acelere a voz.

**Pronúncia:** escreva "cê-pê" no texto da voz sintética, ou ela lê "CP" como
uma palavra.

## Os três clipes filmados

**Formato:** 16:9, 1080p, 8 segundos. Salve em `public/clipes/` com o nome da
tabela. Enquanto o arquivo não existe, o vídeo mostra uma claquete no lugar.
Assim que o arquivo aparece, ele entra sozinho.

**Mesmos personagens nos três clipes:** gere primeiro uma imagem de referência
de cada um e use as duas como referência em todos os clipes. No Veo 3.1, isso
é o *Ingredients to Video*. Sem isso, o Biel muda de rosto a cada cena.

| Personagem | Descrição para a referência |
| --- | --- |
| Biel | Brazilian university student, early 20s, curly dark hair, oversized grey hoodie, playful smirk |
| Tavin | Brazilian university student, early 20s, short black hair, black t-shirt, athletic build, confident |

### `abertura.mp4` (8s)

```
Medium two-shot, handheld, natural daylight. Two Brazilian university students
sit at a table in a lively campus courtyard. [Biel] leans back, laughing,
points at [Tavin] and says in Brazilian Portuguese: "Tu? Correr cinco
quilômetros em menos de vinte e cinco minutos? Eu duvido." [Tavin] smiles,
raises an eyebrow and answers in Brazilian Portuguese: "Duvida? Então valendo."
Ambient: chatter, birds. No music. No subtitles.
```

### `corrida.mp4` (6–8s)

```
Tracking shot, golden hour, city park running path. [Tavin] runs toward the
camera, breathing hard, glances at his smartwatch and speeds up. Shallow depth
of field, cinematic. Ambient: footsteps, breathing, distant traffic. No dialogue.
No music. No subtitles.
```

### `reacao.mp4` (5–8s)

```
Close-up, indoor, evening. [Biel] looks at his phone screen, which lights up
his face, and says in Brazilian Portuguese, in disbelief: "Não acredito..."
[Tavin] leans into frame from behind his shoulder, grinning, and says: "Paga."
Ambient: room tone. No music. No subtitles.
```

**Teste o português antes de gerar tudo.** As comparações de 2026 colocam o Veo
3.1 à frente em diálogo entre duas pessoas, mas nenhuma confirma a sincronia
labial em português (o Kling não lista o idioma). Se a boca não acompanhar a
fala, há dois planos B:

* gerar o clipe sem fala e dublar por cima com a mesma voz da narração;
* enquadrar de um jeito que a boca não apareça: de costas, de perfil ou por
  cima do ombro.

## Narração

| Opção | Vantagem | Cuidado |
| --- | --- | --- |
| Voz de alguém do time | É autêntico, e a banca reconhece quem fala | Gravar num lugar silencioso; o fone do celular basta |
| ElevenLabs (pt-BR) | Voz limpa e fácil de refazer quando o texto muda | Declarar no registro de IA |

Os arquivos vão em `public/narracao/` com o número da cena (`03.mp3`, `04.mp3`
e assim por diante). A ligação no vídeo é o próximo passo.
