# 24 - Tela: Minhas Apostas

## Objetivo
Dashboard principal do usuário com as apostas em que está envolvido (RF04, RF05, RF08).

## Seções principais
- **Filtro por status:** `ABERTA`, `EM_ANDAMENTO`, `EM_VOTACAO`, `FINALIZADA_CUMPRIU`, `FINALIZADA_PERDEU`, `CANCELADA` (RN03)
- **Cards de aposta:** título, categoria, grupo, custo em CP, recompensa, prazo (`data_limite`)
- **Separação:** apostas que criei vs. que participo
- **CTA direto** para a Central de Votação em apostas `EM_VOTACAO` (ex: "Cumpra agora!")

## Dados (origem: `aposta`, `participante_aposta`)
`titulo`, `status`, `valor_cp`, `tipo_recompensa`, `descricao_recompensa`, `data_limite` / `papel_aposta`, `escolha`

## Decisões (validado com o time)
- Ordenação padrão: prazo mais próximo primeiro (lista com prioridade por `data_limite`).
- Apostas `EM_VOTACAO` mostram um CTA direto para a Central de Votação.

## Resolvido na arquitetura
- **Custo em CP no card:** cada card mostra `apostas.aposta.valor_cp` — o custo fixo por participante (RN07). A `descricao_recompensa` aparece no card apenas como texto descritivo do que foi combinado fora do app ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)).
- **Cancelamento automático:** aposta que chega à `data_limite` ainda `ABERTA` é cancelada por um `BackgroundService` (RN21), e some dos filtros ativos da tela como `CANCELADA`.

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
