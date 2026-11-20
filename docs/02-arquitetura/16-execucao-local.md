# 16 - Execução Local e Ambiente

Como o sistema sobe, o que cada contêiner faz e onde as escolhas de ambiente
divergem do que roda em produção.

## Subir tudo

```bash
docker compose up
```

| Serviço | Imagem | Porta | Papel |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | 5432 (`DB_PORT`) | Banco, já povoado na primeira subida |
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
variáveis do `.env` controlam o login:

| Variável | Para quê |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Client ID do projeto no Google Cloud. Sem ele, a API sobe, mas o login responde 503 e a tela avisa que não foi configurado |
| `AUTH_CHAVE` | Chave que assina as sessões. Sem ela, vale o padrão de desenvolvimento, que está no repositório; no ambiente público ela é obrigatória (`openssl rand -base64 48`) |
| `DEMO_CONTAS` | Liga contas Google reais aos usuários do seed para a demonstração: `"Tavin=fulano@gmail.com;Lari=ciclana@gmail.com"` |

**No Google Cloud** (uma vez só):

* um *OAuth client ID* do tipo *Web application*, com as origens
  `http://localhost`, `http://localhost:5173`, `http://localhost:8080` e o
  endereço público;
* tela de consentimento *External*, publicada (*In production*), com os
  escopos `openid`, `email` e `profile`, e sem logo, para não cair em
  verificação.

**Os usuários do seed** (Tavin, Biel, Theus, Lari, Lipe, Aninha, Brunão, Mila e
Dieguinho, os nove do [seed](../03-banco-de-dados/implementacao/13-povoamento-dml.md))
têm e-mails fictícios. Para entrar como um deles, ligue uma conta Google real a
ele:

```bash
scripts/demo/vincular-contas.sh
```

O script lê `DEMO_CONTAS` e troca os e-mails numa transação só. O
`recriar-banco.sh` já o chama depois de cada recriação. Cada personagem precisa
de uma conta Google diferente.

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

## Recomeçar a demonstração

Depois de ensaiar (votar, criar desafios), volte o banco ao estado do seed e
confira se ele está como o [roteiro da banca](../06-encerramento/roteiro-da-demonstracao.md)
espera:

```bash
scripts/demo/recriar-banco.sh
```

O script pede para digitar `RECRIAR`, apaga só o schema `public` e aplica o
`schema.sql` e o `seed.sql` pelo `psql`. Ele funciona no Docker local e na VM,
mesmo que a VM desligue o seed no *initdb*. No fim, ele roda a conferência:

```bash
scripts/demo/conferir-demo.sh
```

A conferência só lê o banco e marca ✔ ou ✘ para cada pré-condição do roteiro:

* 9 usuários;
* "Correr 5km" com 1 de 2 votos e a Lari ainda sem votar;
* "Tirar nota máxima" aberta;
* "Dinossauro" em andamento;
* os saldos de partida;
* as views de contabilidade vazias.

Rode antes de cada ensaio e na véspera da banca.

O caminho antigo, `docker compose down -v && docker compose up -d`, também
volta ao seed no Docker local, porque o seed roda quando o volume está vazio.

**Começar sem o seed.** Para usar o sistema com pessoas reais, sem os
personagens da demonstração:

```bash
scripts/demo/recriar-banco.sh --vazio
```

O banco fica só com o schema e as quatro categorias
(`database/scripts/dml/categorias.sql`). As categorias não têm tela de gestão;
sem elas, nenhum desafio pode ser criado. Cada pessoa se cadastra ao entrar com
o Google, e só dá para adicionar a um grupo quem já entrou uma vez.

## Ver o SQL ao vivo

Durante a demonstração, uma janela ao lado do navegador mostra cada comando
que a aplicação manda ao PostgreSQL:

```bash
python3 scripts/demo/ver-sql.py
```

O script liga o log de comandos do PostgreSQL com `ALTER SYSTEM`, sem reiniciar
o banco, e mostra cada comando colorido, com os parâmetros já preenchidos:
`SELECT` em azul, `INSERT` em verde, `UPDATE` em amarelo e `CALL` em magenta,
com o `BEGIN` e o `COMMIT` da transação em destaque. No voto que fecha o
quórum, aparece:

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
   `database/scripts/ddl/schema.sql` e depois `seed.sql`. Como o `schema.sql` é
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
do time estar ligado. O endereço antigo, `euduvido.secretavin.workers.dev`,
redireciona para este.

O login é pelo Google. O `.env` da VM precisa de `GOOGLE_CLIENT_ID`,
`AUTH_CHAVE` (nova, não a padrão) e `DEMO_CONTAS`, e o endereço público precisa
estar nas origens autorizadas do Client ID.

| Peça | Como está na VM |
| --- | --- |
| Código | Checkout da `main` deste repositório; atualização manual, sem deploy automático |
| Frontend | Build com `VITE_API_URL` vazio; o nginx repassa `/api/` e `/hubs/` para a API |
| Portas | Nenhuma aberta; só o `web` escuta, em `127.0.0.1:5380`, atrás do túnel |
| Banco | Desde 20/11/2026, sem o seed: só o schema e as categorias, com os dados reais dos participantes. Antes de recriar, faça backup (`pg_dump`); recriar com `scripts/demo/recriar-banco.sh --vazio` apaga tudo |

O override do compose, a configuração do nginx e o `.env` com a chave da Groq
existem só na VM. Para atualizar, quem tem acesso SSH roda no checkout dela:

```bash
git pull && docker compose up -d --build
```

O endereço antigo, `euduvido.secretavin.workers.dev`
([ADR 0019](adr/0019-demonstracao-publica-cloudflare-tunel.md), substituído),
dependia do Mac do PO ligado. O `scripts/cloudflare/publicar.sh` continua no
repositório e funciona, mas deixou de ser o endereço divulgado.

## Limites conhecidos do ambiente

| Limite | Efeito |
| --- | --- |
| `Maximum Pool Size=15` | Fixado na connection string por causa do teto de 20 conexões do Aiven, mesmo em desenvolvimento — para que o comportamento local seja igual ao de produção |
| Migrations automáticas | Convenientes aqui, mas em produção significam que um merge altera o banco sem gate humano ([ADR 0010](adr/0010-hospedagem-e-deploy.md)) |
| Foto da prova | Sobe pela API para o MinIO ([ADR 0022](adr/0022-foto-da-prova-no-minio-pela-api.md)). Um proxy na frente da API precisa de `client_max_body_size 10m` em `/api`; o padrão do nginx (1 MB) recusa a foto com 413. O backup do banco não leva as fotos: elas ficam no volume `storage-data` |
| Proxy de `/api` com cache de estáticos | A foto é lida em `/api/midia/<nome>.jpg`. No nginx, uma regra por regex de estáticos (`location ~* \.(png\|jpg)$`) vence o prefixo `location /api/` e responde 404 sem chamar a API. Use `location ^~ /api/`. O `nginx.vm.conf` é montado como arquivo: depois de editá-lo, `docker compose restart web`, porque o `reload` continua lendo a versão antiga |
| Cache do `index.html` | Sem `Cache-Control`, o navegador reaproveita o `index.html` antigo, e os JS antigos ficam 7 dias em cache como imutáveis. O app velho roda inteiro do cache: em 20/11/2026, celulares ainda chamavam o login de desenvolvimento (`/api/auth/dev/usuarios`, 404). O `nginx.vm.conf` manda `Cache-Control: no-cache` em `/` e em `/index.html`; os arquivos de `assets/` mudam de nome a cada build e continuam em cache |
