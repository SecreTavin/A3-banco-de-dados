# 26 - Tela: Detalhe da Aposta

## Objetivo
Visão completa de uma aposta específica: participantes, evidências e resultado.

## Seções principais
- **Cabeçalho:** status, prazo, recompensa
- **Participantes:** lista com papel e escolha
- **Evidências:** mídia (`FOTO`/`VIDEO`/`LINK`/`TEXTO`), comprovante, comentário — exibidas em linha do tempo (até 5 por aposta)
- **Envio de evidência** (RF06) — nova evidência sequencial permitida se a anterior for recusada pelo júri
- **Cancelamento**, quando cabível, com motivo obrigatório
- **Resultado final** quando a aposta é encerrada

## Dados (origem: `aposta`, `participante_aposta`, `evidencia`)
`status`, `data_limite` / `papel_aposta`, `escolha` / `tipo_midia`, `url_comprovante`, `comentario`, `data_envio`

## Decisões (validado com o time)
- Transição `EM_VOTACAO` → `FINALIZADA_CUMPRIU`/`FINALIZADA_PERDEU` depende da validação por quórum a cada etapa (quórum = metade + 1 dos validadores, ver [27](27-Tela-Central-Votacao.md)).
- Cancelamento: o criador pode cancelar a aposta a qualquer momento após criada; a partir do início da validação, é obrigatório informar o motivo, que deve ser aprovado por pelo menos metade dos integrantes (`APOSTADOR` não conta para esse quórum).
- Evidências: exibidas em linha do tempo; o apostador pode enviar uma nova evidência sequencial se o júri recusar a anterior, até no máximo 5 evidências por aposta. A partir de 3 evidências recusadas, o apostador perde a aposta.

## TODOs para validação com o time
Nenhum pendente — todas as dúvidas foram resolvidas nas Decisões acima.
