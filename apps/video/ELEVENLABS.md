<!-- Gerado por scripts/roteiro.mjs a partir de src/demonstracao/cenas.ts. Não edite à mão: rode npm run roteiro. -->

# Roteiro de áudio do vídeo "Demonstracao" (ElevenLabs)

São 10 falas, uma por capítulo, cada uma gerada numa tomada e salva com o
nome da tabela em `apps/video/public/demonstracao/audio/`. O vídeo renderiza sem
elas, com as durações estimadas, e se reajusta sozinho quando cada mp3 aparece.

**Duração estimada:** 2:43 de vídeo, com 2:30 de fala. A conta usa
2,4 palavras por segundo, 0,5 s de silêncio antes de cada fala,
1,0 s depois e 0,6 s de sobreposição em cada transição de fade ou slide (o corte seco não sobrepõe).

## Falas

| # | Arquivo de saída | Fala estimada | Cena | Texto exato para colar | Entonação |
| --- | --- | --- | --- | --- | --- |
| 0 | `00-abertura.mp3` | 3,8 s (9 palavras) | 5,3 s | `Esta é a aplicação, do primeiro acesso ao pagamento.` | Calma, de quem abre uma apresentação. Sem ênfase de anúncio. |
| 1 | `01-entrar.mp3` | 18,0 s (42 palavras) | 19,5 s | `O login é só com o Google: a gente não guarda senha. No primeiro acesso, o app pede apelido e data de nascimento. Com menos de dezesseis anos, a conta não nasce. [pause] Mesmo se o código falhasse, uma trigger no banco recusaria.` | Explicativa e tranquila. Leve sorriso em "a gente não guarda senha". |
| 2 | `02-grupo.mp3` | 15,5 s (36 palavras) | 17,0 s | `Agora, o grupo. O filtro da inteligência artificial está no moderado, e o Octávio, que é o admin, adiciona o Rafael pelo e-mail. Ninguém digita saldo: [pause] ao entrar, uma trigger lança cem cê pê no livro-caixa.` | Ritmo de tutorial. Pequena pausa natural depois de "Agora, o grupo". |
| 3 | `03-criar.mp3` | 18,8 s (44 palavras) | 20,3 s | `O Mario duvida que o Arthur corre cinco quilômetros em menos de vinte e cinco minutos. Vinte cê pê por pessoa. A inteligência artificial avalia: aprovado. Uma garrafa de vodka em dez minutos? Não passa. [pause] Aprovada ou não, toda proposta fica gravada no banco.` | Leve provocação na primeira frase. "Não passa" seco, com um toque de humor. |
| 4 | `04-aceitar.mp3` | 18,0 s (42 palavras) | 19,5 s | `O Luís aposta a favor, o Arthur aceita como desafiado e o Mario fica contra. A cada aceite, vinte cê pê saem da carteira e ficam retidos no desafio. [pause] É a procedure de débito em garantia: pote de sessenta, e calote nenhum.` | Três batidas na primeira frase, uma por pessoa. "Calote nenhum" com leve humor. |
| 5 | `05-prova.mp3` | 16,3 s (38 palavras) | 17,8 s | `O Arthur corre e manda a prova pelo celular: o print do aplicativo de corrida. [pause] Nesse instante, o júri congela: Luís, Octávio e Rafael. Quem está no duelo não julga, e quem entrar no grupo depois não vota.` | Narrativa, um pouco mais leve. Destaque calmo em "o júri congela". |
| 6 | `06-julgar.mp3` | 17,2 s (40 palavras) | 18,7 s | `Na votação, o júri vê a prova e o que vale como cumprido. Com três jurados, o quórum é dois: metade mais um. O Luís vota: vale. [pause] Cada jurado tem um voto só, e quem garante é a chave primária.` | Didática em "metade mais um". "Vale" curto, sem festa: a festa é no próximo capítulo. |
| 7 | `07-apurar.mp3` | 19,3 s (45 palavras) | 20,8 s | `Na tela do Octávio, o placar sobe sozinho. O voto seguinte fecha o júri: vale! [pause] Numa única transação, a procedure de apuração aceita a prova, paga o pote e dá dois cê pê a quem votou. O aviso ao vivo só sai depois do commit.` | O clímax, mas contido: um pouco mais de energia em "vale!". A frase da transação volta ao tom calmo e claro. |
| 8 | `08-ranking.mp3` | 18,8 s (44 palavras) | 20,3 s | `No ranking, o Luís lidera com cento e doze cê pê. No perfil do Arthur, o extrato conta a história: cem de entrada, vinte no desafio, trinta de prêmio. [pause] É um livro-caixa que só aceita lançamento novo, e as visões de conferência voltam vazias.` | Fechamento tranquilo. Os três números do extrato em ritmo de lista. |
| 9 | `09-proximo.mp3` | 4,6 s (11 palavras) | 8,0 s | `Do primeiro acesso ao pagamento, cada regra é garantida pelo banco.` | Fechamento calmo e firme, ecoando a frase da abertura. Sem tom de anúncio. |

"Cena" é o tempo do capítulo no vídeo: o silêncio antes, a fala e o silêncio depois.
O respiro do começo e do fim é dado pela linha do tempo, não pelo áudio: não
acrescente pausa nas pontas do texto.

## Configuração recomendada (ponto de partida)

Conferido na documentação do ElevenLabs em 27/11/2026. Os valores são ponto de
partida: ouça o capítulo 3 e ajuste antes de gerar os outros.

**Modelo: Eleven v4** (`eleven_v4`). O texto acima foi escrito para ele.

| O que muda do v2 para o v4 | Como o texto trata |
| --- | --- |
| Não aceita SSML: `<break time="0.4s" />` é ignorado ou lido | Cada pausa virou a tag `[pause]`, no máximo uma por capítulo |
| Os controles Style e Speed não existem | A velocidade vem da voz e do texto. Se soar corrido, aumente a pontuação, não um slider |
| Segue tags entre colchetes (`[pause]`, `[long pause]`, `[whispers]`) | Só `[pause]` é usada. Sem tags de emoção: são dez tomadas que precisam soar iguais |
| Mais expressivo, varia mais entre gerações | Stability alta e a mesma voz nas dez tomadas. Se uma tomada sair estranha, gere de novo a fala inteira |

Se a pausa não soar, troque `[pause]` por um travessão (` — `) ou por `[long pause]`
**em todos os capítulos que têm pausa**, não só em um.

**Configurações da voz:**

| Controle | Valor inicial | Por quê |
| --- | --- | --- |
| Stability | **0,65** | Acima do padrão (0,50): numa apresentação formal, vale mais a voz igual nas dez tomadas do que a emoção. Acima de 0,75 tende a ficar monótona. Se o v4 mostrar a escala por nomes (Creative, Natural, Robust), use **Natural** ou **Robust** |
| Similarity | **0,75** | É o padrão. Valores muito altos podem distorcer o áudio |
| Style, Speed | não existem no v4 | Se a tela do app mostrar um deles, deixe em zero e em 1,0 |
| Speaker Boost | **Ligado**, se aparecer | Aproxima da voz original. Custa latência, que não importa para arquivo gerado |

**Voz:** na Voice Library, filtre por idioma *Portuguese* e sotaque *Brazilian*, com
uso *Narrative* ou *Educational*. Procure uma voz calma e clara, de colega que
apresenta o trabalho, não de locutor de propaganda. Gere o capítulo 3 com duas ou
três candidatas e escolha uma. Depois, **use a mesma voz e os mesmos valores em todos**.

**Pronúncia:** os números e siglas já estão escritos como devem ser lidos ("cê
pê", "dezesseis", "inteligência artificial"). Se a voz tropeçar numa palavra em
inglês, troque só a palavra e anote aqui:

| Palavra | Se soar errado, tente |
| --- | --- |
| trigger | trígger |
| procedure | procídiur |
| commit | cômit |

## Checklist

- [ ] Abrir o ElevenLabs em *Text to Speech*, modelo **Eleven v4**.
- [ ] Escolher a voz brasileira (veja acima) e aplicar as configurações da tabela.
- [ ] Gerar o capítulo 3 (`03-criar.mp3`) e ouvir. Ajustar a voz ou a estabilidade antes de seguir.
- [ ] Gerar **um capítulo por vez**, colando o texto do bloco do capítulo sem mudar nada.
- [ ] Ouvir cada tomada inteira. Se errar uma palavra, gerar de novo a fala toda, não um pedaço.
- [ ] Baixar em mp3 e salvar com o nome exato da tabela em `apps/video/public/demonstracao/audio/`.
- [ ] Abrir o Studio (`npm run studio`, composição **Demonstracao**) e conferir se cada fala casa com a tela.
- [ ] Anotar no registro de IA a voz, o modelo e os valores usados.

## Marcos por capítulo

Os marcos são os momentos em que a animação acontece, contados do início da fala no
ritmo estimado. Quando o mp3 real existe, eles escalam na proporção da duração real.
Para corrigir um marco depois de ouvir, mude o `ajuste` dele em `src/demonstracao/cenas.ts`.

### 0 · `abertura` → `public/demonstracao/audio/00-abertura.mp3`

**Tela:** Logo do Eu Duvido! sobre o papel claro. A frase entra embaixo do logo.

**Texto para colar** (9 palavras, cerca de 3,8 s):

```text
Esta é a aplicação, do primeiro acesso ao pagamento.
```

**Entonação:** Calma, de quem abre uma apresentação. Sem ênfase de anúncio.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,2 s | A frase aparece embaixo do logo |

**Faixa "O que o banco garante":** nenhuma.

### 1 · `entrar` → `public/demonstracao/audio/01-entrar.mp3`

**Tela:** Login com o botão "Entrar com Google". No primeiro acesso, "Complete seu cadastro": apelido "Novato" e nascimento em 2014. "Criar conta e entrar" mostra a recusa da idade mínima.

**Texto para colar** (42 palavras, cerca de 18,0 s):

```text
O login é só com o Google: a gente não guarda senha. No primeiro acesso, o app pede apelido e data de nascimento. Com menos de dezesseis anos, a conta não nasce. [pause] Mesmo se o código falhasse, uma trigger no banco recusaria.
```

**Entonação:** Explicativa e tranquila. Leve sorriso em "a gente não guarda senha".

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 2,0 s | Clique em "Entrar com Google" |
| 4,8 s | "Complete seu cadastro" aparece |
| 6,0 s | Apelido e data de nascimento (2014) sendo preenchidos |
| 9,4 s | Clique em "Criar conta e entrar" |
| 10,4 s | Alerta: "É preciso ter ao menos 16 anos para usar o Eu Duvido!" |
| 13,2 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `trg_usuario_idade_minima`: BEFORE INSERT ON usuario: menor de 16 anos não vira linha (RN26).

### 2 · `grupo` → `public/demonstracao/audio/02-grupo.mp3`

**Tela:** Meus grupos → Banca do A3: Arthur, Luís, Mario e Octávio com 100 CP, filtro da IA "Moderado". O admin digita o e-mail do Rafael e clica em "Adicionar · entra com 100 CP". O Rafael aparece com o saldo rolando de 0 a 100.

**Texto para colar** (36 palavras, cerca de 15,5 s):

```text
Agora, o grupo. O filtro da inteligência artificial está no moderado, e o Octávio, que é o admin, adiciona o Rafael pelo e-mail. Ninguém digita saldo: [pause] ao entrar, uma trigger lança cem cê pê no livro-caixa.
```

**Entonação:** Ritmo de tutorial. Pequena pausa natural depois de "Agora, o grupo".

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,0 s | Banca do A3 aberto, quatro membros com 100 CP |
| 1,6 s | Zoom em "filtro da IA: Moderado" |
| 4,6 s | Digita rafael@exemplo.com no campo de novo membro |
| 8,6 s | Clique em "Adicionar · entra com 100 CP" |
| 9,2 s | Rafael aparece; saldo rola de 0 a 100 CP |
| 11,0 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `trg_membro_credito_inicial`: AFTER INSERT ON membro_grupo: lança CREDITO_INICIAL +100 em transacao_cp (RN06).

### 3 · `criar` → `public/demonstracao/audio/03-criar.mp3`

**Tela:** Novo desafio no grupo Banca do A3: "Correr 5 km abaixo de 25 minutos", categoria Esportes & Fitness, 20 CP. "Enviar para a moderação" → "A IA está lendo a proposta" → aprovado. Depois, "Beber uma garrafa de vodka em 10 minutos" → "Não passou no filtro Moderado", com o motivo.

**Texto para colar** (44 palavras, cerca de 18,8 s):

```text
O Mario duvida que o Arthur corre cinco quilômetros em menos de vinte e cinco minutos. Vinte cê pê por pessoa. A inteligência artificial avalia: aprovado. Uma garrafa de vodka em dez minutos? Não passa. [pause] Aprovada ou não, toda proposta fica gravada no banco.
```

**Entonação:** Leve provocação na primeira frase. "Não passa" seco, com um toque de humor.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,0 s | Título sendo digitado |
| 6,7 s | Destaque no custo: 20 CP |
| 8,6 s | Clique em "Enviar para a moderação" |
| 10,0 s | Aprovado: o desafio é criado |
| 11,0 s | Troca para a proposta da vodka, já enviada |
| 14,0 s | "Não passou no filtro Moderado" com o motivo da IA |
| 15,2 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `moderacao_desafio`: aprovada ou recusada, toda proposta é gravada; a recusada não vira linha em desafio (RN28).

### 4 · `aceitar` → `public/demonstracao/audio/04-aceitar.mp3`

**Tela:** Detalhe do desafio, "Entrar por 20 CP". Luís: Apostador + Vai cumprir. Arthur: Desafiado. Mario: Desafiante + Não vai cumprir. Cada saldo cai de 100 para 80, o pote sobe 20 → 40 → 60 CP, e o status vai de Aberto para Em andamento.

**Texto para colar** (42 palavras, cerca de 18,0 s):

```text
O Luís aposta a favor, o Arthur aceita como desafiado e o Mario fica contra. A cada aceite, vinte cê pê saem da carteira e ficam retidos no desafio. [pause] É a procedure de débito em garantia: pote de sessenta, e calote nenhum.
```

**Entonação:** Três batidas na primeira frase, uma por pessoa. "Calote nenhum" com leve humor.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,6 s | Luís entra como apostador: 100 → 80, pote 0 → 20 |
| 2,6 s | Arthur entra como desafiado: pote 20 → 40 |
| 4,8 s | Mario entra como desafiante: pote 40 → 60 |
| 6,0 s | Status muda de Aberto para Em andamento |
| 7,4 s | Zoom no pote: 60 CP retidos |
| 12,6 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `CALL debitar_escrow(...)`: debita o membro e credita o desafio na mesma transação: o CP fica retido até o resultado (RN18).

### 5 · `prova` → `public/demonstracao/audio/05-prova.mp3`

**Tela:** Celular do Arthur (390x844). Desafio Em andamento, "Enviar a prova", Foto, "Escolher foto": o print da corrida. "Mandar para o júri". O status vai para Em votação e o cartão da prova lista o júri: Luís, Octávio e Rafael.

**Texto para colar** (38 palavras, cerca de 16,3 s):

```text
O Arthur corre e manda a prova pelo celular: o print do aplicativo de corrida. [pause] Nesse instante, o júri congela: Luís, Octávio e Rafael. Quem está no duelo não julga, e quem entrar no grupo depois não vota.
```

**Entonação:** Narrativa, um pouco mais leve. Destaque calmo em "o júri congela".

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 2,2 s | "Escolher foto": o print da corrida aparece |
| 5,4 s | Clique em "Mandar para o júri" |
| 7,4 s | Status Em votação; cartão da prova com os três jurados |
| 11,0 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `evidencia + jurado_evidencia`: o júri é gravado no envio da prova; desafiante e desafiado ficam de fora (RN14).

### 6 · `julgar` → `public/demonstracao/audio/06-julgar.mp3`

**Tela:** Celular do Luís, aba Votação. Cartão "Arthur diz que cumpriu", "O que vale", a foto, "Faltam 2 votos para fechar… 2 de 3 jurados", prazo e "+2 CP para quem votar". Clique em "Vale", "Confirmar voto", e o diálogo "Voto registrado: falta 1 voto".

**Texto para colar** (40 palavras, cerca de 17,2 s):

```text
Na votação, o júri vê a prova e o que vale como cumprido. Com três jurados, o quórum é dois: metade mais um. O Luís vota: vale. [pause] Cada jurado tem um voto só, e quem garante é a chave primária.
```

**Entonação:** Didática em "metade mais um". "Vale" curto, sem festa: a festa é no próximo capítulo.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 1,4 s | Zoom em "O que vale" e na foto |
| 5,0 s | Zoom em "Fecha quando um lado chegar a 2 de 3 jurados" |
| 9,0 s | Clique em "Vale" |
| 10,0 s | Clique em "Confirmar voto" |
| 10,6 s | "Voto registrado": falta 1 voto |
| 11,6 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `pk_jurado_evidencia (id_evidencia, id_usuario)`: um voto por jurado; quórum = ⌊3/2⌋ + 1 = 2 sobre o júri congelado (RN04 · RN15).

### 7 · `apurar` → `public/demonstracao/audio/07-apurar.mp3`

**Tela:** Tela dividida: à esquerda o celular do Luís, à direita o navegador do Octávio em Votação. O placar do Octávio vai de 0 para 1 sem recarregar: "Seu voto fecha o júri." O Octávio clica em "Vale" e "Confirmar voto": "Júri fechou: vale!", com Arthur +30, Luís +30, Mario perdeu 20 CP, "Você, pelo voto +2 CP" e "Apurado e pago pelo banco numa transação só".

**Texto para colar** (45 palavras, cerca de 19,3 s):

```text
Na tela do Octávio, o placar sobe sozinho. O voto seguinte fecha o júri: vale! [pause] Numa única transação, a procedure de apuração aceita a prova, paga o pote e dá dois cê pê a quem votou. O aviso ao vivo só sai depois do commit.
```

**Entonação:** O clímax, mas contido: um pouco mais de energia em "vale!". A frase da transação volta ao tom calmo e claro.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 1,0 s | Placar do Octávio vai de 0 para 1 sem recarregar |
| 3,8 s | Octávio clica em "Vale" |
| 4,8 s | Clique em "Confirmar voto" |
| 6,0 s | "Júri fechou: vale!" com o selo |
| 7,4 s | Arthur +30, Luís +30, Mario perdeu 20; "+2 CP" pelo voto |
| 8,2 s | Faixa do banco entra |
| 12,0 s | Destaque em "Apurado e pago pelo banco numa transação só" |

**Faixa "O que o banco garante":** `CALL apurar_votacao(...)`: prova ACEITA, pote pago e +2 por voto numa transação; o SignalR só avisa depois do COMMIT (RN15 · RN17 · RN23).

### 8 · `ranking` → `public/demonstracao/audio/08-ranking.mp3`

**Tela:** Ranking da Banca do A3: pódio Luís 112, Arthur 110, Octávio 102; abaixo Rafael 100 e Mario 80. Depois, o Perfil do Arthur (e-mail fictício): 110 CP no grupo e o extrato: +100 crédito de entrada, −20 entrada no desafio, +30 prêmio.

**Texto para colar** (44 palavras, cerca de 18,8 s):

```text
No ranking, o Luís lidera com cento e doze cê pê. No perfil do Arthur, o extrato conta a história: cem de entrada, vinte no desafio, trinta de prêmio. [pause] É um livro-caixa que só aceita lançamento novo, e as visões de conferência voltam vazias.
```

**Entonação:** Fechamento tranquilo. Os três números do extrato em ritmo de lista.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,0 s | Pódio com os saldos rolando: 112, 110, 102 |
| 4,6 s | Perfil do Arthur: 110 CP no grupo |
| 7,6 s | Extrato: +100, −20, +30 entram um a um |
| 12,4 s | Faixa do banco entra |

**Faixa "O que o banco garante":** `transacao_cp · vw_reconciliacao_saldo · vw_escrow_orfao`: UPDATE e DELETE bloqueados por trigger; as duas views voltam com 0 linhas (RN24).

### 9 · `proximo` → `public/demonstracao/audio/09-proximo.mp3`

**Tela:** Volta ao logo. Texto "A regra mora no banco".

**Texto para colar** (11 palavras, cerca de 4,6 s):

```text
Do primeiro acesso ao pagamento, cada regra é garantida pelo banco.
```

**Entonação:** Fechamento calmo e firme, ecoando a frase da abertura. Sem tom de anúncio.

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
| 0,0 s | "A regra mora no banco" aparece |

**Faixa "O que o banco garante":** nenhuma.
