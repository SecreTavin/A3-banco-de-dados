# Roteiro do vídeo de demonstração

Vídeo de ~81s que conta **uma história só**, com os integrantes do grupo e os
papéis e valores do [roteiro da banca](../../docs/06-encerramento/roteiro-da-demonstracao.md):
o **Mario** duvida que o **Arthur** corre 5 km em menos de 25 minutos, e o
**Luís** aposta a favor. O júri é **Luís, Octávio e Rafael**, e o voto do
Octávio fecha o quórum. Na banca o desafio é outro (10 polichinelos), mas os
papéis, os 20 CP de cada um e o pagamento são os mesmos, conferidos no
PostgreSQL em 22/11/2026.

## Por que essa estrutura

| Escolha | Motivo |
| --- | --- |
| Abre com uma cena filmada, não com o logo | O gancho precisa mostrar a situação que o público já viveu. Começar com o nome do produto desperdiça os primeiros segundos |
| Cena filmada no começo e no fim, telas no meio | É a estrutura híbrida mais usada: emoção na abertura, prova pela interface e retorno na resposta |
| Um desafio do começo ao fim | Na primeira versão, cada cena mostrava um desafio diferente e a história se perdia |
| Os integrantes, não personagens | Desde 22/11 a apresentação não usa usuários fictícios: o vídeo mostra o mesmo grupo que a banca vai ver ao vivo |
| Tipografia cinética na virada | A frase também funciona sem som |
| Cena do banco antes do fim | É o que a disciplina avalia. Ela entra depois da história, quando o público já sabe o que está em jogo |
| 60 a 90 segundos | A taxa de quem assiste até o fim cai depois de um minuto |

## Linha do tempo

| # | Tempo | Cena (`id`) | Imagem | Narração (voz em off) |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:08 | **Abertura** (`abertura`, clipe) | O Mario provoca o Arthur no pátio | — (fala dos dois) |
| 2 | 0:08–0:12 | Virada (`virada`) | A frase vira o card do desafio | — (batida da trilha) |
| 3 | 0:11–0:21 | Criar (`criar`) | O desafio passa pela IA; uma proposta perigosa é recusada | "A provocação vira desafio, e uma inteligência artificial avalia antes de publicar. Desafio perigoso não passa." |
| 4 | 0:20–0:29 | Apostar (`escrow`) | Luís, Arthur e Mario entram, e o pote chega a 60 CP | "Quem entra tem o cê pê retido na hora. Ninguém dá calote: ele só sai dali com o resultado." |
| 5 | 0:29–0:35 | **Corrida** (`corrida`, clipe) | O Arthur correndo no parque | — (respiração e passos) |
| 6 | 0:34–0:46 | Julgar (`juri`) | O print da corrida, o voto do Octávio e o carimbo VALE | "O Arthur manda o print da corrida. Quem não está no duelo vira júri, e o voto não tem volta." |
| 7 | 0:46–0:58 | Apurar (`apuracao`) | O pagamento e o ranking: Luís 112, Arthur 110, Octávio 102 | "Quando o voto que faltava fecha o quórum, o Postgres apura e paga todo mundo numa única transação. O ranking muda na hora." |
| 8 | 0:57–1:02 | **O troco** (`reacao`, clipe) | O Mario vê a notificação, e o Arthur cobra | — (fala dos dois) |
| 9 | 1:02–1:16 | Banco (`banco`) | Terminal: transação, views vazias e `UPDATE` bloqueado | "Por baixo dos panos, quem manda é o banco: uma procedure transacional, visões que provam que a conta fecha, e um extrato que ninguém consegue alterar." |
| 10 | 1:15–1:21 | Fim (`fim`) | Logo, frase e "Duvida? euduvido.falveshub.com" | "Eu Duvido! A aplicação pode errar. O banco não deixa o erro virar dado." |

## Narração sintética

A narração das seis cenas do sistema é gerada pela voz sintética **Luciana**, do
macOS, a 175 palavras por minuto. O texto falado fica em
[`narracao.json`](narracao.json), e `npm run narrar` refaz os seis arquivos de
`public/narracao/`. Roda só no macOS, sem internet e sem chave de API. As falas
dos clipes continuam sendo do time.

| Cena | Fala | Cabe em |
| --- | --- | --- |
| `criar` | 8,0 s | 9,0 s |
| `escrow` | 6,5 s | 8,0 s |
| `juri` | 6,4 s | 11,0 s |
| `apuracao` | 8,5 s | 11,0 s |
| `banco` | 10,1 s | 13,0 s |
| `fim` | 5,3 s | 5,6 s |

"Cabe em" é a cena menos o atraso de 0,4 s e a transição de 0,6 s. Se uma fala
nova passar desse tempo, ela invade a seguinte: encurte o texto ou aumente a
duração em `src/Demo.tsx`.

**Pronúncia:** o texto é o que a voz lê. "CP" vira "cê pê", "IA" vira
"inteligência artificial", "PostgreSQL" vira "Postgres" e "views" vira "visões";
sem isso, a voz lê as siglas como palavras.

## Áudio

Tudo é opcional: o vídeo renderiza sem nenhum arquivo e usa cada um assim que
ele aparece em `public/`.

| Arquivo | Onde entra |
| --- | --- |
| `public/narracao/<id>.mp3` | No começo da cena com esse `id` (coluna "Cena" acima), 0,4 s depois da transição. Só as cenas com texto na coluna "Narração" precisam de arquivo: `criar`, `escrow`, `juri`, `apuracao`, `banco` e `fim` |
| `public/trilha.mp3` | O vídeo inteiro, em volume baixo (12%), com entrada e saída suaves. Se for menor que o vídeo, repete |
| `public/clipes/<id>.mp4` | Na cena com esse `id`: `abertura.mp4`, `corrida.mp4` e `reacao.mp4`, com o som do clipe. Sem o arquivo, a cena sai do vídeo (com `claquetes: true`, uma claquete ocupa o lugar) |

Para trocar a voz sintética pela de alguém do time, grave as seis falas num lugar
silencioso e salve com os mesmos nomes. O fone do celular basta.

A trilha precisa ter licença de uso livre, como as da biblioteca de áudio do
YouTube. Anote a fonte no registro de IA ou nas referências.

## Os três clipes filmados

**Formato:** 16:9, 1080p, de 5 a 8 segundos.

**Recomendado: o próprio time grava com o celular.** Os personagens são os
integrantes, então o Mario e o Arthur aparecem como eles mesmos. Grave na
horizontal, com luz natural e o celular apoiado. O som ambiente do celular basta.

**Alternativa: gerar com IA (Veo 3.1 ou parecido).** Nesse caso, os atores são
gerados e **não** podem imitar o rosto de ninguém real. Use as referências
abaixo, que não descrevem ninguém do grupo, e deixe claro no registro de IA que
os clipes são gerados. Para o mesmo ator aparecer nos três clipes, gere primeiro
uma imagem de referência de cada um e use as duas em todos (no Veo 3.1, é o
*Ingredients to Video*).

| Papel | Descrição para a referência |
| --- | --- |
| Quem duvida | Brazilian university student, early 20s, curly dark hair, oversized grey hoodie, playful smirk |
| Quem corre | Brazilian university student, early 20s, short black hair, black t-shirt, athletic build, confident |

### `abertura.mp4` (8s)

**Gravando:** os dois numa mesa do pátio. O Mario aponta e fala a frase; o
Arthur sorri e responde.

```
Medium two-shot, handheld, natural daylight. Two Brazilian university students
sit at a table in a lively campus courtyard. [Doubter] leans back, laughing,
points at [Runner] and says in Brazilian Portuguese: "Tu? Correr cinco
quilômetros em menos de vinte e cinco minutos? Eu duvido." [Runner] smiles,
raises an eyebrow and answers in Brazilian Portuguese: "Duvida? Então valendo."
Ambient: chatter, birds. No music. No subtitles.
```

### `corrida.mp4` (6s)

**Gravando:** o Arthur correndo em direção à câmera e olhando o relógio. Sem fala.

```
Tracking shot, golden hour, city park running path. [Runner] runs toward the
camera, breathing hard, glances at his smartwatch and speeds up. Shallow depth
of field, cinematic. Ambient: footsteps, breathing, distant traffic. No dialogue.
No music. No subtitles.
```

### `reacao.mp4` (5s)

**Gravando:** close no Mario olhando o celular. O Arthur entra por trás do ombro
dele.

```
Close-up, indoor, evening. [Doubter] looks at his phone screen, which lights up
his face, and says in Brazilian Portuguese, in disbelief: "Não acredito..."
[Runner] leans into frame from behind his shoulder, grinning, and says: "Paga."
Ambient: room tone. No music. No subtitles.
```

**Teste o português antes de gerar tudo.** Nenhuma comparação confirma a
sincronia labial do Veo 3.1 em português. Se a boca não acompanhar a fala, há
dois planos B:

* gerar o clipe sem fala e dublar por cima com a mesma voz da narração;
* enquadrar de um jeito que a boca não apareça: de costas, de perfil ou por cima
  do ombro.
