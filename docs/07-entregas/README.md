# 07 - Entregas

Painel de acompanhamento do Projeto A3. Cada linha corresponde a uma entrega
parcial definida pelo professor (seção 20 do edital) e aponta para o documento
com o checklist detalhado daquela entrega.

O status de cada entrega é **gerado automaticamente** a partir do que existe
de fato no repositório — não é preenchido à mão. Depois de avançar o projeto,
rode:

```bash
node scripts/entregas/gerar-entregas.mjs
```

Isso relê [`scripts/entregas/manifest.json`](../../scripts/entregas/manifest.json),
confere se cada artefato exigido existe (documento, script SQL, pasta de
código) e reescreve as tabelas abaixo e dentro de cada `entrega-N.md`. Uma
entrega vira **Entregue** sozinha quando a tag git correspondente
(`entrega-1`, `entrega-2`, ...) é criada — ver
["Como fechar uma entrega"](../../README.md#como-fechar-uma-entrega) no README
principal.

Como o time já adiantou modelagem, banco de dados e boa parte do sistema, é
normal ver entregas futuras já com vários itens ✅ antes da data de revisão em
sala — isso é o "deixar em construção" com conteúdo pronto: os documentos já
existem e são referenciados, só falta a data e, quando for o caso, um último
ajuste antes de fechar.

<!-- entregas:indice:start -->
| # | Entrega | Pergunta-chave | Revisão em sala | Status |
| --- | --- | --- | --- | --- |
| 1 | [Proposta e Requisitos](entrega-1-proposta-e-requisitos.md) | Qual problema será resolvido e qual sistema será desenvolvido? | 2026-09-11 | 🟢 Entregue (9/9) |
| 2 | [Modelagem](entrega-2-modelagem.md) | Quais dados o sistema precisa armazenar e como esses dados se relacionam? | 2026-10-02 | 🟢 Entregue (8/8) |
| 3 | [Banco de Dados](entrega-3-banco-de-dados.md) | O modelo foi efetivamente transformado em um Banco de Dados funcional? | 2026-10-30 | 🟢 Entregue (8/8) |
| 4 | [Sistema Funcional](entrega-4-sistema-funcional.md) | O sistema funciona e utiliza efetivamente o Banco de Dados desenvolvido? | 2026-11-20 | 🔵 Pronta para entrega (10/10) |
| 5 | [Banca Final](banca-final.md) | O grupo compreendeu e é capaz de explicar o que desenvolveu, do problema à demonstração? | 2026-12-04 | 🟡 Em construção (1/3) |
<!-- entregas:indice:end -->

## Convenção de tags

| Entrega | Tag git |
| --- | --- |
| 1 — Proposta e Requisitos | `entrega-1` |
| 2 — Modelagem | `entrega-2` |
| 3 — Banco de Dados | `entrega-3` |
| 4 — Sistema Funcional | `entrega-4` |
| Banca Final | `banca-final` |
