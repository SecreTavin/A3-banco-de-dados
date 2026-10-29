-- =============================================================================
-- Consultas Analiticas - Eu Duvido!
-- =============================================================================
-- Cada consulta aqui atende duas finalidades: e entregavel do documento 16 e,
-- ao mesmo tempo, alimenta um painel do Grafana (ADR 0013).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Q1 - Apuracao de uma evidencia: votos, quorum e percentual de aprovacao.
-- Consulta central do produto. Note que o denominador do quorum vem do
-- snapshot congelado (validador_evidencia), nao do tamanho atual do grupo.
-- -----------------------------------------------------------------------------
SELECT a.id_desafio,
       a.titulo                                        AS desafio,
       u.apelido                                       AS enviou_evidencia,
       e.tipo_midia,
       e.url_comprovante,
       e.status                                        AS status_evidencia,
       COUNT(DISTINCT val.id_usuario)                  AS validadores_elegiveis,
       floor(COUNT(DISTINCT val.id_usuario) / 2.0) + 1 AS quorum_necessario,
       COUNT(DISTINCT v.id_usuario)                    AS total_votos,
       COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'VALIDO')   AS votos_favoraveis,
       COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'INVALIDO') AS votos_contra,
       ROUND(
           100.0 * COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'VALIDO')
           / NULLIF(COUNT(DISTINCT v.id_usuario), 0), 1) AS percentual_aprovacao
  FROM validacao.evidencia e
  INNER JOIN desafios.desafio a       ON a.id_desafio   = e.id_desafio
  INNER JOIN identidade.usuario u   ON u.id_usuario  = e.id_usuario
  LEFT  JOIN validacao.validador_evidencia val ON val.id_evidencia = e.id_evidencia
  LEFT  JOIN validacao.voto_evidencia v        ON v.id_evidencia   = e.id_evidencia
 GROUP BY a.id_desafio, a.titulo, u.apelido, e.tipo_midia,
          e.url_comprovante, e.status
 ORDER BY a.id_desafio;

-- -----------------------------------------------------------------------------
-- Q2 - Ranking por grupo: historico completo de cada membro.
-- Resolve o TODO da tela 28 - como CP e a moeda unica, desafios de prenda e
-- monetarias sao comparaveis na mesma coluna (ADR 0006).
-- -----------------------------------------------------------------------------
SELECT g.nome                                       AS grupo,
       u.apelido,
       m.saldo_cp                                   AS saldo_atual,
       COUNT(DISTINCT p.id_desafio)                  AS desafios_participadas,
       COUNT(DISTINCT p.id_desafio) FILTER (
           WHERE (a.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'VAI_CUMPRIR')
              OR (a.status = 'FINALIZADA_PERDEU'  AND p.escolha = 'NAO_VAI_CUMPRIR')
       )                                            AS acertos,
       COUNT(DISTINCT p.id_desafio) FILTER (
           WHERE (a.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'NAO_VAI_CUMPRIR')
              OR (a.status = 'FINALIZADA_PERDEU'  AND p.escolha = 'VAI_CUMPRIR')
       )                                            AS erros,
       COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'PREMIO'), 0) AS cp_ganho_em_premios
  FROM grupos.membro_grupo m
  INNER JOIN grupos.grupo_amigos g  ON g.id_grupo   = m.id_grupo
  INNER JOIN identidade.usuario u   ON u.id_usuario = m.id_usuario
  LEFT  JOIN desafios.desafio a       ON a.id_grupo   = m.id_grupo
  LEFT  JOIN desafios.participante_desafio p
         ON p.id_desafio = a.id_desafio AND p.id_usuario = m.id_usuario
  LEFT  JOIN economia.transacao_cp t
         ON t.id_grupo = m.id_grupo AND t.id_usuario = m.id_usuario
 GROUP BY g.nome, u.apelido, m.saldo_cp
 ORDER BY m.saldo_cp DESC, acertos DESC;

-- -----------------------------------------------------------------------------
-- Q3 - Maiores desafios por valor em CP, com o pote efetivamente em jogo.
-- -----------------------------------------------------------------------------
SELECT a.id_desafio,
       a.titulo,
       c.nome                       AS categoria,
       a.valor_cp                   AS custo_por_participante,
       COUNT(p.id_participante)     AS n_participantes,
       a.valor_cp * COUNT(p.id_participante) AS pote_total_cp,
       a.tipo_recompensa,
       a.valor_monetario            AS valor_combinado_fora_do_app,
       a.status
  FROM desafios.desafio a
  INNER JOIN desafios.categoria_desafio c ON c.id_categoria = a.id_categoria
  LEFT  JOIN desafios.participante_desafio p ON p.id_desafio = a.id_desafio
 GROUP BY a.id_desafio, a.titulo, c.nome, a.valor_cp,
          a.tipo_recompensa, a.valor_monetario, a.status
 ORDER BY pote_total_cp DESC
 LIMIT 10;

-- -----------------------------------------------------------------------------
-- Q4 - Distribuicao de desafios por categoria e tipo de recompensa.
-- Atende "contagem de prendas por categoria" do documento 16.
-- -----------------------------------------------------------------------------
SELECT c.nome                                                       AS categoria,
       COUNT(a.id_desafio)                                           AS total_desafios,
       COUNT(a.id_desafio) FILTER (WHERE a.tipo_recompensa = 'MONETARIA')     AS monetarias,
       COUNT(a.id_desafio) FILTER (WHERE a.tipo_recompensa = 'PRENDA_ACAO')   AS prendas_acao,
       COUNT(a.id_desafio) FILTER (WHERE a.tipo_recompensa = 'ITEM_MATERIAL') AS itens_materiais,
       COUNT(a.id_desafio) FILTER (WHERE a.status = 'FINALIZADA_CUMPRIU')     AS cumpridas,
       COUNT(a.id_desafio) FILTER (WHERE a.status = 'FINALIZADA_PERDEU')      AS perdidas,
       ROUND(AVG(a.valor_cp), 1)                                    AS custo_medio_cp
  FROM desafios.categoria_desafio c
  LEFT JOIN desafios.desafio a ON a.id_categoria = c.id_categoria
 GROUP BY c.nome
 ORDER BY total_desafios DESC;

-- -----------------------------------------------------------------------------
-- Q5 - Extrato de CP de um usuario em um grupo.
-- Demonstra o ledger: cada linha e um lancamento, o saldo e a soma acumulada.
-- Usa window function para o saldo corrente.
-- -----------------------------------------------------------------------------
SELECT t.data_lancamento,
       t.tipo,
       t.valor,
       t.descricao,
       a.titulo AS desafio,
       SUM(t.valor) OVER (
           PARTITION BY t.id_grupo, t.id_usuario
           ORDER BY t.data_lancamento, t.id_transacao
       ) AS saldo_apos_lancamento
  FROM economia.transacao_cp t
  LEFT JOIN desafios.desafio a ON a.id_desafio = t.id_desafio
 WHERE t.id_grupo = 1
   AND t.id_usuario = 1
 ORDER BY t.data_lancamento, t.id_transacao;

-- -----------------------------------------------------------------------------
-- Q6 - Participacao dos validadores: quem realmente vota.
-- O maior risco do produto e evidencia ficar sem quorum por falta de voto.
-- Esta consulta mostra onde isso esta acontecendo.
-- -----------------------------------------------------------------------------
SELECT u.apelido,
       COUNT(val.id_evidencia)                          AS vezes_elegivel,
       COUNT(v.id_voto)                                 AS votos_dados,
       ROUND(100.0 * COUNT(v.id_voto)
             / NULLIF(COUNT(val.id_evidencia), 0), 1)   AS taxa_participacao,
       COUNT(v.id_voto) FILTER (WHERE v.voto = 'VALIDO')   AS votou_valido,
       COUNT(v.id_voto) FILTER (WHERE v.voto = 'INVALIDO') AS votou_invalido
  FROM validacao.validador_evidencia val
  INNER JOIN identidade.usuario u ON u.id_usuario = val.id_usuario
  LEFT  JOIN validacao.voto_evidencia v
         ON v.id_evidencia = val.id_evidencia
        AND v.id_usuario   = val.id_usuario
 GROUP BY u.apelido
 ORDER BY taxa_participacao DESC NULLS LAST;

-- -----------------------------------------------------------------------------
-- Q7 - Integridade contabil do grupo.
-- A soma de TODOS os lancamentos de um grupo deve ser exatamente
-- 100 * numero de membros. CP nao e criado nem destruido fora do credito
-- inicial e das recompensas de voto.
-- -----------------------------------------------------------------------------
SELECT g.nome                                          AS grupo,
       COUNT(DISTINCT m.id_usuario)                    AS n_membros,
       COUNT(DISTINCT m.id_usuario) * 100              AS cp_inicial_total,
       COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'RECOMPENSA_VOTO'), 0)
                                                       AS cp_criado_por_recompensa,
       COALESCE(SUM(t.valor), 0)                       AS soma_ledger,
       COUNT(DISTINCT m.id_usuario) * 100
           + COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'RECOMPENSA_VOTO'), 0)
           - COALESCE(SUM(t.valor), 0)                 AS divergencia
  FROM grupos.grupo_amigos g
  INNER JOIN grupos.membro_grupo m ON m.id_grupo = g.id_grupo
  LEFT  JOIN economia.transacao_cp t ON t.id_grupo = g.id_grupo
 GROUP BY g.id_grupo, g.nome;

-- -----------------------------------------------------------------------------
-- Q8 - Desafios com prazo vencendo, alimentando as notificacoes.
-- Usa o indice parcial idx_desafio_data_limite.
-- -----------------------------------------------------------------------------
SELECT a.id_desafio,
       a.titulo,
       a.status,
       a.data_limite,
       a.data_limite - CURRENT_TIMESTAMP AS tempo_restante,
       u.apelido                         AS criador,
       COUNT(p.id_participante)          AS n_participantes
  FROM desafios.desafio a
  INNER JOIN identidade.usuario u ON u.id_usuario = a.id_criador
  LEFT  JOIN desafios.participante_desafio p ON p.id_desafio = a.id_desafio
 WHERE a.status IN ('ABERTA', 'EM_ANDAMENTO')
   AND a.data_limite BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '48 hours'
 GROUP BY a.id_desafio, a.titulo, a.status, a.data_limite, u.apelido
 ORDER BY a.data_limite;

-- =============================================================================
-- Analise de desempenho (documento 16)
-- =============================================================================
-- Para demonstrar o efeito dos indices, comparar o plano antes e depois:
--
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM desafios.desafio
--    WHERE status IN ('ABERTA','EM_ANDAMENTO')
--      AND data_limite < CURRENT_TIMESTAMP + INTERVAL '48 hours';
--
-- Queries mais lentas do sistema (requer extensao pg_stat_statements):
--
--   SELECT query, calls, ROUND(mean_exec_time::numeric, 2) AS media_ms,
--          ROUND(total_exec_time::numeric, 2) AS total_ms
--     FROM pg_stat_statements
--    ORDER BY mean_exec_time DESC
--    LIMIT 10;
-- =============================================================================
