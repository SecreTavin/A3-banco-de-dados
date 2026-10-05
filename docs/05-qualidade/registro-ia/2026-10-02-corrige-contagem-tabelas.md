# 2026-10-02 — Corrige contagem de tabelas nos docs de modelagem e DDL

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `09-evolucao-modelagem.md`, `12-ddl-schema.md` |

## O que foi pedido

Revisar, na véspera da revisão em sala da Entrega 2, a coerência da contagem de
tabelas entre os documentos de modelagem e o `schema.sql`.

## O que a IA produziu

Contagem dos `CREATE TABLE` em `schema.sql` (16, sendo uma a
`__EFMigrationsHistory` do EF, logo 15 tabelas de domínio) e correção de dois
números defasados: v2 em `09-evolucao-modelagem.md` (14 → 15) e
`12-ddl-schema.md` (14 → 15 tabelas).

## O que a IA errou

* Na primeira leitura, a IA tratou os 16 `CREATE TABLE` como 16 tabelas de
  domínio; só ao listar as linhas apareceu a `__EFMigrationsHistory`.
* A IA notou que `12-ddl-schema.md` diz "14 índices" enquanto `schema.sql` tem
  36 instruções `CREATE INDEX`, mas **não corrigiu**: contar índices (com ou
  sem PK, únicos e parciais) é decisão de critério, e o time não definiu qual.
  Fica como pendência.

## Como o time validou

Conferência manual da lista de `CREATE TABLE` em `schema.sql` contra a soma da
v1 (8 tabelas) mais as 7 tabelas da v2 descritas em `09-evolucao-modelagem.md`
(`credencial_usuario`, `validador_evidencia`, `transacao_cp`, `convite_grupo`,
`comentario_aposta`, `notificacao`, `push_subscription`): 15.

## Decisão final

Entram as duas correções de número. O contador de índices em `12-ddl-schema.md`
segue como está até o time definir o critério de contagem.
