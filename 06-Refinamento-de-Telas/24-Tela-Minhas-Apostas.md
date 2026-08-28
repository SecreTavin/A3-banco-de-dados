# 24 - Tela: Minhas Apostas

## Objetivo
Dashboard principal do usuário com as apostas em que está envolvido (RF04, RF05, RF08).

## Seções principais
- **Filtro por status:** `ABERTA`, `EM_ANDAMENTO`, `EM_VOTACAO`, `FINALIZADA_CUMPRIU`, `FINALIZADA_PERDEU`, `CANCELADA` (RN03)
- **Cards de aposta:** título, categoria, grupo, recompensa, prazo (`data_limite`)
- **Separação:** apostas que criei vs. que participo
- **CTA direto** para a Central de Votação em apostas `EM_VOTACAO` (ex: "Cumpra agora!")

## Dados (origem: `aposta`, `participante_aposta`)
`titulo`, `status`, `tipo_recompensa`, `valor_monetario`/`descricao_prenda`, `data_limite`

## Decisões (validado com o time)
- Ordenação padrão: prazo mais próximo primeiro (lista com prioridade por `data_limite`).
- Apostas `EM_VOTACAO` mostram um CTA direto para a Central de Votação.
- Prazo vencendo dispara notificação (com tom bem-humorado) para o criador da aposta.

## TODOs para validação com o time
Nenhum pendente — todas as dúvidas foram resolvidas nas Decisões acima.
