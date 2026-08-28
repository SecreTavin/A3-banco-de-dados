# 28 - Tela: Ranking

## Objetivo
Ranking de maiores apostas e apuração de resultados (RF08).

## Seções principais
- **Ranking por grupo** (histórico completo — cada grupo tem seu próprio histórico de ações)
- **Maiores apostas** (valor monetário)
- **% de aprovação** e cumpridas vs. perdidas

## Dados (origem: queries analíticas)
Baseado em [analytical_queries.sql](../database/scripts/queries/analytical_queries.sql) — `percentual_aprovacao`, contagem de votos favoráveis/contra.

## Decisões (validado com o time)
- "Maiores apostas" é ranqueado por valor monetário.
- Período do ranking: histórico completo, por grupo (cada grupo tem seu próprio histórico completo de ações).

## TODOs para validação com o time
- [ ] Prendas (`PRENDA_ACAO`/`ITEM_MATERIAL`) não têm valor numérico — como entram no ranking, ou ficam de fora?
