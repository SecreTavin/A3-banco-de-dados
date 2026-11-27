# Vídeo "Demonstracao": passeio pelas telas reais

Segundo vídeo do projeto, separado do trailer (`Demo`). Passa na banca **entre o
slide 9 ("Ler e escrever são caminhos separados") e o slide 10 ("Testado do banco
até a tela")** do deck de 14 slides, com o play do Luís. Mostra o ciclo completo
de um desafio na aplicação real, em ritmo de tutorial, e liga cada passo ao
objeto do banco que o garante. Termina em "A regra mora no banco": a
demonstração ao vivo ficou para o fim da apresentação, conduzida pelo professor
([roteiro dos slides](../../docs/06-encerramento/roteiro-dos-slides.md)).

| | Trailer (`Demo`) | Demonstração (`Demonstracao`) |
| --- | --- | --- |
| Quando passa | Antes do slide 1 | Entre os slides 9 e 10 |
| Duração | 63 a 81 s | 2:28 com a narração (alvo de 2:15 a 2:45) |
| Imagem | Cenas filmadas e telas reconstruídas | Capturas reais da aplicação; reconstrução só onde não dá para capturar |
| Tom | Gancho, venda | Tutorial: o que a pessoa faz, a tela mostra, o banco garante |
| Narração | Voz sintética do macOS | ElevenLabs, um mp3 por capítulo ([ELEVENLABS.md](ELEVENLABS.md)) |

A fonte única das falas, das legendas, dos marcos e das faixas é
[`src/demonstracao/cenas.ts`](src/demonstracao/cenas.ts). O `ELEVENLABS.md` é gerado
dela com `npm run roteiro`.

## A história

É a mesma do trailer e usa os papéis e os valores do
[roteiro da demonstração](../../docs/06-encerramento/roteiro-da-demonstracao.md):
o **Mario** duvida que o **Arthur** corre 5 km em menos de 25 minutos, e o **Luís**
aposta a favor. O **Octávio** é o admin do grupo **Banca do A3** e adiciona o
**Rafael**. O júri é Luís, Octávio e Rafael, e o voto do Octávio fecha o quórum.
Ao vivo, o desafio vai ser outro (10 polichinelos), mas os papéis, os 20 CP de
cada um, o pote de 60 e o pagamento são os mesmos.

| Momento | Valor | Regra |
| --- | --- | --- |
| Entrada no grupo | 100 CP por membro | RN06 |
| Custo do desafio | 20 CP por participante | RN07 |
| Pote | 20 × 3 = 60 CP | RN18 |
| Júri congelado | Luís, Octávio e Rafael (Arthur e Mario de fora) | RN14 |
| Quórum | ⌊3/2⌋ + 1 = 2 | RN15 |
| Prêmio | Arthur +30, Luís +30 | RN23 |
| Recompensa de voto | Luís +2, Octávio +2 (Rafael não votou) | RN17 |
| Ranking final | Luís 112, Arthur 110, Octávio 102, Rafael 100, Mario 80 | conferido no PostgreSQL local na fase 2 |

## Plano das cenas

Cada capítulo abre com o rótulo do passo, mostra a ação, e a faixa "O que o banco
garante" entra **depois** da ação, no rodapé, sem cobrir a interface. A barra de
progresso acompanha os capítulos 1 a 8.

| # | `id` | Moldura | O que a tela mostra | Faixa do banco | Entrada |
| --- | --- | --- | --- | --- | --- |
| 0 | `abertura` | Nenhuma | Logo e "Esta é a aplicação, do primeiro acesso ao pagamento" | — | Corte |
| 1 | `entrar` | Navegador | Login → **Complete seu cadastro** → recusa de idade | `trg_usuario_idade_minima` (RN26) | Fade |
| 2 | `grupo` | Navegador | **Banca do A3**, filtro **Moderado**, **Adicionar · entra com 100 CP** | `trg_membro_credito_inicial` (RN06) | Slide |
| 3 | `criar` | Navegador | **Novo desafio** → **Enviar para a moderação** → aprovado; vodka → **Não passou no filtro Moderado** | `moderacao_desafio` (RN28) | Slide |
| 4 | `aceitar` | Navegador | **Entrar por 20 CP**, três aceites, pote 20 → 40 → 60, **Aberto** → **Em andamento** | `debitar_escrow` (RN18) | Slide |
| 5 | `prova` | Celular | **Enviar a prova** → **Escolher foto** → **Mandar para o júri**, cartão com o júri | `evidencia` + `jurado_evidencia` (RN14) | Fade |
| 6 | `julgar` | Celular | **Votação**: cartão da prova, quórum, **Vale** → **Confirmar voto** → **Voto registrado** | `pk_jurado_evidencia` (RN04, RN15) | Corte |
| 7 | `apurar` | Celular + navegador lado a lado | Placar do Octávio muda ao vivo → **Vale** → **Júri fechou: vale!** e o pagamento | `apurar_votacao` (RN15, RN17, RN23) | Corte |
| 8 | `ranking` | Navegador | **Ranking** com pódio → **Perfil** do Arthur e o extrato | `transacao_cp` e as duas views vazias (RN24) | Slide |
| 9 | `proximo` | Nenhuma | Logo e "A regra mora no banco" | — | Fade |

**Câmera e movimento:** zoom de 1,0 a 1,2 com *ease out* até o elemento citado, e o
resto escurece um pouco. O cursor faz trajetória curva e o clique tem uma onda
curta. Todo número de CP rola, em dourado. As cores de status são as do app.

**Botão A+:** existe (`BotaoEscala.tsx`, no topo da tela). Proposta: um plano de
1 s no capítulo 8, entre o ranking e o perfil, sem fala. Só entra se não apertar
o tempo.

**Legendas:** queimadas no vídeo, uma frase por vez, a partir de `legendas` em
`cenas.ts`, com o tempo dividido pelo número de caracteres.

**Trilha:** opcional (`public/trilha.mp3`), a 8% e abaixando para 3% durante a fala.

## Capturas necessárias (fase 2)

Tudo contra o **banco local de ensaio**, com os e-mails de exemplo de
`povoar-integrantes.mjs` (`arthur@exemplo.com` e outros). Nunca contra
`euduvido.falveshub.com`. Desktop em 1440x900 e celular em 390x844, os dois com
`deviceScaleFactor: 2`. Destino: `public/demonstracao/capturas/`.

O ranking final só bate se a Banca do A3 for um grupo novo, sem outro desafio.
Por isso, um script novo (`scripts/telas/gravar-demonstracao.mjs`) cria o grupo e
faz o ciclo em ordem, capturando o antes e o depois de cada passo e conferindo os
saldos no `psql` a cada passo.

| Capítulo | Captura ou clipe | Conta | Tela |
| --- | --- | --- | --- |
| 1 | `01-login.png` | sem login | Login. O botão real do Google só aparece com `GOOGLE_CLIENT_ID`; sem ele, reconstruído em React |
| 1 | `01-cadastro.png`, `01-recusa.png` | sem login | **Complete seu cadastro** só aparece depois do token do Google. Plano: a tela real com a resposta da API simulada pelo Playwright (`page.route`), usando o texto real do erro. Se não ficar fiel, reconstrução |
| 2 | `02-grupo-antes.png`, `02-grupo-depois.png`, clipe `02-adicionar.webm` | Octávio | Detalhe da Banca do A3 antes e depois de adicionar o Rafael |
| 3 | `03-novo.png`, `03-avaliando.png`, `03-criado.png`, `03-recusa.png` | Octávio | Formulário, avaliação, desafio criado e recusa. A IA é o moderador simulado (`moderador-ensaio.mjs`) |
| 4 | `04-aberto.png`, `04-luis.png`, `04-arthur.png`, `04-mario.png` | Luís, Arthur, Mario | Detalhe do desafio depois de cada aceite |
| 5 | `05-andamento.png`, `05-foto.png`, `05-votacao.png`, clipe `05-enviar.webm` | Arthur (celular) | Envio da prova e cartão com o júri |
| 6 | `06-card.png`, `06-confirmar.png`, `06-registrado.png` | Luís (celular) | Votação |
| 7 | clipe `07-ao-vivo.webm`, `07-fecha.png`, `07-resultado.png` | Octávio (navegador) e Luís | Placar mudando sem recarregar e o resultado |
| 8 | `08-ranking.png`, `08-perfil.png`, `08-a-mais.png` | Octávio, Arthur | Ranking, Perfil (e-mail de exemplo) e A+ |
| 5 | `prova-corrida.png` | — | Ilustração do print do app de corrida (5,02 km em 24:31), desenhada pelo script como o `povoar` já faz |

**Conferência no PostgreSQL**, a cada passo: saldo de cada membro, pote em
`vw_cp_em_escrow`, linhas de `jurado_evidencia`, status do desafio e da evidência,
os lançamentos do grupo em `transacao_cp` e as duas views vazias.

## Cobertura do edital

Base: a tabela "O que o edital pede" do roteiro da demonstração. A exclusão de
membro e o `psql` ficam para o ao vivo.

| Exigência | Onde aparece no vídeo |
| --- | --- |
| Acesso ao sistema | Capítulo 1: login com Google e cadastro com idade mínima |
| Execução de uma funcionalidade | Capítulos 3 a 7: criar, aceitar, provar, julgar e apurar |
| Inclusão de dados | Capítulo 2 (membro e `CREDITO_INICIAL`), 3 (desafio e `moderacao_desafio`) e 5 (`evidencia` e júri) |
| Consulta dos dados | Capítulo 6 (provas esperando voto) e 8 (ranking, saldo por grupo e extrato) |
| Alteração de dados | Capítulo 4 (aceite: saldo 100 → 80, status Aberto → Em andamento) e 6–7 (o voto é um `UPDATE` em `jurado_evidencia`, e a apuração muda o status da prova e do desafio) |
| Relacionamento entre informações | Capítulo 5 (júri ligado à prova), 7 (pagamento lançado para cada participante) e 8 (extrato por grupo e desafio) |
| Exclusão de dados | Fica para o ao vivo (passo 9) |
| Execução de consulta SQL e dados no banco | Fica para o ao vivo (passo 10 e SQL ao vivo) |

## Divergências encontradas na leitura

| O quê | Onde | Como o vídeo trata |
| --- | --- | --- |
| A trigger de idade se chama `trg_usuario_idade_minima`; `trg_valida_idade_minima` é a **função** que ela executa | `roteiro-da-demonstracao.md` cita a função como se fosse a trigger | A faixa usa o nome da trigger |
| A trigger de crédito se chama `trg_membro_credito_inicial`; `trg_credito_inicial` é a função | Mesmo roteiro, passo 3 | A faixa usa o nome da trigger |
| RN04 cita a constraint `unq_voto_usuario`, que é do modelo antigo (`validacao.voto_evidencia`). Hoje o voto único vem de `pk_jurado_evidencia` | `08-regras-de-negocio.md` | A faixa usa `pk_jurado_evidencia` |
| A tela se chama **Votação**, não "Central de Votação" | Título da view e menu | O vídeo usa **Votação** |
| A mensagem de idade termina em "Eu Duvido!." (ponto depois da exclamação) | `Usuario.cs` | A captura mostra como está. Fora do escopo deste trabalho (`apps/api` não muda) |

As quatro primeiras são correções de documentação que ficam como sugestão para o
time. Este trabalho não altera `docs/` além do registro de IA.

## Impacto no tempo da banca

Com o deck de 14 slides, os slides somam cerca de 11:48 de fala. O vídeo ocupa
~2:28 entre os slides 9 e 10. A demonstração ao vivo, conduzida pelo professor,
e as perguntas ficam com o restante dos 40 a 45 minutos do edital.

## Capturas regeneradas em 27/11/2026

As capturas de 26/11 (19:50) eram anteriores ao PR #83 (voto e comentário do júri
na tela do desafio, aba Votação) e ao CSS de desktop da correção do U11. O script
rodou de novo contra o código de 27/11, com todas as conferências do banco
aprovadas (mesmos saldos, pote, júri e views vazias). Pelo SSIM, mudaram as
capturas dos capítulos 2, 3 e 4 (layout de `/grupos/:id`, `/desafios/nova` e
detalhe do desafio) e, de leve, 05-andamento, 05-votacao, 06-decisao e
08-perfil. O prazo mostrado passou de 03/12 para 04/12, por ser um dia depois.
