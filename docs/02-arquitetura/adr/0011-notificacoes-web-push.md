# 0011 - Notificacoes persistidas com Web Push e tempo real via SignalR

* **Status:** Substituída por `0016-schema-unico-e-modelo-enxuto.md`
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O produto tem dois momentos em que o usuario precisa saber de algo **sem estar
olhando para a tela**:

* **Prazo vencendo.** A evidencia tem `data_limite_votacao`; o desafio tem prazo
  de cumprimento. Quem nao e avisado perde o voto, e o quorum congelado
  ([0008](0008-quorum-congelado.md)) nao se recalcula por isso — validador que
  sumiu continua contando no denominador.
* **Convite, aceite, resolucao.** Eventos que acontecem enquanto o app esta
  fechado.

E tem um momento em que varias pessoas olham **a mesma tela ao mesmo tempo**: a
Central de Votacao (tela 27), onde o grupo vota e o desafio fecha sozinho quando
o quorum e atingido.

Sao problemas diferentes e foram tratados como um so em discussoes anteriores.
Nao sao: um pede **entrega assincrona e duravel**, o outro pede **atualizacao
sincrona de tela aberta**.

Restricao de fundo: o [0001](0001-stack-tecnologica.md) descartou PWA como
objetivo de arquitetura. `manifest.json` e service worker entram aqui, e apenas
porque o Web Push exige — nao como meta.

## Decisao

**Duas coisas distintas, com escopos deliberadamente diferentes.**

### 1. SignalR — apenas na Central de Votacao

Um unico hub, usado em uma unica tela. Ele emite dois eventos: **contagem de
votos atualizada** e **votacao encerrada**. Nada mais do sistema usa WebSocket.

**Regra critica, que define o desenho inteiro:**

> O SignalR **notifica** que uma transacao commitou. Ele **nunca decide** o
> resultado. O evento e emitido **depois** do commit, lendo o estado que o banco
> ja gravou.

Se a decisao viesse do socket — se o cliente somasse votos e concluisse "atingiu
o quorum" — o invariante mais importante do projeto sairia do banco e passaria a
morar no navegador. A apuracao acontece dentro de
`validacao.apurar_votacao` em uma transacao ([0008](0008-quorum-congelado.md));
o hub apenas conta o que ja aconteceu. Em caso de duvida entre o que o socket
mostrou e o que o banco tem, **o banco esta certo** — e um refresh da tela e
sempre a fonte de verdade.

A fonte de leitura do evento e `validacao.vw_status_votacao`, que ja calcula
quorum, total de votos e votos faltantes.

**Por que o escopo e so a votacao.** Na banca, tres celulares abertos no mesmo desafio vendo a contagem subir e o desafio fechar sozinho **prova visualmente que
a procedure rodou dentro de uma transacao**. E a demonstracao mais direta da
decisao estrutural do projeto. Nas outras telas, tempo real nao prova nada e nao
melhora nada perceptivel — escopo amplo custa e nao paga.

**Infraestrutura:** com **uma unica instancia da API, o SignalR nao precisa de
backplane nem de sticky sessions** — a documentacao da Microsoft lista
explicitamente "single server in a single process" como cenario que dispensa
ambos ([MS Learn](https://learn.microsoft.com/en-us/aspnet/core/signalr/scale)).
Com **duas ou mais instancias, os dois passam a ser obrigatorios**: backplane
(Redis) para propagar mensagens entre processos e sticky sessions para manter o
cliente no mesmo servidor. O projeto roda uma instancia so na Render
([0010](0010-hospedagem-e-deploy.md)), entao nao adota nenhum dos dois. Isso e
uma decisao amarrada ao numero de instancias: **escalar horizontalmente exige
revisitar este ADR**, nao apenas subir uma replica.

No frontend, o pacote e **`@microsoft/signalr`**. O antigo `@aspnet/signalr`
esta descontinuado e nao deve ser instalado.

### 2. Notificacoes — persistidas no banco, entregues por Web Push

Toda notificacao **vira linha em `notificacoes.notificacao` primeiro**. A
entrega e consequencia, nao a notificacao em si.

* `notificacoes.notificacao` guarda destinatario, tipo, referencia ao objeto
  (desafio, evidencia, grupo), texto e estado de leitura. E o que alimenta a
  central de notificacoes dentro do app.
* `notificacoes.push_subscription` guarda o **endpoint por dispositivo** — o
  mesmo usuario tem uma inscricao no celular e outra no notebook. Endpoint
  invalido (retorno 404 ou 410 do servico de push) e removido.
* A entrega usa **Web Push com VAPID**.

**Um `BackgroundService` dentro do proprio processo da API** varre prazos
vencendo e enfileira as notificacoes. Nao ha worker separado, nao ha fila
externa: um serviço a mais nao se paga num projeto de uma instancia, e o
`BackgroundService` compartilha o mesmo pool de conexoes ja limitado a 15
([0010](0010-hospedagem-e-deploy.md)).

**Biblioteca: `WebPush`** (web-push-libs), versao 1.0.13, publicada em
2026-04-28, com 6,8 milhoes de downloads e manutencao ativa. **Nao existe
biblioteca oficial da Microsoft para Web Push** — foi verificado. A alternativa
avaliada foi `Lib.Net.Http.WebPush` 3.3.1, que tem integracao melhor com
`IHttpClientFactory` e injecao de dependencia; ficou como segunda opcao caso o
ciclo de vida do `HttpClient` incomode.

### O aviso do iOS

**No iOS, Web Push so funciona se o site tiver sido adicionado a tela de
inicio.** Vale desde o iOS 16.4, o `manifest.json` precisa declarar `display`
como `standalone` ou `fullscreen`, e o pedido de permissao **tem que partir de
uma interacao do usuario dentro do app ja instalado**
([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).

Consequencia pratica, e ela e obrigatoria:

> **A demonstracao da banca nao pode depender de push chegar.**

Push e conveniencia. O que a banca precisa ver — a votacao fechando ao vivo — sai
do SignalR, que funciona em qualquer navegador aberto. Onboarding especifico de
iOS ("adicione a tela de inicio para receber avisos") entra na interface, mas
nao entra no roteiro da apresentacao.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Sem tempo real, so polling na Central de Votacao | Nada a configurar; sem WebSocket, sem hub | Atraso de segundos; requisicao repetida contra um banco com 20 conexoes | Num grupo de amigos ninguem notaria a diferenca — mas perde a demonstracao que prova a transacao |
| SignalR em todo o sistema (grupos, convites, ranking) | Interface inteira sempre atual | Cada tela vira estado sincronizado; reconexao, ordenacao e conflito viram problema em todo lugar | Escopo grande sem retorno — nenhuma outra tela ganha nota por ser tempo real |
| So notificacao in-app, sem push | Uma tabela e uma tela, zero infraestrutura externa | Nao avisa ninguem com o app fechado — que e exatamente o caso do prazo vencendo | O problema que motivou o ADR fica sem solucao |
| So push, sem persistir no banco | Menos uma tabela | Quem estava sem rede, com o dispositivo desligado ou com a inscricao expirada **nunca ve o aviso** | Notificacao sem historico e notificacao perdida; e nao ha o que mostrar na central do app |
| Fila externa (Redis, RabbitMQ) para o disparo | Desacopla o envio da API | Mais um servico gerenciado, mais uma credencial, mais um ponto de falha | Volume do projeto cabe num `BackgroundService`; infraestrutura sem justificativa e o que este projeto evita |
| Notificacao por e-mail | Funciona em qualquer dispositivo, sem service worker | Ninguem le e-mail de app de desafio entre amigos; e o iOS continua sem push | Resolve a entrega e perde o produto |

## Consequencias

**Positivas:** a Central de Votacao passa a ser demonstravel em varios
dispositivos ao mesmo tempo, o que torna visivel a apuracao transacional do
banco. As notificacoes tem historico consultavel, entao "perdi o push" deixa de
significar "perdi a informacao". O `BackgroundService` no mesmo processo mantem
o deploy com uma unidade so.

**Negativas:** entram no projeto um service worker, um `manifest.json` e um par
de chaves VAPID — infraestrutura de PWA que o [0001](0001-stack-tecnologica.md)
tinha descartado como objetivo, aceita aqui so como meio. `push_subscription`
exige limpeza de endpoints mortos, senao a tabela acumula lixo e o envio gasta
tempo com destinos invalidos. O iOS fica com experiencia inferior e depende de
onboarding que muitos usuarios nao completam. E a regra de que o evento so sai
**depois** do commit precisa ser respeitada em todo handler que emitir pelo hub
— emitir antes reintroduz exatamente o problema que o desenho evita. Por fim, o
hub consome conexoes do mesmo pool de 15
([0010](0010-hospedagem-e-deploy.md)).

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md)
(SignalR, `@microsoft/signalr`, WebPush, VAPID),
[13-visao-geral.md](../13-visao-geral.md) (hub e `BackgroundService` no
diagrama), [14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md) (evento emitido
apos o commit),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md)
(schema `notificacoes`, tabelas `notificacao` e `push_subscription`),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md),
[27-tela-central-votacao.md](../../04-ux/telas/27-tela-central-votacao.md).
