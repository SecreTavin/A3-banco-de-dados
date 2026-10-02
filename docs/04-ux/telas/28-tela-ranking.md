# 28 - Tela: Ranking

## Objetivo
Ranking de maiores apostas e apuração de resultados (RF08).

## Seções principais
- **Ranking por grupo** (histórico completo — cada grupo tem seu próprio histórico de ações)
- **Maiores apostas** (por pote em CP)
- **% de aprovação** e cumpridas vs. perdidas

## Dados (origem: queries analíticas sobre `aposta`, `participante_aposta`, `voto_evidencia`, `transacao_cp`, `membro_grupo`)
Baseado em [analytical_queries.sql](../../../database/scripts/queries/analytical_queries.sql) — `valor_cp`, `saldo_cp`, `percentual_aprovacao`, contagem de votos favoráveis/contra.

## Decisões (validado com o time)
- Período do ranking: histórico completo, por grupo (cada grupo tem seu próprio histórico completo de ações).

## Resolvido na arquitetura
- **Prendas sem valor numérico (TODO anterior):** resolvido pela adoção do **CP como moeda única**. **Toda** aposta custa CP, inclusive as de prenda (`aposta.valor_cp`, RN07) — então aposta de prenda e aposta de dinheiro entram no ranking na **mesma coluna**, comparáveis entre si, e nenhuma fica de fora. O `valor_monetario` deixou de ser critério: é apenas descritivo ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md), RN02).
- **Ranking por grupo:** alimentado pela query **Q2** de [analytical_queries.sql](../../../database/scripts/queries/analytical_queries.sql) (histórico completo de cada membro no grupo).
- **"Maiores apostas":** deixou de ser ranqueado por valor monetário — agora é por **pote em CP** (`valor_cp × número de participantes`), pela query **Q3**.

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
