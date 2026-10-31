# 0019 - Demonstração pública pela Cloudflare, com a API por túnel

* **Status:** Aceita
* **Data:** 2026-10-31
* **Decisores:** Octávio Arruda (Product Owner)

## Contexto

Depois da apresentação, o professor pediu o sistema publicado na internet. O
[ADR 0010](0010-hospedagem-e-deploy.md) previa Vercel, Render e Aiven, mas
nenhuma dessas contas chegou a ser criada: até aqui o sistema só rodava no
Docker de quem demonstrava ([16 - Execução Local](../16-execucao-local.md)).

O PO já publica outros projetos numa conta da Cloudflare, e queria o mesmo
lugar, com um endereço que tivesse o nome dele. Restrições:

* **A conta não tem domínio próprio.** Os endereços são `*.workers.dev`. O
  subdomínio da conta era `metal-rush`, herdado do primeiro projeto, e isso
  gerava endereços como `metal-rush.metal-rush.workers.dev`.
* **A Cloudflare não roda a API.** Workers executam JavaScript; a API é .NET com
  PostgreSQL e SignalR.
* **Sem conta nova e sem custo.** Render e Aiven exigiriam criar e configurar
  duas contas.

## Decisão

**O frontend fica num Worker da Cloudflare. A API e o banco continuam no Docker
do Mac do PO, expostos por um túnel rápido do `cloudflared`.**

| Peça | Onde roda | Endereço |
| --- | --- | --- |
| Frontend (`apps/web`) | Worker `euduvido` com o build como *static assets* | `https://euduvido.secretavin.workers.dev` |
| `/api/*` e `/hubs/*` | O mesmo Worker repassa para o túnel | Mesma origem do site |
| API, PostgreSQL e MinIO | `docker compose` no Mac do PO | `localhost:5080`, exposto pelo túnel |

* **O subdomínio da conta passou de `metal-rush` para `secretavin`.** Vale para
  todos os Workers da conta: o Metal Rush passou a
  `metal-rush.secretavin.workers.dev`, e o endereço antigo parou de responder.
* **Mesma origem.** O build é gerado com `VITE_API_URL` vazio, então o frontend
  chama `/api/...` e `/hubs/...` no próprio site. O Worker repassa essas duas
  rotas; o resto é servido como arquivo. Por ser a mesma origem, não há CORS a
  configurar, e o WebSocket do SignalR passa pelo Worker.
* **Endereço do túnel em variável.** O túnel rápido ganha um endereço
  `*.trycloudflare.com` novo a cada subida. O `scripts/cloudflare/publicar.sh`
  sobe o túnel, lê o endereço e publica o Worker com ele em `API_ORIGIN`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Render + Aiven ([0010](0010-hospedagem-e-deploy.md)) | No ar sem depender de um computador; backup gerenciado | Duas contas novas para criar e configurar; a API hiberna e demora a acordar | O PO escolheu não criar contas agora |
| Comprar `secretavin.com` | Endereço `euduvido.secretavin.com`; túnel nomeado com endereço fixo para a API | Custa cerca de US$ 10 por ano | O PO escolheu a opção gratuita |
| Projeto `euduvido.pages.dev` | Não mexe nos outros projetos | Endereço sem o nome do PO | Não atende ao pedido |
| Frontend chamando o túnel direto | Sem Worker de repasse | Endereço do túnel embutido no build; CORS para cada endereço novo | Cada subida do túnel exigiria rebuild e mudança de configuração na API |

## Consequências

**Positivas:** o professor e a banca acessam por um endereço fixo, pelo celular,
sem instalar nada. O banco é o mesmo do Docker que já roda os testes. Publicar
de novo é um comando.

**Negativas:**

* **O site depende do Mac do PO.** Com o Mac desligado, sem rede, ou com o
  Docker ou o túnel parados, as telas abrem, mas toda chamada responde "A API
  está fora do ar". O script impede o Mac de dormir enquanto o túnel está no ar,
  mas não impede que ele seja desligado.
* **Login de desenvolvimento aberto.** A API roda com `Auth:Provider=Dev`:
  qualquer pessoa com o link entra como qualquer usuário do seed e cria conta de
  teste. É aceitável para uma demonstração com dados fictícios, não para uso
  real.
* **A chave da Groq fica exposta ao uso.** Quem criar desafios pelo site consome
  a cota da chave do PO.
* **Túnel rápido sem garantia.** O `trycloudflare.com` é gratuito e sem
  garantia de disponibilidade. Se cair, basta rodar o script de novo.

**Impacto na documentação:** [16 - Execução Local](../16-execucao-local.md)
ganha a seção "Publicar na Cloudflare". O ADR 0010 continua como a hospedagem
prevista para produção.
