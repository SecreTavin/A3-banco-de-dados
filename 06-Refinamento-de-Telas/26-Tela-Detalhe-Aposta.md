# 26 - Tela: Detalhe da Aposta

## Objetivo
Visão completa de uma aposta específica: participantes, evidências e resultado.

## Seções principais
- **Cabeçalho:** status, prazo, recompensa
- **Participantes:** lista com papel e escolha
- **Evidências:** mídia (`FOTO`/`VIDEO`/`LINK`/`TEXTO`), comprovante, comentário
- **Envio de evidência** (RF06)
- **Resultado final** quando a aposta é encerrada

## Dados (origem: `aposta`, `participante_aposta`, `evidencia`)
`status`, `data_limite` / `papel_aposta`, `escolha` / `tipo_midia`, `url_comprovante`, `comentario`, `data_envio`

## TODOs para validação com o time
- [ ] **Gap crítico:** quem/o que dispara a transição `EM_VOTACAO` → `FINALIZADA_CUMPRIU`/`FINALIZADA_PERDEU`? Não há regra de quórum ou prazo de votação definida em nenhum RN. Validar com o time e com o professor orientador, já que impacta o modelo de dados.
- [ ] Quem pode cancelar uma aposta (`CANCELADA`) e em que condições?
- [ ] Mais de uma evidência por aposta é permitido — como exibir múltiplas (linha do tempo)?
