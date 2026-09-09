# Entrega 4 — Sistema Funcional

| Campo | Valor |
| --- | --- |
| **Revisão em sala** | 20/11/2026 (Banca ExpoUna) |
| **Tag de fechamento** | `entrega-4` |
| **Pergunta que a entrega precisa responder** | O sistema funciona e utiliza efetivamente o Banco de Dados desenvolvido? |

<!-- entregas:status:start -->
🔵 **Pronta para entrega** — 9/9 itens prontos · revisão em sala: 2026-11-20
<!-- entregas:status:end -->

## Checklist

Gerado por [`scripts/entregas/gerar-entregas.mjs`](../../scripts/entregas/gerar-entregas.mjs)
a partir de [`manifest.json`](../../scripts/entregas/manifest.json). Não edite
a tabela a mão — edite os documentos linkados e rode o script de novo.

<!-- entregas:checklist:start -->
| Item | Situação | Local |
| --- | --- | --- |
| API em funcionamento | ✅ | [`apps/api`](../../apps/api) |
| Frontend em funcionamento | ✅ | [`apps/web`](../../apps/web) |
| Principais telas documentadas | ✅ | [`docs/04-ux/telas`](../04-ux/telas) |
| Desenvolvimento do sistema | ✅ | [`docs/02-arquitetura/14-desenvolvimento-sistema.md`](../02-arquitetura/14-desenvolvimento-sistema.md) |
| Integração Sistema × Banco de Dados | ✅ | [`docs/02-arquitetura/15-integracao-sistema-bd.md`](../02-arquitetura/15-integracao-sistema-bd.md) |
| Execução local e ambiente | ✅ | [`docs/02-arquitetura/16-execucao-local.md`](../02-arquitetura/16-execucao-local.md) |
| Casos de teste e validação | ✅ | [`docs/05-qualidade/17-testes.md`](../05-qualidade/17-testes.md) |
| Registro de Programação Assistida por IA | ✅ | [`docs/05-qualidade/18-registro-ia.md`](../05-qualidade/18-registro-ia.md) |
| Evidências reais de uso de IA (além do modelo) | ✅ | [`docs/05-qualidade/registro-ia`](../05-qualidade/registro-ia) |
<!-- entregas:checklist:end -->

## O que ainda é trabalho de verdade, não só checklist

Diferente das Entregas 2 e 3, esta não estava adiantada por natureza: testes,
registro contínuo de uso de IA e o roteiro de demonstração exigem atividade
constante até a data da banca, não só documentos já escritos. Manter
[`docs/05-qualidade/registro-ia/`](../05-qualidade/registro-ia/) atualizado a
cada uso relevante de IA é regra da disciplina (ver
[CLAUDE.md](../../CLAUDE.md)), não só desta entrega.

## Itens fora do repositório

* Slides da apresentação (Slides 1–16, seção 15 do edital).
* Ensaio da demonstração ao vivo (seção 16 do edital).

## Como fechar esta entrega

1. Rodar a suíte de testes (`EuDuvido.Api.Tests`) e conferir o roteiro de
   demonstração do [README principal](../../README.md).
2. Rodar `node scripts/entregas/gerar-entregas.mjs`.
3. Commit.
4. `git tag entrega-4 && git push origin entrega-4`.
