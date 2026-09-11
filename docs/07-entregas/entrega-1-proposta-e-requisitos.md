# Entrega 1 — Proposta e Requisitos

| Campo | Valor |
| --- | --- |
| **Revisão em sala** | 11/09/2026 |
| **Tag de fechamento** | `entrega-1` |
| **Pergunta que a entrega precisa responder** | Qual problema será resolvido e qual sistema será desenvolvido? |

<!-- entregas:status:start -->
🟢 **Entregue** — tag `entrega-1` em 2026-09-09 · 9/9 itens prontos
<!-- entregas:status:end -->

## Checklist

Gerado por [`scripts/entregas/gerar-entregas.mjs`](../../scripts/entregas/gerar-entregas.mjs)
a partir de [`manifest.json`](../../scripts/entregas/manifest.json). Não edite
a tabela a mão — edite os documentos linkados e rode o script de novo.

<!-- entregas:checklist:start -->
| Item | Situação | Local |
| --- | --- | --- |
| Identificação do projeto (integrantes, RA, e-mail) | ✅ | [`docs/00-introducao/01-identificacao.md`](../00-introducao/01-identificacao.md) |
| Proposta do sistema (introdução) | ✅ | [`docs/00-introducao/02-introducao.md`](../00-introducao/02-introducao.md) |
| Problema e contexto | ✅ | [`docs/00-introducao/03-problema-e-contexto.md`](../00-introducao/03-problema-e-contexto.md) |
| Justificativa | ✅ | [`docs/00-introducao/04-justificativa.md`](../00-introducao/04-justificativa.md) |
| Objetivos (geral e específicos) | ✅ | [`docs/00-introducao/05-objetivos.md`](../00-introducao/05-objetivos.md) |
| Público-alvo e usuários | ✅ | [`docs/00-introducao/06-publico-alvo.md`](../00-introducao/06-publico-alvo.md) |
| Plano de trabalho / cronograma | ✅ | [`docs/00-introducao/07-plano-de-trabalho.md`](../00-introducao/07-plano-de-trabalho.md) |
| Requisitos funcionais e não funcionais | ✅ | [`docs/01-negocio/07-requisitos.md`](../01-negocio/07-requisitos.md) |
| Regras de negócio iniciais | ✅ | [`docs/01-negocio/08-regras-de-negocio.md`](../01-negocio/08-regras-de-negocio.md) |
<!-- entregas:checklist:end -->

## Pendências conhecidas (fora do que o script consegue checar)

* Nenhuma no momento. Integrantes (5, ordem alfabética), objetivos
  específicos e o plano de trabalho estão preenchidos — ver
  [01-identificacao.md](../00-introducao/01-identificacao.md).

## Itens fora do repositório

* Preenchimento e envio da **Ficha de Inscrição** (PDF do professor) até
  11/09/2026.

## Como fechar esta entrega

1. Resolver as pendências acima.
2. Rodar `node scripts/entregas/gerar-entregas.mjs` e conferir que a checklist
   ficou 100%.
3. Commit.
4. `git tag entrega-1 && git push origin entrega-1` — o workflow
   [`entregas.yml`](../../.github/workflows/entregas.yml) publica este
   documento como Release no GitHub e o status aqui vira **Entregue**
   automaticamente na próxima geração.
