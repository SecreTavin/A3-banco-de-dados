# 2026-10-31 — Publicação na Cloudflare com a API por túnel

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-31 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/cloudflare/` (novo), ADR 0019, documento 16, conta da Cloudflare (subdomínio `workers.dev`) |

## O que foi pedido

Publicar o sistema na conta da Cloudflare do PO, com um endereço com o nome
dele, no lugar do subdomínio estranho dos outros projetos.

## Prompt utilizado

> Subir na minha cloudflare "as outras aplicações que subimos lá até hoje, contém um domínio estranho, para esse quero um como (Euduvido/SecreTavin.com)"

Respostas do PO às duas perguntas da IA: subdomínio gratuito
`secretavin.workers.dev` e túnel para o Docker do Mac.

## O que a IA produziu

* Levantamento da conta: nenhum domínio próprio, subdomínio `metal-rush` e dois
  projetos publicados. Com isso, as duas decisões (endereço e onde roda a API)
  foram levadas ao PO, com os custos de cada opção.
* Troca do subdomínio da conta para `secretavin`.
* Worker `euduvido`, que serve o build e repassa `/api` e `/hubs` ao túnel, e o
  `publicar.sh`, que gera o build, sobe o túnel e publica.
* ADR 0019 e a seção "Publicar na Cloudflare" no documento 16.

## O que a IA errou

* **Alarme falso na troca do subdomínio.** A API não troca o subdomínio direto:
  é preciso apagar o atual e criar outro. O script fazia isso e, se a criação
  falhasse, recriava `metal-rush`. A criação deu certo, mas o teste de sucesso
  procurava `"success":true` sem espaço e a resposta vinha com espaço. O script
  tentou recriar `metal-rush`, a Cloudflare recusou porque a conta já tinha
  subdomínio, e nada mudou. A conferência final mostrou `secretavin`.
* **`caffeinate` no lugar errado.** A primeira versão do script rodava o túnel
  dentro do `caffeinate` e guardava o PID do `caffeinate`. O `parar` mataria o
  `caffeinate` e poderia deixar o túnel órfão. Corrigido antes de rodar: o túnel
  sobe sozinho e o `caffeinate -w` acompanha o PID dele.
* **ADR 0010 desatualizado.** O ADR 0010 e o `tecnologias.md` dizem que Vercel e
  Render estão "Em uso", mas nada estava publicado. A IA só percebeu ao procurar
  um endereço de produção que não existia. Não foi corrigido nesta alteração; ver
  "Decisão final".

## Como o time validou

* `https://euduvido.secretavin.workers.dev` respondeu 200, e `/api/desafios`
  respondeu 401 (a API pede login), o que mostra o repasse pelo túnel.
* Login como Tavin e como Lari pelo site público, com as telas carregando dados
  do Docker.
* SignalR pelo endereço público: a negociação respondeu 200 com WebSockets
  disponível, e o WebSocket completou o *handshake* do protocolo.
* O build publicado não contém `localhost:5100` nem `localhost:5080`.
* O Metal Rush abre em `metal-rush.secretavin.workers.dev`. O Código Redação
  (Pages) não foi afetado.

## Decisão final

Entram o Worker, o script e a documentação. O frontend publicado hoje vem da
branch do redesign (PR #50), por `WEB_DIR`, porque é a versão que a API do
Docker serve. O PO decide depois se o ADR 0010 e o `tecnologias.md` passam a
dizer que Vercel e Render não foram adotados.
