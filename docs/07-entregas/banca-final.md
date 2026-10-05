# Banca Final

| Campo | Valor |
| --- | --- |
| **Data prevista** | 04/12/2026 (janela alternativa da Banca ExpoUna; a primeira janela é 20/11/2026) |
| **Tag de fechamento** | `banca-final` |
| **Duração** | 40 a 45 minutos por grupo |
| **Pergunta que a entrega precisa responder** | O grupo compreendeu e é capaz de explicar o que desenvolveu, do problema à demonstração? |

<!-- entregas:status:start -->
🟡 **Em construção** — 1/3 itens prontos · revisão em sala: 2026-12-04
<!-- entregas:status:end -->

## Checklist

Gerado por [`scripts/entregas/gerar-entregas.mjs`](../../scripts/entregas/gerar-entregas.mjs)
a partir de [`manifest.json`](../../scripts/entregas/manifest.json). Não edite
a tabela a mão — edite os documentos linkados e rode o script de novo.

<!-- entregas:checklist:start -->
| Item | Situação | Local |
| --- | --- | --- |
| Limitações e melhorias futuras | ✅ | [`docs/06-encerramento/19-limitacoes-e-melhorias.md`](../06-encerramento/19-limitacoes-e-melhorias.md) |
| Conclusão | ❌ | [`docs/06-encerramento/20-conclusao.md`](../06-encerramento/20-conclusao.md) |
| Referências (ABNT) | ❌ | [`docs/06-encerramento/21-referencias.md`](../06-encerramento/21-referencias.md) |
<!-- entregas:checklist:end -->

## Por que só estes três itens

Todo o resto exigido na banca (DER, banco, sistema, testes, IA) já é coberto
pelas Entregas 1 a 4 — a Banca Final não repete esses checklists, só cobra o
fechamento textual do trabalho escrito (seção 14, itens 19–21 do edital) que
só faz sentido escrever depois que o projeto parou de mudar.

Presença de todos os integrantes é obrigatória no dia da banca do grupo —
isso não é um artefato de repositório, é combinado entre o time.

## Como fechar esta entrega

1. Escrever conclusão e referências depois que as Entregas 1–4 estiverem
   fechadas (evita reescrever a síntese a cada mudança).
2. Rodar `node scripts/entregas/gerar-entregas.mjs`.
3. Commit.
4. `git tag banca-final && git push origin banca-final`.
