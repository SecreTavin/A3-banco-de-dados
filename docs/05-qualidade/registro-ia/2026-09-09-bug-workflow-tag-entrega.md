# 2026-09-09 — Bug de ordem no workflow de release da entrega-1

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-09 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | Nenhum arquivo de automação alterado — achado registrado, correção é regenerar e retaguear |

## O que foi pedido

Criar e enviar a tag `entrega-1` pra fechar a primeira entrega, seguindo o
passo 4 do ["Como fechar uma entrega"](../../../README.md#como-fechar-uma-entrega).

## O que a IA produziu

Executou exatamente o passo documentado: `git tag entrega-1 && git push
origin entrega-1`.

## O que a IA errou

**Não antecipou uma dependência circular no próprio workflow do projeto.**
O `gerar-entregas.mjs` calcula o status "Entregue" checando se a tag
existe; mas o commit que a tag aponta foi gerado *antes* da tag existir —
então, no exato momento em que a tag é criada, os documentos em
`docs/07-entregas/` ainda dizem "Pronta para entrega", não "Entregue". O
job `checklist` do [`entregas.yml`](../../../.github/workflows/entregas.yml)
roda `--check` nesse mesmo commit (disparado pelo push da tag) e falha,
porque os documentos estão "desatualizados" em relação ao que o gerador
produziria agora. Como o job `release` depende (`needs: checklist`) do
`checklist` passar, **a Release nunca foi publicada** — o job apareceu como
`skipped`.

Isso não é bug de digitação, é uma lacuna real na documentação do processo
(`scripts/entregas/README.md` e o README principal): ambos dizem "rode o
gerador, comite, crie a tag" como sequência linear, sem mencionar que é
preciso rodar o gerador **de novo, depois** da tag existir, e mover a tag
pro commit que reflete isso.

## Como o time validou

* `gh run view` no run disparado pelo push da tag confirmou: job
  `checklist` com `conclusion: failure`, job `release` com
  `conclusion: skipped`.
* `gh release view entrega-1` confirmou que **nenhuma Release foi
  publicada** — nada público quebrado, só o workflow não completou.

## Decisão final

Correção aplicada nesta sessão:
1. Rodar o gerador de novo agora que a tag existe (commit separado).
2. Mesclar esse commit na `main` via PR normal.
3. Mover a tag `entrega-1` pro novo commit (`git tag -f` local +
   `git push --force origin entrega-1`, ou apagar e recriar) e reenviar —
   isso dispara o workflow de novo, agora com o `checklist` batendo com o
   que o gerador produz, liberando o `release`.

**Pendência para o time:** atualizar
[`scripts/entregas/README.md`](../../../scripts/entregas/README.md) e o
["Como fechar uma entrega"](../../../README.md#como-fechar-uma-entrega) do
README principal para deixar essa segunda rodada do gerador explícita no
passo a passo, evitando que as próximas entregas (2, 3, 4, banca-final)
caiam no mesmo problema.
