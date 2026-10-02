# ADRs — Architecture Decision Records

Registro das decisões de arquitetura do Eu Duvido!. Uma decisão por arquivo, em ordem cronológica e nunca reescrita: decisão superada é marcada como `Substituída` e aponta para a que a substituiu.

## Como criar um ADR

1. Copie [`0000-template.md`](0000-template.md).
2. Renomeie para `NNNN-titulo-em-kebab-case.md`, com `NNNN` sendo o próximo número da sequência.
3. Preencha as seções e adicione a linha correspondente na tabela abaixo.
4. Se a decisão define uma tecnologia, atualize também [tecnologias.md](../tecnologias.md).

## Índice

| ADR | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-stack-tecnologica.md) | Stack tecnológica: C# no backend, React no frontend, PostgreSQL | Aceita | 2026-09-03 |
| [0002](0002-monolito-modular-vertical-slice.md) | Monólito modular com vertical slice por feature | Aceita | 2026-09-03 |
| [0003](0003-cqrs-dapper-ef.md) | CQRS com Dapper para leitura e EF Core para escrita | Aceita | 2026-09-03 |
| [0004](0004-schema-sql-gerado-por-migration.md) | `schema.sql` gerado a partir das migrations do EF Core | Aceita | 2026-09-03 |
| [0005](0005-schema-por-modulo-postgres.md) | Um schema PostgreSQL por módulo, com FK atravessando | Substituída por 0016 | 2026-09-03 |
| [0006](0006-cp-como-moeda.md) | CP como moeda única do sistema | Aceita | 2026-09-03 |
| [0007](0007-ledger-append-only.md) | Ledger append-only com saldo materializado | Aceita | 2026-09-03 |
| [0008](0008-quorum-congelado.md) | Conjunto de validadores congelado por evidência | Aceita | 2026-09-03 |
| [0009](0009-armazenamento-de-midia-r2.md) | Mídia em Cloudflare R2 com upload por URL assinada | Aceita | 2026-09-03 |
| [0010](0010-hospedagem-e-deploy.md) | Hospedagem gerenciada e deploy contínuo | Aceita | 2026-09-03 |
| [0011](0011-notificacoes-web-push.md) | Notificações persistidas com Web Push e tempo real via SignalR | Substituída por 0016 | 2026-09-03 |
| [0012](0012-contrato-openapi.md) | Contrato entre API e frontend gerado a partir do OpenAPI | Aceita | 2026-09-03 |
| [0013](0013-observabilidade.md) | Observabilidade focada em domínio e banco | Aceita | 2026-09-03 |
| [0014](0014-estrategia-de-testes.md) | Três níveis de teste, com constraints do banco em primeiro lugar | Aceita | 2026-09-03 |
| [0015](0015-idade-minima-e-moderacao-ia.md) | Idade mínima de acesso e moderação de desafios por IA | Aceita | 2026-09-12 |
| [0016](0016-schema-unico-e-modelo-enxuto.md) | Schema único e modelo de dados enxuto | Aceita | 2026-10-02 |

## Status possíveis

* **Proposta** — em discussão, ainda não vale.
* **Aceita** — decisão em vigor.
* **Substituída** — trocada por outro ADR (indicar qual).
* **Descontinuada** — abandonada sem substituto.
