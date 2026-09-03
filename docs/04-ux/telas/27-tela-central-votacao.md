# 27 - Tela: Central de Votação

## Objetivo
Validação por evidência pelos membros do grupo (RF07).

## Seções principais
- **Lista de evidências pendentes** de voto nos meus grupos (evidências já votadas pelo usuário continuam na lista, marcadas como "Já votado")
- **Card de evidência:** mídia, comprovante, contagem de votos válidos/inválidos, quórum necessário e prazo restante
- **Ação de votar:** `VALIDO`/`INVALIDO` + justificativa

## Dados (origem: `validacao.evidencia`, `validacao.validador_evidencia`, `validacao.voto_evidencia`)
`tipo_midia`, `url_comprovante`, `status`, `data_limite_votacao` / snapshot de validadores / `voto`, `justificativa`, `data_voto` — voto único por usuário/evidência (RN04). A tela é alimentada pela view `validacao.vw_status_votacao`, que já entrega votos, quórum e situação por evidência.

## Decisões (validado com o time)
- O desafiante (`DESAFIANTE`) fica de fora da votação; os demais membros do grupo podem votar.
- Prazo de votação: 1 semana.
- Quórum mínimo para apurar o resultado: metade + 1 dos validadores.
- Evidência já votada pelo usuário não some da lista — aparece marcada como "Já votado".

## Resolvido na arquitetura
- **Expiração da votação (TODO anterior):** a evidência ganhou a coluna explícita `validacao.evidencia.data_limite_votacao` — **não derivada** de `data_envio`, justamente para permitir prorrogar um prazo sem alterar código (RN11, constraint `chk_evidencia_votacao`). Um `BackgroundService` varre as evidências vencidas e chama a apuração; o índice parcial `idx_evidencia_pendente` sustenta essa varredura.
- **Voto fora do prazo é recusado no banco:** o trigger `trg_voto_evidencia_valida` rejeita voto em evidência que não esteja `EM_VOTACAO` ou cujo prazo já passou — a garantia não depende da tela (RN19).
- **Validadores congelados (mudança mais relevante):** o conjunto de quem pode votar é gravado em `validacao.validador_evidencia` no **momento do envio da evidência** — membros do grupo exceto `DESAFIANTE` e `DESAFIADO`. Quem entra no grupo depois **não vota nem conta** para o quórum; sem esse congelamento o resultado de uma aposta mudaria sozinho. A FK composta em `voto_evidencia` garante que só vota quem está no snapshot (RN14, [ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md)).
- **Quórum:** `floor(n/2) + 1` calculado **sobre o snapshot**, não sobre o grupo atual. A evidência é aceita quando os votos `VALIDO` atingem o quórum e recusada quando os `INVALIDO` o atingem (RN15, procedure `validacao.apurar_votacao`).
- **Empate:** mantém a votação aberta. Se o prazo expira sem maioria, a evidência é **recusada** — o ônus da prova é de quem enviou; prazo expirado sem nenhum voto resulta em `EXPIRADA` (RN16).
- **Incentivo a votar:** quem votou numa evidência que atingiu quórum recebe **2 CP**, creditados na apuração e não por voto individual — pagar por clique incentivaria votar sem analisar (RN17, procedure `economia.creditar_recompensa_voto`).
- **Atualização ao vivo:** as contagens de voto e o status da evidência atualizam em tempo real por **SignalR**, sem o usuário recarregar a tela ([ADR 0011](../../02-arquitetura/adr/0011-notificacoes-web-push.md)).

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
