# 16 - Execução Local e Ambiente

Como o sistema sobe, o que cada contêiner faz e onde as escolhas de ambiente
divergem do que roda em produção.

## Subir tudo

```bash
docker compose up
```

| Serviço | Imagem | Porta | Papel |
| --- | --- | --- | --- |
| `db` | `postgres:16-alpine` | 5432 | Banco, já povoado na primeira subida |
| `storage` | `minio/minio` | 9000 / 9001 | Armazenamento S3-compatível |
| `storage-init` | `minio/mc` | — | Cria o bucket `evidencias` e sai |
| `api` | build de `apps/api` | 5080 | API .NET, aplica migrations na subida |
| `web` | build de `apps/web` | 8080 | Frontend servido por nginx |

`storage-init` existe porque o MinIO não cria bucket sozinho. Ele roda uma vez,
cria o bucket e encerra — é normal aparecer como `Exited (0)`.

## MinIO no lugar do R2

O [ADR 0009](adr/0009-armazenamento-de-midia-r2.md) escolheu Cloudflare R2. Em
desenvolvimento usamos **MinIO**, que fala o mesmo protocolo S3: o código de
geração de URL assinada é idêntico, muda apenas o endpoint na configuração.
Assim ninguém precisa de credencial de nuvem para rodar o projeto.

## Autenticação em desenvolvimento

`Auth:Provider` controla o modo:

| Valor | Comportamento |
| --- | --- |
| `Dev` | `POST /api/auth/dev/login` aceita um apelido do seed e devolve JWT válido |
| `Google` | Os endpoints `dev` retornam 404 e o acesso exige token do provedor |

Os dois caminhos produzem o **mesmo JWT** e passam pela mesma validação — o
bypass troca só a origem da identidade, não o resto do fluxo. Trocar de modo é
mudar uma variável de ambiente.

Usuários disponíveis: **Tavin**, **Biel**, **Theus**, **Lari**, **Lipe**.

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
