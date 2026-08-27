# 24 - Tela: Minhas Apostas

## Objetivo
Dashboard principal do usuário com as apostas em que está envolvido (RF04, RF05, RF08).

## Seções principais
- **Filtro por status:** `ABERTA`, `EM_ANDAMENTO`, `EM_VOTACAO`, `FINALIZADA_CUMPRIU`, `FINALIZADA_PERDEU`, `CANCELADA` (RN03)
- **Cards de aposta:** título, categoria, grupo, recompensa, prazo (`data_limite`)
- **Separação:** apostas que criei vs. que participo

## Dados (origem: `aposta`, `participante_aposta`)
`titulo`, `status`, `tipo_recompensa`, `valor_monetario`/`descricao_prenda`, `data_limite`

## TODOs para validação com o time
- [ ] Ordenação padrão: prazo mais próximo primeiro?
- [ ] Apostas `EM_VOTACAO` precisam de CTA direto para a Central de Votação?
- [ ] Notificação/badge para apostas com prazo vencendo?
