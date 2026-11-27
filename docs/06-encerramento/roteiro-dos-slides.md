# Roteiro da apresentação dos slides (Banca Final)

Fala de cada um dos 14 slides do deck "Eu Duvido! — Banca Final A3" (Figma
Slides) na banca de **27/11/2026**. O edital prevê **40 a 45 minutos** por grupo.
São dois vídeos: o [trailer](video-de-demonstracao.md) abre a apresentação, antes
do slide 1, e o vídeo **"Demonstracao"**
([`apps/video/DEMONSTRACAO.md`](../../apps/video/DEMONSTRACAO.md)), um passeio
pelas telas reais, passa entre os slides 9 e 10. Com os dois, a apresentação
leva **16:03**. Depois do último slide vem a **demonstração ao vivo, conduzida
pelo professor**, e por fim as perguntas. Sobram de **23:57 a 28:57** para as
duas.

A demonstração segue as instruções do professor. O
[Roteiro da demonstração](roteiro-da-demonstracao.md) é a ordem de reserva, se
ele não indicar outra. O edital não exige que todos falem, mas exige a presença
de todos e avalia a capacidade de responder às perguntas da banca.

## Quem fala e quando

A divisão segue o rodapé "quem fala" de cada slide do deck.

| Bloco | Slides | Quem fala | Duração | Termina em |
| --- | --- | --- | --- | --- |
| **Trailer** | antes do 1 | Rafael dá o play | **1:30** | 1:30 |
| Abertura | 1 e 2 | Rafael | 0:50 | 2:20 |
| Público e regras | 3 e 4 | Octávio | 2:00 | 4:20 |
| Modelagem e banco | 5 a 7 | Arthur | 3:00 | 7:20 |
| Garantias do banco e arquitetura | 8 e 9 | Luís | 2:00 | 9:20 |
| **Vídeo "Demonstracao"** | entre o 9 e o 10 | Luís dá o play | **2:28** | 11:48 |
| Testes | 10 a 12 | Mario | 2:30 | 14:18 |
| IA, limitações e encerramento | 13 e 14 | Rafael | 1:45 | **16:03** |
| **Demonstração ao vivo** | depois do 14 | Todos, conduzidos pelo professor | cerca de **14:00** | cerca de 30:03 |
| Perguntas da banca | 14 | Todos | o restante | 40 a 45 |

**Se o tempo apertar:** quem controla o relógio avisa ao chegar no slide 5 (4:20)
e no vídeo "Demonstracao" (9:20). Com mais de 2 minutos de atraso, reduza os
slides **6, 11 e 12** a uma frase cada. Eles somam 2:15. O tempo da demonstração
é do professor: o que ele não pedir, fica para as perguntas.

> A fala é um guia. Vale dizer com as próprias palavras, desde que os números e os
> nomes das regras continuem iguais.

---

## Bloco 0: trailer (Rafael, 1:30)

O trailer está pronto e publicado no YouTube. Deixe-o aberto em tela cheia no
computador do projetor, **com o som da sala testado**, porque a narração faz
parte do vídeo. Como reserva para o caso de a rede da sala falhar, tenha uma
cópia local do mesmo vídeo.

> Olá a todos. Antes dos slides, um minuto do Eu Duvido!.

Dar o play. Ao terminar, ir para o slide 1.

## Bloco 1: abertura (Rafael, 0:50)

### Slide 1 · Capa (0:30)

> Esse é o Eu Duvido!: desafios entre amigos, com prova, júri e um
> banco de dados que não aceita calote. Somos o grupo do projeto A3 da Unidade
> Curricular de Banco de Dados, com o professor Mário Sérgio. O app transforma o
> "duvido que você consegue" num desafio registrado, e quem garante as regras é o
> banco.

### Slide 2 · Quem fez o Eu Duvido! (0:20)

> O Arthur cuidou do desenvolvimento. O Luís e o Mario testaram, no celular e no
> desktop. O Octávio é o nosso Product Owner, e eu, Rafael, fiquei com a
> documentação. Dividimos a fala por assunto, e todos respondem às perguntas no
> final. Octávio, com você.

---

## Bloco 2: público e regras (Octávio, 2:00)

### Slide 3 · Para quem o Eu Duvido! existe (1:00)

> Todo grupo de amigos tem isso: alguém solta um "duvido", outro aceita, e o
> combinado fica no WhatsApp. Aí vem o calote, a prova perdida no meio da conversa
> e o julgamento de quem argumenta melhor. Nosso público são estudantes e seus
> grupos de amigos, a partir de 16 anos: abaixo disso, o próprio banco recusa o
> cadastro. E esse público já vive de competição no celular. Segundo a Pesquisa
> Game Brasil 2026, 75,3% dos brasileiros de 16 a 55 anos jogam jogos digitais, e
> 44,1% dos jogadores preferem o celular.

### Slide 4 · O que o sistema não deixa quebrar (1:00)

> O ciclo é simples. O grupo entra com 100 CP por membro, a moeda do app. A
> proposta de desafio passa pela IA de moderação. Quem aceita tem o CP retido. O
> desafiado envia a prova, e o júri vota. E quatro regras não quebram. RN14: o júri
> é definido quando a prova chega, e não muda depois. RN18: o custo fica retido no
> aceite, em escrow. RN26: o banco barra o cadastro de menores de 16 anos. RN28:
> nenhuma proposta vira desafio sem passar pela moderação, e a avaliação fica
> gravada. Para mostrar como o banco garante isso, passo para o Arthur.

---

## Bloco 3: modelagem e banco (Arthur, 3:00)

### Slide 5 · 10 tabelas, 6 módulos no código (1:00)

> Obrigado, Octávio. O modelo tem 10 tabelas num único schema. No código, elas se
> dividem em módulos: identidade, grupos, desafios, validação e economia. O sexto
> módulo, o ranking, não tem tabela, porque só lê as outras. A separação existe no
> código. No banco, as chaves estrangeiras atravessam os módulos e nunca são
> removidas, porque quem cuida da integridade é o banco. Esse modelo não nasceu
> pronto: começou com 8 tabelas, chegou a 15 e foi enxugado para as 10 atuais.

### Slide 6 · O modelo virou estrutura no banco (0:45)

> Implementamos isso em PostgreSQL 16. São 10 tabelas, 10 chaves primárias, 18
> estrangeiras, 24 restrições CHECK, 7 índices únicos, 4 triggers, 7 procedures e 5
> views. Esses números foram lidos do catálogo do próprio banco.

### Slide 7 · Apurar e pagar é um passo só (1:15)

> Este é o coração do sistema: a procedure apurar_votacao, numa única transação.
> Primeiro, ela trava a prova com FOR UPDATE, para que votos simultâneos esperem a
> vez. Depois calcula o quórum: metade do júri, mais um. Com três jurados, são dois
> votos. Se o quórum foi atingido, ela credita quem votou, libera o escrow e paga o
> pote. Por isso, não existe estado em que a prova foi aceita e o CP não foi pago.
> Luís, com você.

---

## Bloco 4: garantias do banco e arquitetura (Luís, 2:00)

### Slide 8 · O banco diz "não" sozinho (1:00)

> Obrigado, Arthur. O banco recusa sozinho o que não pode acontecer. Uma trigger
> recusa quem tem menos de 16 anos. Outra impede que quem é parte do desafio seja
> jurado e torna o voto definitivo. E o livro-caixa, a tabela transacao_cp, não
> aceita UPDATE nem DELETE: um erro se corrige com um lançamento novo de estorno,
> nunca apagando a linha. Duas views de segurança devem ficar sempre vazias: uma
> compara o saldo com o livro-caixa, a outra procura pote preso. Se alguma devolver
> linha, é bug. Na demonstração ao vivo, no fim, dá para ver o banco recusando
> esse UPDATE.

### Slide 9 · Ler e escrever são caminhos separados (1:00)

> A aplicação usa .NET 10, React 19 e PostgreSQL 16, tudo em Docker. A escrita usa
> EF Core, com as regras no domínio. A leitura usa Dapper, com SQL escrito à mão, o
> mesmo das consultas analíticas. A votação é em tempo real com SignalR, mas ele só
> avisa a tela depois do commit: nunca decide o resultado. A moderação usa o modelo
> gpt-oss-120b, na Groq. Antes de falar dos testes, vamos ver o ciclo inteiro de
> um desafio, tela por tela.

### Vídeo "Demonstracao" (2:28)

Passeio pelas telas reais, do login ao pagamento, com o objeto do banco que
garante cada passo ([`apps/video/DEMONSTRACAO.md`](../../apps/video/DEMONSTRACAO.md)).
Tem 2:28 (148 s), com a narração do ElevenLabs (modelo v4). Ele vai
num slide próprio depois do 9 ("Agora, o ciclo inteiro, tela por tela", rodapé
"Luís · vídeo", sem número, para os slides 10 a 14 manterem a numeração). O Luís dá o play e, ao
terminar, segue para o **slide 10**.

---

## Bloco 5: testes (Mario, 2:30)

### Slide 10 · Testado do banco até a tela (1:00)

> O que vocês viram no vídeo também é testado de forma automática. São 183
> testes da API, contra um PostgreSQL real. O roteiro de ponta a ponta pela API
> passa em 30 de 30. A moderação com a IA simulada passa em 14 de 14. E pela
> tela, 21 de 21, com o U11 aprovado, o cenário de layout que reprovava desde
> 20/11. A cada pull request, o CI aplica o schema num banco limpo, povoa e
> confere as views de contabilidade.

### Slide 11 · Teste no desktop (0:45)

> Também testamos como usuários. No desktop, eu relatei rolagem vertical, texto
> pequeno e espaço vazio nas laterais. O PR #35 corrigiu: as telas ficaram sem
> rolagem vertical, com texto maior e largura útil de 1360 px.

### Slide 12 · Teste no celular (0:45)

> No celular, o Luís relatou conteúdo inalcançável, contraste fraco e alvos de
> toque pequenos. O PR #34 trouxe rolagem interna com topo e menu fixos, contraste
> AA e alvos de 40 px ou mais. E o redesign mobile foi aprovado no Figma. Rafael,
> com você.

---

## Bloco 6: IA, limitações e encerramento (Rafael, 1:45)

### Slide 13 · /goal: a IA só parava com tudo passando (1:00)

> Obrigado, Mario. Na véspera, demos à IA uma meta: cobrir os 201 cenários do
> roteiro de ponta a ponta. Um hook não deixava ela parar enquanto algum cenário
> falhasse. Os testes acharam 10 defeitos reais, como um pote de CP que ficava
> preso e o hub de votação aceitando conexão sem login. A IA não decidiu sozinha:
> perguntou, o time escolheu as regras, e só então ela corrigiu. Hoje são 201 de
> 201. E cada uso de IA tem registro: são 82, um por alteração, com o que a IA
> produziu, o que errou e como validamos.

### Slide 14 · O que ficou de fora, e o que vem depois (0:45)

> Também temos limites. O envio de vídeo da prova foi modelado e não implementado.
> O veredito da IA é do modelo e pode errar: o que garantimos é que toda proposta
> seja avaliada e gravada. E o site roda numa VM, sem backup gerenciado. Como
> próximos passos, pensamos em cancelamento por votação, prorrogação de prazo e
> ranking global. O código e a documentação completa estão no GitHub e no GitBook.
> Obrigado pela atenção. Agora, a demonstração ao vivo: professor, estamos todos
> logados e prontos para mostrar o que o senhor quiser ver.

---

## Demonstração ao vivo (todos, cerca de 14:00)

Sair dos slides e abrir as duas janelas do projetor: o site e o SQL ao vivo.
Cada integrante já está logado no próprio celular, na própria conta Google.

* **Siga as instruções do professor.** Ele escolhe o que quer ver e em que
  ordem.
* **Se ele não indicar,** siga os passos 1 a 10 do
  [Roteiro da demonstração](roteiro-da-demonstracao.md).
* **Se ele pedir algo fora da ordem,** use a tabela "Visão geral" do roteiro
  da demonstração para achar o passo e quem age nele. Os saldos e o quórum
  do roteiro só valem com os passos na ordem: fora dela, confira o resultado no
  SQL ao vivo antes de comentar o número.
* Ao terminar, voltar ao **slide 14** para as perguntas.

---

## Quem responde às perguntas

Deixe o **slide 14** na tela, com o site e o `psql` abertos para responder com
demonstração. Respostas prontas estão em
[Perguntas prováveis](roteiro-da-demonstracao.md#perguntas-prováveis).

| Assunto | Quem responde primeiro |
| --- | --- |
| Problema, regras de negócio e decisões de produto | Octávio |
| Modelagem, DER, procedures e transação | Arthur |
| Constraints, triggers, ledger e consultas SQL | Luís |
| Testes automatizados e de usabilidade | Mario |
| Arquitetura, login, publicação, uso de IA e testes de ponta a ponta | Rafael |
