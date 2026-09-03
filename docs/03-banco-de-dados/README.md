# 03 - Banco de Dados

Documentação técnica de dados: da modelagem conceitual até os scripts executáveis e as consultas analíticas.

## Modelagem

* [09 - Evolução da Modelagem](modelagem/09-evolucao-modelagem.md)
* [10 - Diagrama Entidade-Relacionamento (DER)](modelagem/10-der.md)
* [11 - Modelo Lógico](modelagem/11-modelo-logico.md)

## Implementação

* [12 - Implementação do Banco de Dados (DDL)](implementacao/12-ddl-schema.md)
* [13 - Povoamento (DML)](implementacao/13-povoamento-dml.md)
* [16 - Consultas SQL Estratégicas](implementacao/16-consultas-sql.md)

## Scripts executáveis

Os arquivos `.sql` ficam versionados fora de `docs/`, em [`database/scripts/`](../../database/scripts/):

| Script | Documento correspondente |
| --- | --- |
| [`ddl/schema.sql`](../../database/scripts/ddl/schema.sql) | [12 - DDL](implementacao/12-ddl-schema.md) |
| [`dml/seed.sql`](../../database/scripts/dml/seed.sql) | [13 - Povoamento](implementacao/13-povoamento-dml.md) |
| [`queries/analytical_queries.sql`](../../database/scripts/queries/analytical_queries.sql) | [16 - Consultas SQL](implementacao/16-consultas-sql.md) |
