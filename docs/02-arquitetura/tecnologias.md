# Tecnologias e Stack

Registro do que foi escolhido, para quê e com qual justificativa. Toda escolha
estrutural tem um ADR correspondente em [adr/](adr/README.md).

## Banco de dados

| Item | Escolha | Status | ADR |
| --- | --- | --- | --- |
| SGBD | PostgreSQL 16+ | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| Organização | Um schema por módulo, FK atravessando | Em uso | [0005](adr/0005-schema-por-modulo-postgres.md) |
| Escrita | EF Core (Commands) | Em uso | [0003](adr/0003-cqrs-dapper-ef.md) |
| Leitura | Dapper com SQL à mão (Queries) | Em uso | [0003](adr/0003-cqrs-dapper-ef.md) |
| Migrations | EF Core code-first, `schema.sql` gerado | Em uso | [0004](adr/0004-schema-sql-gerado-por-migration.md) |
| Lógica no banco | Procedures e triggers para apuração e invariantes | Em uso | [0008](adr/0008-quorum-congelado.md) |
| Hospedagem | Aiven (PostgreSQL gerenciado) | Em uso | [0010](adr/0010-hospedagem-e-deploy.md) |

O SGBD não era realmente uma decisão em aberto: o `schema.sql` original já usava
`SERIAL` e `TIMESTAMP`, sintaxe PostgreSQL que SQL Server e Oracle rejeitam. A
decisão foi formalizar o que o DDL já assumia.

## Backend

| Item | Escolha | Status | ADR |
| --- | --- | --- | --- |
| Linguagem | C# / .NET | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| API | Minimal API | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| Arquitetura | Monólito modular, vertical slice por feature | Em uso | [0002](adr/0002-monolito-modular-vertical-slice.md) |
| Separação de infra | Hexagonal, portas e adaptadores por interface | Em uso | [0002](adr/0002-monolito-modular-vertical-slice.md) |
| Domínio | DDD com domínio rico | Em uso | [0002](adr/0002-monolito-modular-vertical-slice.md) |
| Erros de negócio | Result Pattern (exceção só para falha de infra) | Em uso | [0002](adr/0002-monolito-modular-vertical-slice.md) |
| Tempo real | SignalR, apenas na Central de Votação | Em uso | [0011](adr/0011-notificacoes-web-push.md) (substituído pelo [0016](adr/0016-schema-unico-e-modelo-enxuto.md) no que se refere a notificações) |
| Tarefas agendadas | `BackgroundService` no processo da API | Em uso | [0011](adr/0011-notificacoes-web-push.md) |

## Frontend

| Item | Escolha | Status | ADR |
| --- | --- | --- | --- |
| Linguagem | TypeScript | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| Framework | React | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| Formato | Site responsivo mobile-first | Em uso | [0001](adr/0001-stack-tecnologica.md) |
| Organização | Componente burro / componente visual / hook | Em uso | [0002](adr/0002-monolito-modular-vertical-slice.md) |
| Cliente da API | Gerado a partir do OpenAPI | Em uso | [0012](adr/0012-contrato-openapi.md) |
| Service worker | Não usado — Web Push saiu do escopo | Removido | [0016](adr/0016-schema-unico-e-modelo-enxuto.md) |

A separação do React acompanha o CQRS do backend: hooks de leitura chamam-se
`useXQuery` e hooks de escrita `useXCommand`. A convenção é deliberada — torna o
lado da operação visível no ponto de uso.

## Infraestrutura

| Item | Escolha | Status | ADR |
| --- | --- | --- | --- |
| Armazenamento de mídia | Cloudflare R2, upload por URL assinada | Em uso | [0009](adr/0009-armazenamento-de-midia-r2.md) |
| Hospedagem do frontend | Vercel | Em uso | [0010](adr/0010-hospedagem-e-deploy.md) |
| Hospedagem da API | Render | Em uso | [0010](adr/0010-hospedagem-e-deploy.md) |
| Contêineres | Docker | Em uso | [0010](adr/0010-hospedagem-e-deploy.md) |
| CI/CD | GitHub Actions | Em uso | [0010](adr/0010-hospedagem-e-deploy.md) |
| Observabilidade | Grafana Cloud (free) | Em uso | [0013](adr/0013-observabilidade.md) |
| Autenticação | Google OAuth / OIDC | Em uso | [0001](adr/0001-stack-tecnologica.md) |

## Qualidade

| Item | Escolha | Status | ADR |
| --- | --- | --- | --- |
| Testes de constraint | SQL contra PostgreSQL real | Em uso | [0014](adr/0014-estrategia-de-testes.md) |
| Testes de domínio | xUnit, sem banco | Em uso | [0014](adr/0014-estrategia-de-testes.md) |
| Testes de integração | Testcontainers com PostgreSQL | Em uso | [0014](adr/0014-estrategia-de-testes.md) |
| Verificação de arquitetura | Teste que falha se Query tocar EF | Em uso | [0003](adr/0003-cqrs-dapper-ef.md) |

Casos de teste em [05 - Qualidade](../05-qualidade/README.md).

## Documentação

| Item | Escolha | Status |
| --- | --- | --- |
| Documentação | GitBook (Docs-as-Code via GitHub) | Em uso |
| Versionamento | Git / GitHub | Em uso |
| Registro de IA | Um arquivo por alteração assistida | Em uso |

## Descartado explicitamente

Registrado para que a ausência seja decisão, não omissão.

| Tecnologia | Por que não |
| --- | --- |
| Redis / Valkey / Dragonfly | Sem carga que justifique cache. O dataset é um grupo de amigos; a query mais pesada agrega dezenas de linhas. Sessão resolve com cookie assinado. |
| Kafka / Redpanda | Nenhum produtor e consumidor desacoplados no domínio. Os eventos reais são transições de estado que precisam ser atômicas com a escrita no banco — um broker tornaria isso mais difícil, não mais fácil. |
| MongoDB ou segundo banco | Destruiria integridade referencial e transação atômica, que é justamente o que a disciplina avalia. Mídia fica em object storage com o banco guardando a URL — separação correta entre banco e blob. |
| Aplicativo nativo | Nenhum ponto da avaliação depende disso. |
| Tracing distribuído | Cerimônia com um único serviço. |
