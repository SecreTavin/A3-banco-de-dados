# 26 - Tela: Detalhe da Aposta

## Objetivo
Visão completa de uma aposta específica: participantes, evidências e resultado.

## Seções principais
- **Cabeçalho:** status, prazo, custo em CP e pote em jogo, recompensa
- **Participantes:** lista com papel e escolha
- **Evidências:** mídia (`FOTO`/`VIDEO`/`LINK`/`TEXTO`), comprovante, comentário, status da evidência — exibidas em linha do tempo (até 5 por aposta)
- **Envio de evidência** (RF06) — nova evidência sequencial permitida se a anterior for recusada pelo júri
- **Comentários:** conversa dos participantes na própria aposta
- **Cancelamento**, quando cabível, com motivo obrigatório
- **Resultado final** quando a aposta é encerrada

## Dados (origem: `apostas.aposta`, `apostas.participante_aposta`, `validacao.evidencia`, `apostas.comentario_aposta`)
`status`, `valor_cp`, `data_limite`, `motivo_cancelamento`, `data_encerramento` / `papel_aposta`, `escolha` / `ordem`, `tipo_midia`, `url_comprovante`, `comentario`, `status`, `data_envio`, `data_limite_votacao`, `data_apuracao` / `texto`, `data_envio`

## Decisões (validado com o time)
- Transição `EM_VOTACAO` → `FINALIZADA_CUMPRIU`/`FINALIZADA_PERDEU` depende da validação por quórum a cada etapa (quórum = metade + 1 dos validadores, ver [27](27-tela-central-votacao.md)).
- Cancelamento: o criador pode cancelar a aposta a qualquer momento após criada; a partir do início da validação, é obrigatório informar o motivo, que deve ser aprovado por pelo menos metade dos integrantes (`APOSTADOR` não conta para esse quórum).
- Evidências: exibidas em linha do tempo; o apostador pode enviar uma nova evidência sequencial se o júri recusar a anterior, até no máximo 5 evidências por aposta. A partir de 3 evidências recusadas, o apostador perde a aposta.

## Resolvido na arquitetura
- **Status da evidência existe no banco:** `validacao.evidencia.status` com `EM_VOTACAO`/`ACEITA`/`RECUSADA`/`EXPIRADA` (constraint `chk_evidencia_status`, RN13), escrito pela procedure de apuração. Com isso, a regra "3 recusadas e o desafiado perde" passa a ser **derivável do banco** — basta contar as evidências `RECUSADA` da aposta, sem estado paralelo na aplicação (RN10).
- **Limite de 5 evidências:** garantido por `chk_evidencia_ordem` (`ordem BETWEEN 1 AND 5`) e `unq_evidencia_ordem` (`UNIQUE (id_aposta, ordem)`) — a linha de tempo não aceita uma sexta evidência nem duas na mesma posição (RN10).
- **Cancelamento com motivo:** `chk_aposta_cancelamento` recusa no banco qualquer aposta `CANCELADA` sem `motivo_cancelamento`. O cancelamento é executado pela procedure `apostas.cancelar_aposta`, que **estorna o CP** de todos os participantes com um lançamento novo no ledger — nunca apagando o original (RN12, RN24, [ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)).
- **Comentários ganharam tabela própria:** `apostas.comentario_aposta` (`texto`, `data_envio`), que **substitui o módulo de chat** cogitado antes — a conversa fica no contexto da aposta, sem um sistema de mensagens separado.
- **Mídia da evidência:** a linha em `evidencia` só é criada **após** o storage confirmar o upload, para o júri nunca votar em evidência inexistente (RN22, [ADR 0009](../../02-arquitetura/adr/0009-armazenamento-de-midia-r2.md)).

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
