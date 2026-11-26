# 16 - Execução Local e Ambiente

Como o sistema sobe, o que cada contêiner faz e onde as escolhas de ambiente
divergem do que roda em produção.

## Subir tudo

```bash
docker compose up
```

| Serviço | Imagem | Porta | Papel |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | 5432 (`DB_PORT`) | Banco, com os dados fictícios de teste na primeira subida local |
| `storage` | `bitnamilegacy/minio:2025.7.23` | 9000 / 9001 | Armazenamento S3-compatível |
| `storage-init` | `bitnamilegacy/minio:2025.7.23` | — | Cria o bucket `evidencias` e sai |
| `api` | build de `apps/api` | 5080 | API .NET, aplica migrations na subida |
| `web` | build de `apps/web` | 8080 | Frontend servido por nginx |

`storage-init` existe porque o MinIO não cria bucket sozinho. Ele roda uma vez,
cria o bucket e encerra — é normal aparecer como `Exited (0)`. Ele tenta de novo
até o MinIO responder, porque a imagem Bitnami sobe o servidor, derruba e sobe
outra vez, e o healthcheck pode passar na primeira subida.

**Porta do banco ocupada.** Se já houver outro Postgres na 5432, suba com
`DB_PORT=5433 docker compose up -d`. A API fala com o banco pela rede do
compose, então a porta do host só importa para quem se conecta de fora.

**Imagem do MinIO.** As imagens oficiais `minio/minio` e `minio/mc` deixaram de
ser puxáveis no Docker Hub (`pull access denied`, verificado em 30/10/2026). A
imagem Bitnami é o mesmo MinIO, com versão fixa, e traz o cliente `mc`. O
console web na porta 9001 não respondeu nessa versão; a API e o bucket não
dependem dele.

## MinIO: a foto da prova

A foto da prova fica no **MinIO**, no bucket privado `evidencias`
([ADR 0022](adr/0022-foto-da-prova-no-minio-pela-api.md), que substitui o R2 do
ADR 0009). O navegador manda a foto para `POST /api/midia`, e a API grava no
bucket com a seção `Storage` da configuração. A leitura também passa pela API
(`GET /api/midia/{nome}`), só com login. O MinIO não precisa de porta pública:
o console em `localhost:9001` é só para inspeção local.

## Login com Google

O acesso é só pelo Google ([ADR 0021](adr/0021-login-exclusivo-google.md)). O
login de desenvolvimento, por seleção de usuário, saiu em 20/11/2026. Três
variáveis do `.env` controlam o login, e a terceira só importa nos testes locais:

| Variável | Para quê |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Client ID do projeto no Google Cloud. Sem ele, a API sobe, mas o login responde 503 e a tela avisa que não foi configurado |
| `AUTH_CHAVE` | Chave que assina as sessões. Sem ela, vale o padrão de desenvolvimento, que está no repositório; no ambiente público ela é obrigatória (`openssl rand -base64 48`) |
| `DEMO_CONTAS` | Opcional, só no ambiente local: liga uma conta Google a um usuário fictício dos dados de teste. Não é usada na produção |

**No Google Cloud** (uma vez só):

* um *OAuth client ID* do tipo *Web application*, com as origens
  `http://localhost`, `http://localhost:5173`, `http://localhost:8080` e o
  endereço público;
* tela de consentimento *External*, publicada (*In production*), com os
  escopos `openid`, `email` e `profile`, e sem logo, para não cair em
  verificação.

**Quem entra.** Na produção, cada integrante entra com a própria conta Google e
completa o cadastro no primeiro acesso. Os dados fictícios de teste têm e-mails
inválidos, então ninguém entra como um deles sem o `DEMO_CONTAS` local.

**Testes automáticos:** o popup do Google não se automatiza. Os roteiros de
ponta a ponta assinam a sessão com a mesma chave (`AUTH_CHAVE`, ou o padrão de
desenvolvimento) em [`scripts/testes/sessao.mjs`](../../scripts/testes/sessao.mjs)
e no `roteiro-e2e.py`.

## Moderação por IA: a chave da Groq

Criar desafio passa pela moderação de IA (RN28,
[ADR 0015](adr/0015-idade-minima-e-moderacao-ia.md)). A chave **não** fica no
repositório: copie o modelo e preencha `IA_API_KEY` com a chave fornecida pelo
PO.

```bash
cp .env.example .env
```

O `.env` está no `.gitignore` e o `docker compose` o lê sozinho. Depois de
editar, recrie a API com `docker compose up -d`. Para conferir sem expor a
chave:

```bash
docker exec euduvido-api-1 sh -c 'test -n "$Ia__ApiKey" && echo com chave || echo sem chave'
```

| Situação | O que acontece ao criar desafio |
| --- | --- |
| Sem chave, chave inválida ou Groq fora do ar | HTTP 503, alerta "Nada foi criado" — nada é aprovado sem avaliação |
| Proposta aprovada | HTTP 201, desafio `ABERTA`, moderação gravada e ligada a ele |
| Proposta recusada | HTTP 422 com o motivo da IA; a avaliação fica gravada sem desafio |

Os padrões apontam para a Groq com o modelo `openai/gpt-oss-120b`;
`IA_BASE_URL` e `IA_MODELO` trocam o provedor sem mexer em código.

## Povoamento e dados de teste

**Produção.** O banco é povoado pelos integrantes, usando o site
([13 - Povoamento](../03-banco-de-dados/implementacao/13-povoamento-dml.md)).
**Não rode `scripts/demo/recriar-banco.sh` na VM:** ele apaga as contas e os
dados reais. Antes de qualquer manutenção, faça backup:

```bash
docker compose exec -T db pg_dump -U euduvido -d euduvido --no-owner > backup-banca.sql
```

As fotos das provas ficam no volume `storage-data`, fora desse backup. O arquivo
tem e-mails reais e não pode entrar no repositório.

**Base de ensaio local, só com os integrantes.** Sobe separada do banco principal,
com o moderador simulado:

```bash
COMPOSE_PROJECT_NAME=euduvido-ensaio docker compose -f docker-compose.yml -f scripts/testes/compose.ia-falsa.yml up -d --build
```

```bash
COMPOSE_PROJECT_NAME=euduvido-ensaio scripts/demo/recriar-banco.sh --vazio --sim
```

```bash
npm i --no-save playwright-core
```

```bash
EUDUVIDO_DB=euduvido-ensaio-db-1 node scripts/telas/povoar-integrantes.mjs
```

**Dados de teste.** O CI e os roteiros de ponta a ponta usam o `seed.sql`, com
usuários fictícios. Para voltar a esse estado no Docker **local**, rode
`scripts/demo/recriar-banco.sh`, ou `docker compose down -v && docker compose up -d`,
que também apaga os volumes. **Nenhum dos dois deve rodar na VM.** A conferência
`scripts/demo/conferir-demo.sh` vale só para esses dados de teste.

## Ver o SQL ao vivo

Durante a demonstração, uma janela ao lado do navegador mostra cada comando
que a aplicação manda ao PostgreSQL:

```bash
python3 scripts/demo/ver-sql.py
```

O script liga o log de comandos do PostgreSQL com `ALTER SYSTEM`, sem reiniciar
o banco, e mostra cada comando colorido, com os parâmetros já preenchidos:
`SELECT` em azul, `INSERT` em verde, `UPDATE` em amarelo e `CALL` em magenta,
com o `BEGIN` e o `COMMIT` da transação em destaque. Como a janela vai para o
projetor e o banco tem contas reais, todo e-mail aparece como `***@***`. O log do
PostgreSQL mantém o valor original, então não projete `docker compose logs`. No
voto que fecha o quórum, aparece:

```
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED
UPDATE jurado_evidencia SET ... voto = 'VALIDO' WHERE id_evidencia = '2' AND id_usuario = '4'
CALL apurar_votacao('2')
COMMIT
```

Os comandos do próprio `psql` ficam de fora. `Ctrl+C` sai e desliga o log; se o
terminal fechar de outro jeito, desligue com
`python3 scripts/demo/ver-sql.py --desligar`. Na VM, rode o script pelo SSH, na
pasta do repositório.

## Ordem de subida

O `depends_on` com `condition: service_healthy` garante a sequência: o banco
fica pronto, o MinIO fica pronto, a API sobe e aplica migrations, e só então o
frontend é liberado. Sem isso a API tentaria migrar contra um banco que ainda
não aceita conexão.

## Aplicação do schema

Há dois caminhos, e eles não conflitam:

1. **Contêiner do banco** — na primeira subida, o entrypoint do Postgres aplica
   `database/scripts/ddl/schema.sql` e, no ambiente local, os dados de teste do
   `seed.sql`. Como o `schema.sql` é
   gerado pelo `dotnet ef migrations script --idempotent`, ele já registra as
   migrations na tabela `__EFMigrationsHistory`.
2. **API na subida** — chama `Database.MigrateAsync()`. Encontrando o histórico
   já preenchido, não faz nada.

O resultado é o mesmo com ou sem o volume do banco já existir.

## Desenvolvimento sem contêiner

```bash
docker compose up -d db storage storage-init
cd apps/api/EuDuvido.Api && dotnet run
cd apps/web && npm install && npm run dev
```

A API sobe em `http://localhost:5080` (Swagger em `/swagger`) e o Vite em
`http://localhost:5173`. Ambas as portas já estão na lista de CORS.

## Ambiente público

O sistema está publicado em **https://euduvido.falveshub.com**
([ADR 0020](adr/0020-demonstracao-publica-na-vm-oracle.md)). Roda numa VM da
Oracle Cloud, com o mesmo `docker-compose.yml` deste repositório, e chega à
internet por um túnel nomeado da Cloudflare. Não depende de nenhum computador
do time estar ligado. O endereço antigo, `euduvido.secretavin.workers.dev`, ainda
abre uma versão velha e sem API: use só o endereço acima.

O login é pelo Google. O `.env` da VM precisa de `GOOGLE_CLIENT_ID`,
`AUTH_CHAVE` (nova, não a padrão), e o endereço público precisa
estar nas origens autorizadas do Client ID.

| Peça | Como está na VM |
| --- | --- |
| Código | Checkout da `main` deste repositório; atualização manual, sem deploy automático |
| Frontend | Build com `VITE_API_URL` vazio; o nginx repassa `/api/` e `/hubs/` para a API |
| Portas | Nenhuma aberta; só o `web` escuta, em `127.0.0.1:5380`, atrás do túnel |
| Banco | Desde 20/11/2026, só o schema e as categorias, povoado pelos integrantes com contas reais. Não recriar: qualquer modo de `recriar-banco.sh` apaga tudo |

O override do compose, a configuração do nginx e o `.env` com a chave da Groq
existem só na VM. Para atualizar, quem tem acesso SSH roda no checkout dela:

```bash
git pull && docker compose up -d --build
```

O endereço antigo, `euduvido.secretavin.workers.dev`
([ADR 0019](adr/0019-demonstracao-publica-cloudflare-tunel.md), substituído),
dependia do Mac do PO ligado. O `scripts/cloudflare/publicar.sh` continua no
repositório e funciona, mas deixou de ser o endereço divulgado.

### Publicar na Cloudflare (Mac do PO)

`scripts/cloudflare/publicar.sh` gera o build do frontend, sobe um túnel rápido
do `cloudflared` para a API local e publica o Worker com o endereço do túnel em
`API_ORIGIN`. `publicar.sh parar` derruba o túnel.

| Situação | O que o script faz |
| --- | --- |
| Túnel rodando e respondendo em `<túnel>/health` | Reaproveita o túnel e republica o Worker |
| Processo do túnel vivo, mas o túnel expirou (ex.: depois de o Mac dormir; o site respondia HTTP 530) | Derruba o processo, sobe um túnel novo e republica. Não precisa mais rodar `parar` antes ([#58](https://github.com/SecreTavin/A3-banco-de-dados/issues/58)) |
| Nenhum túnel | Sobe um túnel novo, espera ele responder em `/health` e publica. Se o DNS local ainda não resolver o endereço novo, avisa e publica mesmo assim |
| Checkout fora da `main` ou com alterações não commitadas | Avisa antes do build: o site publicado reflete a pasta atual, não a `main` do GitHub |

O `caffeinate`, que impede o Mac de dormir, só é usado quando existe (macOS).

## Limites conhecidos do ambiente

| Limite | Efeito |
| --- | --- |
| `Maximum Pool Size=15` | Fixado na connection string por causa do teto de 20 conexões do Aiven, mesmo em desenvolvimento — para que o comportamento local seja igual ao de produção |
| Migrations automáticas | Convenientes aqui, mas em produção significam que um merge altera o banco sem gate humano ([ADR 0010](adr/0010-hospedagem-e-deploy.md)) |
| Foto da prova | Sobe pela API para o MinIO ([ADR 0022](adr/0022-foto-da-prova-no-minio-pela-api.md)). Um proxy na frente da API precisa de `client_max_body_size 10m` em `/api`; o padrão do nginx (1 MB) recusa a foto com 413. O backup do banco não leva as fotos: elas ficam no volume `storage-data` |
| Proxy de `/api` com cache de estáticos | A foto é lida em `/api/midia/<nome>.jpg`. No nginx, uma regra por regex de estáticos (`location ~* \.(png\|jpg)$`) vence o prefixo `location /api/` e responde 404 sem chamar a API. Use `location ^~ /api/`. O `nginx.vm.conf` é montado como arquivo: depois de editá-lo, `docker compose restart web`, porque o `reload` continua lendo a versão antiga |
| Cache do `index.html` | Sem `Cache-Control`, o navegador reaproveita o `index.html` antigo, e os JS antigos ficam 7 dias em cache como imutáveis. O app velho roda inteiro do cache: em 20/11/2026, celulares ainda chamavam o login de desenvolvimento (`/api/auth/dev/usuarios`, 404). O `nginx.vm.conf` manda `Cache-Control: no-cache` em `/` e em `/index.html`; os arquivos de `assets/` mudam de nome a cada build e continuam em cache |
