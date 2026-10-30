# 2026-10-30 — Regenera o status da Entrega 3

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/07-entregas/README.md`, `docs/07-entregas/entrega-3-banco-de-dados.md` |

## O que foi pedido

Gerar a Entrega 3: criar a tag `entrega-3` e deixar o painel de entregas
consistente com ela.

## O que a IA produziu

A saída de `node scripts/entregas/gerar-entregas.mjs` com a tag presente: a
Entrega 3 passa de "Pronta para entrega (8/8)" para "Entregue (8/8)". Nenhuma
linha foi escrita à mão.

## O que a IA errou

* **Ordem invertida.** A IA criou e enviou a tag antes de regenerar as tabelas.
  O job `checklist` do workflow `entregas.yml` rodou com a tag já presente,
  falhou (`As tabelas geradas estão desatualizadas`) e o job `release` foi
  pulado. Na Entrega 2 o commit de status entrou antes da tag; aqui a ordem
  correta foi repetida só depois do erro.
* **Correção.** Regenerar as tabelas, mergear e reposicionar a tag sobre o
  commit novo, o que exige reenviar a tag (ela não tinha release publicado).

## Como o time validou

`node scripts/entregas/gerar-entregas.mjs --check` passa no commit novo, e o
workflow de release da tag reposicionada deve publicar a release da Entrega 3.

## Decisão final

Entram as tabelas regeneradas e a tag `entrega-3` sobre o commit que as contém.
