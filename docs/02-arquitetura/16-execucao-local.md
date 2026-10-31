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

## MinIO no lugar do R2

O [ADR 0009](adr/0009-armazenamento-de-midia-r2.md) escolheu Cloudflare R2. Em
desenvolvimento usamos **MinIO**, que fala o mesmo protocolo S3: o código de
geração de URL assinada será idêntico, mudando apenas o endpoint na configuração.
Assim ninguém precisa de credencial de nuvem para rodar o projeto.

> **Estado atual.** O bucket existe, mas a API ainda não grava nele: o endpoint
> de evidência recebe só a URL do comprovante (`UrlComprovante`), e a seção
> `Storage` do `appsettings.json` não é lida por nenhum código. O envio de
> arquivo com URL assinada é a evolução prevista no ADR 0009, não algo pronto.

## Autenticação em desenvolvimento

`Auth:Provider` controla o modo:

| Valor | Comportamento |
| --- | --- |
| `Dev` | `POST /api/auth/dev/login` aceita um apelido do seed e devolve JWT válido |
| `Google` | Os endpoints `dev` retornam 404 e o acesso exige token do provedor |

Os dois caminhos produzem o **mesmo JWT** e passam pela mesma validação — o
bypass troca só a origem da identidade, não o resto do fluxo. Trocar de modo é
mudar uma variável de ambiente.

Usuários disponíveis: **Tavin**, **Biel**, **Theus**, **Lari**, **Lipe**,
**Aninha**, **Brunão**, **Mila** e **Dieguinho** (os nove do
[seed](../03-banco-de-dados/implementacao/13-povoamento-dml.md)).

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

O seed só roda quando o volume do banco está vazio. Depois de ensaiar — votar,
criar desafios —, volte ao estado original apagando o volume:

```bash
docker compose down -v && docker compose up -d
```

O voto pendente da Lari no desafio 1, que fecha o quórum na banca, volta a
estar disponível.

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

## Limites conhecidos do ambiente

| Limite | Efeito |
| --- | --- |
| `Maximum Pool Size=15` | Fixado na connection string por causa do teto de 20 conexões do Aiven, mesmo em desenvolvimento — para que o comportamento local seja igual ao de produção |
| Migrations automáticas | Convenientes aqui, mas em produção significam que um merge altera o banco sem gate humano ([ADR 0010](adr/0010-hospedagem-e-deploy.md)) |
| Upload de mídia | Não implementado. A tela de evidência aceita uma URL; o fluxo de URL assinada está modelado, não construído |
