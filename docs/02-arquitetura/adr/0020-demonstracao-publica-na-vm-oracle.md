# 0020 - Demonstração pública numa VM da Oracle Cloud

* **Status:** Aceita
* **Data:** 2026-11-16
* **Decisores:** Rafael Alves; Octávio Augusto Arruda dos Prazeres (Product Owner), na revisão de 16/11/2026
* **Complementado por:** [ADR 0023](0023-cloudflare-como-reserva-da-vm.md), de 26/11/2026: o endereço antigo não redireciona, ele virou a reserva da VM

## Contexto

O [ADR 0019](0019-demonstracao-publica-cloudflare-tunel.md) publicou o sistema
em `euduvido.secretavin.workers.dev`, com a API, o banco e o MinIO rodando no
Docker do Mac do PO. A consequência negativa principal se confirmou: o site só
funciona enquanto aquele Mac está ligado, com o Docker e o túnel rápido de pé.
O túnel rápido também muda de endereço a cada subida, e cada queda exige rodar o
script de novo.

O professor precisa testar o sistema sem depender do horário em que alguém está
com o computador ligado. Um dos integrantes já mantém uma VM na Oracle Cloud
(ARM64, sempre ligada), com um túnel nomeado da Cloudflare no domínio
`falveshub.com`, usada por outro projeto. Sobra memória e disco para o Eu
Duvido.

## Decisão

**O sistema inteiro roda com o `docker-compose.yml` do repositório na VM da
Oracle, publicado em https://euduvido.falveshub.com pelo túnel nomeado que já
existe nela.** O endereço antigo, `euduvido.secretavin.workers.dev`, passa a
redirecionar para o novo, para que o link que o professor já tem continue
funcionando.

| Peça | Onde roda | Exposição |
| --- | --- | --- |
| Frontend (nginx) | Container `web` na VM | `127.0.0.1:5380`, publicado pelo túnel |
| `/api/*` e `/hubs/*` | O nginx do `web` repassa para o container `api` | Mesma origem do site |
| API, PostgreSQL e MinIO | Containers do compose na VM | Só na rede interna do Docker |

* **Mesma origem, como no 0019.** O build sai com `VITE_API_URL` vazio e o nginx
  do container `web` repassa `/api/` e `/hubs/` (com o *upgrade* de WebSocket do
  SignalR) para a API. Não há CORS a configurar.
* **Nenhuma porta aberta na VM.** Um `docker-compose.override.yml` que existe só
  na VM tira as portas publicadas de `db`, `storage` e `api` e liga o `web` só em
  `127.0.0.1`. Quem entra de fora passa pelo túnel.
* **Banco semeado, como em qualquer ambiente.** O banco é criado pelo
  `schema.sql` e pelo `seed.sql` no *initdb*, como no Docker local. Assim, o
  roteiro da demonstração vale também no endereço público: o README, o slide da
  demonstração e o documento 17 contam com a Lari fechando o quórum de "Correr
  5km" com um voto. Recriar é `docker compose down -v && docker compose up -d`
  na VM.
* **Roda a `main`.** O site público só serve o que já foi revisado e mesclado.
* **Endereço fixo.** O túnel é nomeado: o CNAME `euduvido.falveshub.com` aponta
  para ele, sem endereço que muda a cada subida.
* **Reinício automático.** Os containers sobem com `restart: unless-stopped` e
  voltam sozinhos se a VM reiniciar.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Manter o 0019 (Worker + túnel rápido do Mac) | Já estava pronto | Depende do Mac ligado; endereço do túnel muda a cada subida | É o problema que motivou a troca |
| Render + Aiven ([0010](0010-hospedagem-e-deploy.md)) | Gerenciado, com backup | Duas contas novas; a API hiberna no plano gratuito | Mais trabalho para uma demonstração; a VM já existe e não hiberna |
| Worker do 0019 apontando para a VM | Mantém `secretavin.workers.dev` | Duas contas da Cloudflare envolvidas e um repasse a mais | O túnel nomeado da VM já entrega um endereço fixo sem o Worker |

## Consequências

**Positivas:** o site fica no ar sem depender do computador de ninguém, com
endereço fixo. O banco público é o do seed, então o roteiro da demonstração é o
mesmo em qualquer ambiente.

**Negativas:**

* **Atualização manual.** Não há deploy automático: o merge na `main` não chega
  à VM. Quem tem acesso SSH roda `git pull && docker compose up -d --build` no
  checkout dela.
* **Configuração fora do repositório.** O override, o `nginx` com o repasse e o
  `.env` com a chave da Groq existem só na VM. Este ADR e o
  [documento 16](../16-execucao-local.md) descrevem o que eles fazem.
* **VM compartilhada.** A VM e o túnel servem outro projeto. Mexer no túnel
  derruba os dois por alguns segundos.
* **Login de desenvolvimento aberto**, como no 0019: qualquer pessoa com o link
  entra com o apelido de qualquer usuário do banco. Aceitável com dados
  fictícios, não para uso real. A cota da chave da Groq também fica exposta.
  *Atualização (20/11/2026): o login passou a ser só pelo Google
  ([ADR 0021](0021-login-exclusivo-google.md)); o `.env` da VM precisa de
  `GOOGLE_CLIENT_ID`, `AUTH_CHAVE` e `DEMO_CONTAS`.*
* **Sem backup do banco.** Os dados estão num volume Docker da VM. Se o volume
  se perder, o banco se refaz pelo seed; perde-se só o que foi criado no site
  depois da última recriação.

**Impacto na documentação:** [16 - Execução Local](../16-execucao-local.md)
troca a seção "Publicar na Cloudflare" por "Ambiente público". O ADR 0019 passa
a `Substituída`. A hospedagem gerenciada do ADR 0010 nunca foi implementada.

## Revisão do PO (16/11/2026)

A primeira subida, em 16/11, diferia desta decisão em três pontos, que o PO
decidiu assim na revisão:

| Como subiu | Decisão do PO | Situação |
| --- | --- | --- |
| Banco copiado do Docker de desenvolvimento (10 usuários; "Correr 5km" com 0 de 2 votos) | Recriar a partir do seed | Pendente na VM (#65) |
| Branch `feat/redesign-mobile-first` (#63), ainda não mesclada | A VM roda a `main`; a #63 entra depois de revisada | Pendente (#63, #65) |
| Só `euduvido.falveshub.com` | Mantido como endereço principal; `secretavin.workers.dev` redireciona para ele | Pendente: mudança no Worker (#65) |

Também ficaram para a #65: versionar o override do compose e a configuração do
nginx da VM no repositório, sem segredos, e o backup diário com `pg_dump`.
Quando a #65 fechar, esta tabela deixa de ter pendências.
