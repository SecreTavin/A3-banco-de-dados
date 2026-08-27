# 28 - Tela: Ranking

## Objetivo
Ranking de maiores apostas e apuração de resultados (RF08).

## Seções principais
- **Ranking geral ou por grupo**
- **Maiores apostas** (valor monetário)
- **% de aprovação** e cumpridas vs. perdidas

## Dados (origem: queries analíticas)
Baseado em [analytical_queries.sql](../database/scripts/queries/analytical_queries.sql) — `percentual_aprovacao`, contagem de votos favoráveis/contra.

## TODOs para validação com o time
- [ ] "Maiores apostas" do RF08 é por valor monetário, por nº de vitórias, ou ambos? Precisa decidir a métrica.
- [ ] Período do ranking: histórico completo, mensal, por grupo?
- [ ] Prendas (`PRENDA_ACAO`/`ITEM_MATERIAL`) não têm valor numérico — como entram no ranking, ou ficam de fora?
