# Entrega 3 — Banco de Dados

| Campo | Valor |
| --- | --- |
| **Revisão em sala** | 30/10/2026 |
| **Tag de fechamento** | `entrega-3` |
| **Pergunta que a entrega precisa responder** | O modelo foi efetivamente transformado em um Banco de Dados funcional? |

<!-- entregas:status:start -->
🟢 **Entregue** — tag `entrega-3` em 2026-10-30 · 8/8 itens prontos
<!-- entregas:status:end -->

## Checklist

Gerado por [`scripts/entregas/gerar-entregas.mjs`](../../scripts/entregas/gerar-entregas.mjs)
a partir de [`manifest.json`](../../scripts/entregas/manifest.json). Não edite
a tabela a mão — edite os documentos linkados e rode o script de novo.

<!-- entregas:checklist:start -->
| Item | Situação | Local |
| --- | --- | --- |
| SGBD escolhido e justificativa | ✅ | [`docs/02-arquitetura/adr/0001-stack-tecnologica.md`](../02-arquitetura/adr/0001-stack-tecnologica.md) |
| Implementação do Banco de Dados (DDL) | ✅ | [`docs/03-banco-de-dados/implementacao/12-ddl-schema.md`](../03-banco-de-dados/implementacao/12-ddl-schema.md) |
| Script de criação (schema.sql, gerado por migration) | ✅ | [`database/scripts/ddl/schema.sql`](../../database/scripts/ddl/schema.sql) |
| Procedures, triggers e views | ✅ | [`database/scripts/ddl/functions`](../../database/scripts/ddl/functions) |
| Povoamento — documento | ✅ | [`docs/03-banco-de-dados/implementacao/13-povoamento-dml.md`](../03-banco-de-dados/implementacao/13-povoamento-dml.md) |
| Povoamento — script (seed.sql) | ✅ | [`database/scripts/dml/seed.sql`](../../database/scripts/dml/seed.sql) |
| Consultas SQL — documento | ✅ | [`docs/03-banco-de-dados/implementacao/16-consultas-sql.md`](../03-banco-de-dados/implementacao/16-consultas-sql.md) |
| Consultas SQL — script executável | ✅ | [`database/scripts/queries/analytical_queries.sql`](../../database/scripts/queries/analytical_queries.sql) |
<!-- entregas:checklist:end -->

## Por que esta entrega já nasce adiantada

O banco (schema, procedures/triggers/views, seed e consultas analíticas) foi
implementado junto com a Entrega 2. Como `schema.sql` é gerado por migration
(ver [ADR 0004](../02-arquitetura/adr/0004-schema-sql-gerado-por-migration.md)),
qualquer mudança de modelo depois disso já se propaga sozinha para este
checklist na próxima vez que o script rodar.

## Itens fora do repositório

* Demonstração ao vivo de uma consulta SQL rodando contra o banco povoado,
  no formato exigido pela apresentação (seção 16 do edital: "não será
  suficiente apresentar apenas telas estáticas").

## Como fechar esta entrega

1. Confirmar que `docker compose up` sobe o banco já povoado (roteiro no
   [README principal](../../README.md)).
2. Rodar `node scripts/entregas/gerar-entregas.mjs`.
3. Commit.
4. `git tag entrega-3 && git push origin entrega-3`.
