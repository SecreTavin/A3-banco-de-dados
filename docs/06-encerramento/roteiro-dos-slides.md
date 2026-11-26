# Roteiro da apresentação dos slides (Banca Final)

Fala de cada um dos 26 slides na banca de **27/11/2026**. O edital prevê **40 a 45
minutos** por grupo. O plano usa **35:30** de apresentação, com o
[vídeo de demonstração](video-de-demonstracao.md) na abertura, e deixa de **4:30 a
9:30** para as perguntas.

A demonstração acontece no slide 19 e segue o
[Roteiro da demonstração](roteiro-da-demonstracao.md). O edital não exige que todos
falem, mas exige a presença de todos e avalia a capacidade de responder às
perguntas da banca.

## Quem fala e quando

| Bloco | Slides | Quem fala | Duração | Termina em |
| --- | --- | --- | --- | --- |
| **Vídeo de abertura** | antes do 1 | Octávio dá o play | **1:30** | 1:30 |
| Problema e solução | 1 a 6 | Octávio | 4:30 | 6:00 |
| Modelagem e banco | 7 a 13 | Arthur | 6:00 | 12:00 |
| Ledger, povoamento e consultas | 14 a 16 | Luís | 2:15 | 14:15 |
| Sistema | 17 a 19 | Rafael | 2:00 | 16:15 |
| **Demonstração ao vivo** | 19 | Todos | **14:00** | **30:15** |
| Testes, IA, plano e limitações | 20 a 23 | Mario | 3:45 | 34:00 |
| Conclusão e encerramento | 24 a 26 | Octávio | 1:30 | **35:30** |
| Perguntas da banca | 26 | Todos | 4:30 a 9:30 | 40 a 45 |

**Se o tempo apertar:** quem controla o relógio avisa ao chegar no slide 7 (6:00),
no 14 (12:00) e no 19 (15:45). Com mais de 2 minutos de atraso antes da
demonstração, reduza os slides **9, 11, 16 e 22** a uma frase cada. Eles somam
quase 3 minutos.

> A fala é um guia. Vale dizer com as próprias palavras, desde que os números e os
> nomes das regras continuem iguais.

---

## Bloco 0: vídeo de abertura (Octávio, 1:30)

O arquivo é [`video/eu-duvido-demo.mp4`](video/eu-duvido-demo.mp4), com 63 s, ou
81 s se as cenas filmadas forem gravadas a tempo. Deixe-o aberto em tela cheia
no computador do projetor, **com o som da sala testado**, porque a narração faz
parte do vídeo. Depois, volte aos slides no slide 1.

> Olá a todos. Antes dos slides, um minuto do Eu Duvido! funcionando.

Dar o play. Ao terminar, ir para o slide 1.

## Bloco 1: problema e solução (Octávio, 4:30)

### Slide 1 · Capa (0:30)

> Esse é o Eu Duvido!. Nós somos o grupo do projeto A3 da Unidade Curricular de
> Banco de Dados, com o professor Mário Sérgio. Ele transforma o "duvido que você
> consegue" entre amigos em um desafio registrado, com prova e júri. E quem
> garante que as regras sejam cumpridas é o banco de dados.

### Slide 2 · Integrantes (0:20)

> O grupo é formado por Arthur, Luís, Mario, Rafael e eu, Octávio. Vamos dividir a
> fala por assunto, e todos estão aqui para responder às perguntas no final.

### Slide 3 · O problema (1:00)

> Todo grupo de amigos tem isso: alguém solta um "duvido", outro aceita, e o
> combinado fica no WhatsApp. A partir daí aparecem quatro problemas. O primeiro é
> o calote e o esquecimento: o acordo é verbal, e cada um lembra do seu jeito. O
> segundo é a prova perdida: a foto ou o vídeo some no meio da conversa. O terceiro
> é o julgamento parcial: ganha quem argumenta melhor, não quem cumpriu. E o quarto
> é que só dinheiro conta: prenda e desafio sem valor não ficam registrados. Nosso
> público são estudantes a partir de 16 anos e seus grupos de amigos, que se
> desafiam por diversão.

### Slide 4 · Contexto em números (0:40)

> Esse público já vive de competição no celular. Em 2025, 168,7 milhões de
> brasileiros usaram a internet. Entre quem tem de 16 a 55 anos, 75,3% jogam jogos
> digitais, e o celular é a plataforma preferida de 44,1% dos jogadores. Só na
> Gamers Club são 3 milhões de jogadores. O que falta é um lugar que registre e
> julgue o desafio entre amigos.

### Slide 5 · A solução (1:00)

> O Eu Duvido! resolve isso em cinco passos. Primeiro, o grupo: cada membro entra
> com 100 CP, a moeda do app. Depois, o desafio: antes de existir, a proposta passa
> por uma IA de moderação. No aceite, o CP de quem entra fica retido, no que
> chamamos de escrow. Aí o desafiado envia a prova, e nesse momento o júri é
> congelado. Por fim, o júri vota e, quando atinge o quórum, o próprio banco apura
> o resultado e paga. Como tudo usa a mesma moeda, desafios com prenda e com prêmio
> entram na mesma conta. Guardem esse último passo: ele acontece inteiro dentro do
> PostgreSQL, numa única transação.

### Slide 6 · Requisitos e regras de negócio (1:00)

> Os requisitos funcionais cobrem o ciclo inteiro: login com Google, grupos,
> desafios com custo em CP, votação do júri, apuração automática, carteira com
> extrato e ranking. Nos não funcionais, o sistema é pensado para o celular, a
> votação acontece ao vivo, e a integridade é garantida pelo banco, não só pelo
> código. E temos regras que o sistema não deixa quebrar: o júri congela quando a
> prova chega, o CP fica retido no aceite, só entra quem tem 16 anos ou mais, e
> nenhum desafio existe sem passar pela IA. Para mostrar como o banco garante isso,
> passo para o Arthur.

---

## Bloco 2: modelagem e banco (Arthur, 6:00)

### Slide 7 · A regra mora no banco (0:15)

> Obrigado, Octávio. Essa é a ideia central do trabalho: a regra mora no banco. Se
> o código falhar, o PostgreSQL ainda recusa o que não pode acontecer.

### Slide 8 · Modelo de dados (0:45)

> O modelo tem 10 tabelas num único schema, organizadas em cinco módulos:
> identidade, grupos, desafios, validação e economia. O sexto módulo do código, o
> ranking, não tem tabela, porque só lê as outras. A separação entre módulos existe
> no código. No banco, as chaves estrangeiras atravessam os módulos e nunca são
> removidas, porque quem cuida da integridade é o banco.

### Slide 9 · Evolução da modelagem (0:45)

> Esse modelo não nasceu pronto. A primeira versão tinha 8 tabelas, sem economia e
> com o júri calculado na hora. Ele chegou a 15 tabelas em seis schemas e foi
> enxugado para as 10 atuais. A mudança mais importante foi congelar o júri: o
> quórum passou a ser calculado sobre quem foi convocado quando a prova chegou, e
> não sobre o tamanho atual do grupo. Se alguém entra ou sai no meio da votação, o
> quórum não muda.

### Slide 10 · DER (1:15)

> Aqui está o DER completo, com chaves primárias, estrangeiras, de unicidade e as
> cardinalidades. Lendo de cima para baixo: o usuário participa de grupos por meio
> de membro_grupo, onde fica o saldo dele naquele grupo. O grupo hospeda desafios.
> Cada desafio tem participantes, provas e uma avaliação da moderação. Cada prova
> convoca um júri, na tabela jurado_evidencia, cuja chave é a prova mais o jurado, e
> o voto nasce nulo. E tudo que mexe em CP vira uma linha em transacao_cp, que é o
> nosso livro-caixa.

### Slide 11 · Banco implementado (0:45)

> Implementamos isso em PostgreSQL 16. São 10 tabelas, 10 chaves primárias, 18
> estrangeiras, 24 restrições CHECK, 7 índices únicos, 4 triggers, 7 procedures e 5
> views. Esses números foram lidos do catálogo do próprio banco. Escolhemos o
> PostgreSQL porque o domínio depende de integridade referencial forte e de uma
> transação atômica entre validar e pagar.

### Slide 12 · Constraints e triggers (1:00)

> Na prática, o banco diz "não" sozinho. Uma trigger recusa o cadastro de quem tem
> menos de 16 anos antes de gravar. Outra impede que quem é parte do desafio seja
> jurado e torna o voto definitivo. Uma terceira lança automaticamente os 100 CP de
> quem entra no grupo. E a quarta bloqueia UPDATE e DELETE no livro-caixa. Além das
> triggers, temos chaves, UNIQUE e CHECK em status, valores e datas. Na
> demonstração, vocês vão ver o banco recusando um UPDATE ao vivo.

### Slide 13 · Transação (1:15)

> Este é o coração do sistema: a procedure apurar_votacao. Primeiro, ela trava a
> prova com FOR UPDATE, para que votos simultâneos esperem a vez. Depois calcula o
> quórum: metade do júri congelado, mais um. Com três jurados, são dois votos. Se o
> quórum foi atingido, ela credita quem votou e chama encerrar_desafio, que libera o
> valor retido e paga o pote no livro-caixa. Tudo numa transação só. Por isso, não
> existe estado em que a prova foi aceita e o CP não foi pago. Para continuar com o
> livro-caixa, passo para o Luís.

---

## Bloco 3: ledger, povoamento e consultas (Luís, 2:15)

### Slide 14 · Ledger append-only (0:50)

> Obrigado, Arthur. Todo CP tem extrato, e o extrato não se apaga. Cada movimento é
> uma linha nova em transacao_cp: crédito inicial, escrow, prêmio, recompensa de
> voto, estorno e saída do grupo. Se algo saiu errado, não se corrige a linha:
> lança-se um estorno. E temos duas views de segurança, que devem ficar sempre
> vazias. Uma mostra saldo diferente da soma do livro-caixa. A outra mostra pote
> preso em desafio encerrado. Se alguma devolver linha, é bug.

### Slide 15 · Povoamento (0:45)

> O banco foi povoado por nós cinco, com contas Google reais, usando o próprio
> sistema. Só as quatro categorias vêm de script. Usuários, grupos, desafios, provas
> e votos passaram pelas mesmas regras de um uso normal, e nenhum lançamento de CP
> foi escrito à mão. Mantemos dados fictícios apenas para os testes automáticos. Na
> demonstração, vamos consultar o volume real direto no banco.

### Slide 16 · Consultas analíticas (0:40)

> Escrevemos 11 consultas analíticas, e cada uma responde a uma pergunta do produto:
> essa prova passou? Quem lidera o grupo? Para onde foi meu CP? O júri participa? A
> contabilidade fecha? A IA recusa o quê? Elas usam JOINs, agregações, subconsultas
> e window function, e rodam no CI a cada alteração. Agora o Rafael mostra o sistema
> em volta do banco.

---

## Bloco 4: sistema (Rafael, 2:00)

### Slide 17 · Arquitetura (1:00)

> Obrigado, Luís. A aplicação usa .NET 10 no backend, React com TypeScript no
> frontend e PostgreSQL 16, tudo em Docker. Separamos os caminhos de leitura e de
> escrita. A escrita usa EF Core, com as regras no domínio. A leitura usa Dapper,
> com SQL escrito à mão. A votação é em tempo real com SignalR, mas ele só avisa a
> tela depois do commit: nunca decide o resultado. A moderação usa o modelo
> gpt-oss-120b, na Groq. E o sistema está publicado numa VM da Oracle.

### Slide 18 · Principais telas (0:30)

> Estas são as principais telas. Em Meus desafios, a pessoa vê o que está em jogo
> em cada grupo. Em Criar desafio, a IA recusa e explica o motivo. E na Votação, o
> júri vê a prova e acompanha o placar ao vivo. Funciona no navegador do celular,
> sem instalar nada.

### Slide 19 · Demonstração ao vivo (0:30)

> Agora vamos fazer tudo isso de verdade, ao vivo, cada um na própria conta Google.
> De um lado, o site. Do outro, cada comando SQL que a aplicação manda ao banco, com
> os e-mails mascarados. Vamos percorrer a vida de um desafio em dez passos.
> Octávio, pode começar.

### Demonstração (14:00)

Sair dos slides e seguir o [Roteiro da demonstração](roteiro-da-demonstracao.md),
passos 1 a 10. Ao terminar, voltar ao **slide 20**.

---

## Bloco 5: testes, IA, plano e limitações (Mario, 3:45)

### Slide 20 · Qualidade (1:00)

> O que vocês viram também foi testado de forma automática. Temos 174 testes da API,
> contra um PostgreSQL real. O roteiro de ponta a ponta pela API passa em 18 de 18.
> Os cenários de moderação com a IA simulada passam em 14 de 14. Pela tela, são 14
> de 15. O cenário que falta, o U11, aponta que o redesign faz o conteúdo rolar
> dentro da área principal em três telas. É uma diferença de layout, sem efeito nos
> dados, e preferimos mostrar o número real. A cada pull request, o CI aplica o
> schema num banco limpo, povoa, roda as consultas e confere a contabilidade.

### Slide 21 · IA no desenvolvimento (1:15)

> Usamos IA de duas formas. No desenvolvimento, o Claude Code. Dentro do app, um
> modelo na Groq faz a moderação. Nossa regra foi registrar cada uso: são 72
> registros, e cada um diz a ferramenta, o prompt, o que a IA produziu, o que ela
> errou e como o time validou. Um exemplo: pedimos um jeito de mostrar as chamadas
> ao banco durante a apresentação. A IA colocou dois ALTER SYSTEM numa transação, e
> o PostgreSQL recusou. Corrigimos e validamos num ensaio, com o voto aparecendo no
> SQL ao vivo. Foi essa tela que vocês acabaram de ver.

### Slide 22 · Plano de trabalho (0:45)

> Este é o plano de trabalho, de setembro a novembro, com os responsáveis por cada
> atividade. Os requisitos e a modelagem vieram em setembro e outubro. Em novembro,
> o foco foi login com Google, publicação e preparação da banca. Os responsáveis
> saem dos commits, das pull requests e dos registros de IA, então o quadro pode ser
> conferido no repositório.

### Slide 23 · Limitações e próximos passos (0:45)

> Também temos limites. A prova aceita foto e link, mas o envio de vídeo foi modelado
> e não implementado. O veredito da IA é do modelo e pode errar: o que garantimos é
> que toda proposta seja avaliada e gravada. E o site roda na VM de um integrante,
> sem backup gerenciado. Como próximos passos, pensamos em cancelamento por votação,
> prorrogação de prazo e ranking global. Octávio, pode concluir.

---

## Bloco 6: conclusão e encerramento (Octávio, 1:30)

### Slide 24 · Conclusão (1:00)

> Obrigado, Mario. Entregamos um protótipo funcional em que o banco garante as
> regras. Sem calote: o CP fica retido até o resultado, e todo movimento fica no
> livro-caixa. Com decisão justa: júri congelado, quórum de maioria e voto
> definitivo. E o maior aprendizado foi que modelar é revisar: passamos de 8 para 15
> e, por fim, 10 tabelas, cada mudança com um porquê. A IA ajudou, mas cada uso foi
> conferido e registrado. A aplicação pode errar; o banco não deixa o erro virar
> dado.

### Slide 25 · Referências (0:15)

> As principais fontes estão aqui, e a lista completa, em ABNT, está no documento 21
> do GitBook.

### Slide 26 · Perguntas (0:15)

> Essa foi a nossa apresentação. Obrigado pela atenção. Agora, ficamos à disposição
> para as perguntas.

---

## Quem responde às perguntas

Deixe o **slide 26** na tela, com o site e o `psql` abertos para responder com
demonstração. Respostas prontas estão em
[Perguntas prováveis](roteiro-da-demonstracao.md#perguntas-prováveis).

| Assunto | Quem responde primeiro |
| --- | --- |
| Problema, regras de negócio e decisões de produto | Octávio |
| Modelagem, DER, constraints, procedures e transação | Arthur |
| Ledger, povoamento e consultas SQL | Luís |
| Arquitetura, login, publicação e VM | Rafael |
| Testes, uso de IA e limitações | Mario |
