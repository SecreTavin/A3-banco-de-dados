-- =============================================================================
-- Consultas Analiticas - Eu Duvido! (modelo v3, schema unico)
-- =============================================================================
-- Cada consulta responde uma pergunta do produto e e explicada no documento
-- 16 - Consultas SQL. Rodam contra o banco povoado por seed.sql:
--
--   docker exec -i euduvido-db-1 psql -U euduvido -d euduvido \
--     < database/scripts/queries/analytical_queries.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Q1 - Apuracao de cada evidencia: juri, quorum, votos e aprovacao.
-- O denominador do quorum e o juri congelado em jurado_evidencia (RN14), nao o
-- tamanho atual do grupo. COUNT(j.voto) ignora nulos: conta so quem ja votou.
-- -----------------------------------------------------------------------------
SELECT d.id_desafio,
       d.titulo                                          AS desafio,
       e.ordem                                           AS tentativa,
       u.apelido                                         AS enviou,
       e.tipo_midia,
       e.status                                          AS status_evidencia,
       COUNT(*)                                          AS jurados,
       floor(COUNT(*) / 2.0) + 1                         AS quorum,
       COUNT(j.voto)                                     AS votos,
       COUNT(*) FILTER (WHERE j.voto = 'VALIDO')         AS validos,
       COUNT(*) FILTER (WHERE j.voto = 'INVALIDO')       AS invalidos,
       ROUND(100.0 * COUNT(*) FILTER (WHERE j.voto = 'VALIDO')
             / NULLIF(COUNT(j.voto), 0), 1)              AS pct_aprovacao
  FROM evidencia e
  JOIN desafio d          ON d.id_desafio   = e.id_desafio
  JOIN usuario u          ON u.id_usuario   = e.id_usuario
  JOIN jurado_evidencia j ON j.id_evidencia = e.id_evidencia
 GROUP BY d.id_desafio, d.titulo, e.ordem, u.apelido, e.tipo_midia, e.status
 ORDER BY d.id_desafio, e.ordem;

-- -----------------------------------------------------------------------------
-- Q2 - Ranking por grupo: saldo, acertos, erros e CP ganho em premios.
-- CP e a moeda unica, entao desafios de prenda e monetarios entram na mesma
-- conta (ADR 0006). As subconsultas evitam a soma inflada que um JOIN direto
-- entre participacoes e lancamentos produziria.
-- -----------------------------------------------------------------------------
SELECT g.nome                                            AS grupo,
       u.apelido,
       m.saldo_cp                                        AS saldo_atual,
       (SELECT COUNT(*)
          FROM participante_desafio p
          JOIN desafio d ON d.id_desafio = p.id_desafio
         WHERE d.id_grupo = m.id_grupo AND p.id_usuario = m.id_usuario)
                                                         AS desafios,
       (SELECT COUNT(*)
          FROM participante_desafio p
          JOIN desafio d ON d.id_desafio = p.id_desafio
         WHERE d.id_grupo = m.id_grupo AND p.id_usuario = m.id_usuario
           AND ((d.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'VAI_CUMPRIR')
             OR (d.status = 'FINALIZADA_PERDEU'  AND p.escolha = 'NAO_VAI_CUMPRIR')))
                                                         AS acertos,
       (SELECT COUNT(*)
          FROM participante_desafio p
          JOIN desafio d ON d.id_desafio = p.id_desafio
         WHERE d.id_grupo = m.id_grupo AND p.id_usuario = m.id_usuario
           AND ((d.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'NAO_VAI_CUMPRIR')
             OR (d.status = 'FINALIZADA_PERDEU'  AND p.escolha = 'VAI_CUMPRIR')))
                                                         AS erros,
       (SELECT COALESCE(SUM(t.valor), 0)
          FROM transacao_cp t
         WHERE t.id_grupo = m.id_grupo AND t.id_usuario = m.id_usuario
           AND t.tipo = 'PREMIO')                        AS cp_em_premios
  FROM membro_grupo m
  JOIN grupo_amigos g ON g.id_grupo   = m.id_grupo
  JOIN usuario u      ON u.id_usuario = m.id_usuario
 ORDER BY g.nome, m.saldo_cp DESC, acertos DESC;

-- -----------------------------------------------------------------------------
-- Q3 - Maiores desafios pelo pote em CP (custo x participantes).
-- descricao_recompensa so registra o que foi combinado fora do app (RN02).
-- -----------------------------------------------------------------------------
SELECT d.id_desafio,
       d.titulo,
       c.nome                                 AS categoria,
       d.valor_cp                             AS custo_por_participante,
       COUNT(p.id_participante)               AS participantes,
       d.valor_cp * COUNT(p.id_participante)  AS pote_cp,
       d.tipo_recompensa,
       d.descricao_recompensa                 AS combinado_fora_do_app,
       d.status
  FROM desafio d
  JOIN categoria_desafio c         ON c.id_categoria = d.id_categoria
  LEFT JOIN participante_desafio p ON p.id_desafio   = d.id_desafio
 GROUP BY d.id_desafio, d.titulo, c.nome, d.valor_cp,
          d.tipo_recompensa, d.descricao_recompensa, d.status
 ORDER BY pote_cp DESC, d.id_desafio
 LIMIT 10;

-- -----------------------------------------------------------------------------
-- Q4 - Desafios por categoria: tipo de recompensa, desfecho e custo medio.
-- -----------------------------------------------------------------------------
SELECT c.nome                                                                 AS categoria,
       COUNT(d.id_desafio)                                                    AS desafios,
       COUNT(d.id_desafio) FILTER (WHERE d.tipo_recompensa = 'MONETARIA')     AS monetarios,
       COUNT(d.id_desafio) FILTER (WHERE d.tipo_recompensa = 'PRENDA_ACAO')   AS prendas,
       COUNT(d.id_desafio) FILTER (WHERE d.status = 'FINALIZADA_CUMPRIU')     AS cumpridos,
       COUNT(d.id_desafio) FILTER (WHERE d.status = 'FINALIZADA_PERDEU')      AS perdidos,
       COUNT(d.id_desafio) FILTER (WHERE d.status = 'CANCELADA')              AS cancelados,
       ROUND(AVG(d.valor_cp), 1)                                              AS custo_medio_cp
  FROM categoria_desafio c
  LEFT JOIN desafio d ON d.id_categoria = c.id_categoria
 GROUP BY c.nome
 ORDER BY desafios DESC, c.nome;

-- -----------------------------------------------------------------------------
-- Q5 - Extrato de CP de um membro em um grupo (Tavin no grupo 2).
-- Cada linha e um lancamento do ledger; a window function acumula o saldo e a
-- ultima linha bate com membro_grupo.saldo_cp (ADR 0007).
-- -----------------------------------------------------------------------------
SELECT t.data_lancamento,
       t.tipo,
       t.valor,
       t.descricao,
       d.titulo AS desafio,
       SUM(t.valor) OVER (
           PARTITION BY t.id_grupo, t.id_usuario
           ORDER BY t.data_lancamento, t.id_transacao
       )        AS saldo_apos_lancamento
  FROM transacao_cp t
  LEFT JOIN desafio d ON d.id_desafio = t.id_desafio
 WHERE t.id_grupo = 2
   AND t.id_usuario = 1
 ORDER BY t.data_lancamento, t.id_transacao;

-- -----------------------------------------------------------------------------
-- Q6 - Participacao do juri: quem foi convocado e quem de fato votou.
-- Evidencia sem quorum por falta de voto e o maior risco do produto.
-- -----------------------------------------------------------------------------
SELECT u.apelido,
       COUNT(*)                                       AS convocacoes,
       COUNT(j.voto)                                  AS votos_dados,
       ROUND(100.0 * COUNT(j.voto) / COUNT(*), 1)     AS pct_participacao,
       COUNT(*) FILTER (WHERE j.voto = 'VALIDO')      AS votou_valido,
       COUNT(*) FILTER (WHERE j.voto = 'INVALIDO')    AS votou_invalido
  FROM jurado_evidencia j
  JOIN usuario u ON u.id_usuario = j.id_usuario
 GROUP BY u.apelido
 ORDER BY pct_participacao DESC, convocacoes DESC, u.apelido;

-- -----------------------------------------------------------------------------
-- Q7 - Integridade contabil por grupo.
-- Todo CP do grupo esta em algum lugar: na conta de um membro ou retido num
-- desafio (escrow). Logo, a soma do ledger = saldos materializados + escrow.
-- Divergencia diferente de zero e bug de contabilidade (RN24).
-- -----------------------------------------------------------------------------
SELECT g.nome                                                       AS grupo,
       (SELECT COUNT(*) FROM membro_grupo m WHERE m.id_grupo = g.id_grupo)
                                                                    AS membros,
       (SELECT COALESCE(SUM(t.valor), 0) FROM transacao_cp t
         WHERE t.id_grupo = g.id_grupo)                             AS soma_ledger,
       (SELECT COALESCE(SUM(m.saldo_cp), 0) FROM membro_grupo m
         WHERE m.id_grupo = g.id_grupo)                             AS saldos_membros,
       (SELECT COALESCE(SUM(t.valor), 0) FROM transacao_cp t
         WHERE t.id_grupo = g.id_grupo AND t.id_usuario IS NULL)    AS cp_em_escrow,
       (SELECT COALESCE(SUM(t.valor), 0) FROM transacao_cp t
         WHERE t.id_grupo = g.id_grupo)
     - (SELECT COALESCE(SUM(m.saldo_cp), 0) FROM membro_grupo m
         WHERE m.id_grupo = g.id_grupo)
     - (SELECT COALESCE(SUM(t.valor), 0) FROM transacao_cp t
         WHERE t.id_grupo = g.id_grupo AND t.id_usuario IS NULL)    AS divergencia
  FROM grupo_amigos g
 ORDER BY g.id_grupo;

-- -----------------------------------------------------------------------------
-- Q8 - Desafios em aberto com prazo nos proximos 30 dias.
-- Usa o indice idx_desafio_data_limite. ABERTA que vence sem os dois
-- duelistas e cancelada automaticamente (RN21).
-- -----------------------------------------------------------------------------
SELECT d.id_desafio,
       d.titulo,
       g.nome                             AS grupo,
       d.status,
       d.data_limite,
       d.data_limite - CURRENT_TIMESTAMP  AS tempo_restante,
       u.apelido                          AS criador,
       COUNT(p.id_participante)           AS participantes
  FROM desafio d
  JOIN grupo_amigos g              ON g.id_grupo   = d.id_grupo
  JOIN usuario u                   ON u.id_usuario = d.id_criador
  LEFT JOIN participante_desafio p ON p.id_desafio = d.id_desafio
 WHERE d.status IN ('ABERTA', 'EM_ANDAMENTO')
   AND d.data_limite BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '30 days'
 GROUP BY d.id_desafio, d.titulo, g.nome, d.status, d.data_limite, u.apelido
 ORDER BY d.data_limite;

-- -----------------------------------------------------------------------------
-- Q9 - Moderacao por IA: taxa de recusa por nivel de filtro (RN27, RN28).
-- Agrupa pelo nivel COPIADO na avaliacao, nao pelo nivel atual do grupo: se o
-- admin trocar o nivel depois, o historico continua correto.
-- -----------------------------------------------------------------------------
SELECT m.nivel_filtro,
       COUNT(*)                                           AS avaliacoes,
       COUNT(*) FILTER (WHERE m.aprovado)                 AS aprovadas,
       COUNT(*) FILTER (WHERE NOT m.aprovado)             AS recusadas,
       ROUND(100.0 * COUNT(*) FILTER (WHERE NOT m.aprovado) / COUNT(*), 1)
                                                          AS pct_recusa
  FROM moderacao_desafio m
 GROUP BY m.nivel_filtro
 ORDER BY pct_recusa;

-- Q9b - As propostas recusadas, com o motivo dado pela IA. Nenhuma virou desafio.
SELECT g.nome         AS grupo,
       m.nivel_filtro,
       u.apelido      AS propos,
       m.titulo,
       m.motivo
  FROM moderacao_desafio m
  JOIN grupo_amigos g ON g.id_grupo   = m.id_grupo
  JOIN usuario u      ON u.id_usuario = m.id_criador
 WHERE NOT m.aprovado
 ORDER BY m.nivel_filtro, g.nome;

-- -----------------------------------------------------------------------------
-- Q10 - Faixa etaria por grupo e o nivel de filtro escolhido (RN26, RN27).
-- Idade calculada na consulta a partir de data_nascimento - nao e armazenada,
-- porque mudaria todo dia. Ninguem fica abaixo de 16: o trigger impede.
-- -----------------------------------------------------------------------------
SELECT g.nome                                                         AS grupo,
       g.nivel_filtro,
       COUNT(*)                                                       AS membros,
       MIN(EXTRACT(YEAR FROM age(CURRENT_DATE, u.data_nascimento)))::int AS idade_minima,
       MAX(EXTRACT(YEAR FROM age(CURRENT_DATE, u.data_nascimento)))::int AS idade_maxima,
       ROUND(AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, u.data_nascimento))), 1) AS idade_media,
       COUNT(*) FILTER (WHERE age(CURRENT_DATE, u.data_nascimento) < INTERVAL '18 years')
                                                                      AS menores_de_18
  FROM grupo_amigos g
  JOIN membro_grupo m ON m.id_grupo   = g.id_grupo
  JOIN usuario u      ON u.id_usuario = m.id_usuario
 GROUP BY g.id_grupo, g.nome, g.nivel_filtro
 ORDER BY g.id_grupo;

-- =============================================================================
-- Analise de desempenho
-- =============================================================================
-- Plano da Q8, para mostrar o uso do indice:
--
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT * FROM desafio
--    WHERE status IN ('ABERTA','EM_ANDAMENTO')
--      AND data_limite < CURRENT_TIMESTAMP + INTERVAL '30 days';
--
-- O plano usa idx_desafio_data_limite (Index Scan) mesmo com poucas linhas: o
-- filtro de status e o proprio predicado do indice parcial.
-- =============================================================================
