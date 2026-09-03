# 24 - Tela: Minhas Apostas

## Objetivo
Dashboard principal do usuário com as apostas em que está envolvido (RF04, RF05, RF08).

## Seções principais
- **Filtro por status:** `ABERTA`, `EM_ANDAMENTO`, `EM_VOTACAO`, `FINALIZADA_CUMPRIU`, `FINALIZADA_PERDEU`, `CANCELADA` (RN03)
- **Cards de aposta:** título, categoria, grupo, custo em CP, recompensa, prazo (`data_limite`)
- **Separação:** apostas que criei vs. que participo
- **CTA direto** para a Central de Votação em apostas `EM_VOTACAO` (ex: "Cumpra agora!")
- **Sino de notificações:** notificações não lidas do usuário

## Dados (origem: `apostas.aposta`, `apostas.participante_aposta`, `notificacoes.notificacao`)
`titulo`, `status`, `valor_cp`, `tipo_recompensa`, `valor_monetario`/`descricao_prenda`, `data_limite` / `papel_aposta`, `escolha` / `tipo`, `titulo`, `corpo`, `url_destino`, `data_leitura`

## Decisões (validado com o time)
- Ordenação padrão: prazo mais próximo primeiro (lista com prioridade por `data_limite`).
- Apostas `EM_VOTACAO` mostram um CTA direto para a Central de Votação.
- Prazo vencendo dispara notificação (com tom bem-humorado) para o criador da aposta.

## Resolvido na arquitetura
- **Custo em CP no card:** cada card mostra `apostas.aposta.valor_cp` — o custo fixo por participante (RN07). O `valor_monetario` continua no card apenas como texto descritivo do que foi combinado fora do app ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)).
- **Notificação de prazo vencendo:** deixou de ser só um aviso de tela. É **persistida** em `notificacoes.notificacao` com `tipo = 'PRAZO_VENCENDO'` e entregue por **Web Push**; quem perdeu o push vê a notificação ao abrir o app ([ADR 0011](../../02-arquitetura/adr/0011-notificacoes-web-push.md)).
- **Quem dispara:** um `BackgroundService` varre periodicamente as apostas com prazo próximo e cria as notificações — a varredura é alimentada pela query **Q8** de [analytical_queries.sql](../../../database/scripts/queries/analytical_queries.sql) ("apostas com prazo vencendo"), apoiada pelo índice parcial `idx_aposta_data_limite`.
- **Cancelamento automático:** aposta que chega à `data_limite` ainda `ABERTA` é cancelada pelo mesmo `BackgroundService` (RN21), e some dos filtros ativos da tela como `CANCELADA`.

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
