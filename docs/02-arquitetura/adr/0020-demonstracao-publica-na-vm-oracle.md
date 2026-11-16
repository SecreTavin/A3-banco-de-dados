# 0020 - Demonstração pública numa VM da Oracle Cloud

* **Status:** Aceita
* **Data:** 2026-11-16
* **Decisores:** Rafael Alves

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
existe nela.**

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
* **Banco clonado, não semeado.** O override desliga o `schema.sql` e o
  `seed.sql` do *initdb*. O banco veio de um `pg_dump` do Docker de
  desenvolvimento, com os dados de teste acumulados (10 usuários, 11 desafios,
  78 lançamentos de CP), restaurado com `pg_restore`. As migrations do dump batem
  com as do código, e `vw_reconciliacao_saldo` e `vw_escrow_orfao` voltaram
  vazias depois da restauração.
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
endereço fixo. O banco é o mesmo dos testes, então o professor encontra grupos,
desafios e saldos já movimentados.

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
* **Sem backup do banco.** Os dados de teste estão num volume Docker da VM. Se o
  volume se perder, a fonte é o Docker de desenvolvimento de novo.

**Impacto na documentação:** [16 - Execução Local](../16-execucao-local.md)
troca a seção "Publicar na Cloudflare" por "Ambiente público". O ADR 0019 passa
a `Substituída`. O ADR 0010 continua como a hospedagem prevista para produção.
