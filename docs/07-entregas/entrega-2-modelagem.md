# Entrega 2 — Modelagem

| Campo | Valor |
| --- | --- |
| **Revisão em sala** | 02/10/2026 |
| **Tag de fechamento** | `entrega-2` |
| **Pergunta que a entrega precisa responder** | Quais dados o sistema precisa armazenar e como esses dados se relacionam? |

<!-- entregas:status:start -->
🔵 **Pronta para entrega** — 8/8 itens prontos · revisão em sala: 2026-10-02
<!-- entregas:status:end -->

## Checklist

Gerado por [`scripts/entregas/gerar-entregas.mjs`](../../scripts/entregas/gerar-entregas.mjs)
a partir de [`manifest.json`](../../scripts/entregas/manifest.json). Não edite
a tabela a mão — edite os documentos linkados e rode o script de novo.

<!-- entregas:checklist:start -->
| Item | Situação | Local |
| --- | --- | --- |
| Levantamento de dados e evolução da modelagem | ✅ | [`docs/03-banco-de-dados/modelagem/09-evolucao-modelagem.md`](../03-banco-de-dados/modelagem/09-evolucao-modelagem.md) |
| DER — Diagrama Entidade-Relacionamento | ✅ | [`docs/03-banco-de-dados/modelagem/10-der.md`](../03-banco-de-dados/modelagem/10-der.md) |
| Modelo lógico preliminar | ✅ | [`docs/03-banco-de-dados/modelagem/11-modelo-logico.md`](../03-banco-de-dados/modelagem/11-modelo-logico.md) |
| Regras de negócio consolidadas | ✅ | [`docs/01-negocio/08-regras-de-negocio.md`](../01-negocio/08-regras-de-negocio.md) |
| ADR — schema por módulo (Postgres) | ✅ | [`docs/02-arquitetura/adr/0005-schema-por-modulo-postgres.md`](../02-arquitetura/adr/0005-schema-por-modulo-postgres.md) |
| ADR — CP como moeda única | ✅ | [`docs/02-arquitetura/adr/0006-cp-como-moeda.md`](../02-arquitetura/adr/0006-cp-como-moeda.md) |
| ADR — ledger append-only | ✅ | [`docs/02-arquitetura/adr/0007-ledger-append-only.md`](../02-arquitetura/adr/0007-ledger-append-only.md) |
| ADR — quórum congelado por evidência | ✅ | [`docs/02-arquitetura/adr/0008-quorum-congelado.md`](../02-arquitetura/adr/0008-quorum-congelado.md) |
<!-- entregas:checklist:end -->

## Por que esta entrega já nasce adiantada

A modelagem e as decisões de dados foram feitas junto com a implementação, em
03/09/2026 (ver histórico do repositório) — bem antes da data de revisão em
sala. Isso é intencional: o time preferiu validar o modelo construindo o
banco de verdade em vez de manter DER e schema divergentes por semanas. Os
documentos abaixo já existem; o trabalho que falta até 02/10 é de revisão e
de preparar a explicação oral das decisões, não de produzir conteúdo do zero.

## Itens fora do repositório

* Ensaio da explicação das decisões de modelagem para a revisão em sala
  (por que cada entidade, por que cada cardinalidade).

## Como fechar esta entrega

1. Revisar os documentos da checklist contra o estado atual do banco (schema
   pode ter evoluído desde 03/09 — conferir com `git log -- database/`).
2. Rodar `node scripts/entregas/gerar-entregas.mjs`.
3. Commit.
4. `git tag entrega-2 && git push origin entrega-2`.
