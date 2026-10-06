-- =============================================================================
-- Triggers de invariante e views analiticas - Eu Duvido!
-- =============================================================================
-- Triggers guardam o que NUNCA pode ser violado, mesmo por acesso direto ao
-- banco. A aplicacao tambem valida, mas o banco e a ultima linha de defesa.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RN19: so se vota em evidencia que esta EM_VOTACAO e dentro do prazo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validacao.trg_valida_voto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status      VARCHAR(20);
    v_data_limite TIMESTAMPTZ;
BEGIN
    SELECT status, data_limite_votacao
      INTO v_status, v_data_limite
      FROM validacao.evidencia
     WHERE id_evidencia = NEW.id_evidencia;

    IF v_status <> 'EM_VOTACAO' THEN
        RAISE EXCEPTION 'Evidencia % nao esta em votacao (status: %)',
            NEW.id_evidencia, v_status;
    END IF;

    IF CURRENT_TIMESTAMP > v_data_limite THEN
        RAISE EXCEPTION 'Prazo de votacao da evidencia % expirou em %',
            NEW.id_evidencia, v_data_limite;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_voto_evidencia_valida
    BEFORE INSERT ON validacao.voto_evidencia
    FOR EACH ROW EXECUTE FUNCTION validacao.trg_valida_voto();

-- -----------------------------------------------------------------------------
-- O ledger e append-only: nenhum UPDATE, nenhum DELETE, nunca.
-- Estorno e um lancamento novo. Isso e o que torna a reconciliacao confiavel.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION economia.trg_ledger_imutavel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'transacao_cp e append-only: % nao e permitido. Lance um ESTORNO.',
        TG_OP;
END;
$$;

CREATE TRIGGER trg_transacao_cp_imutavel
    BEFORE UPDATE OR DELETE ON economia.transacao_cp
    FOR EACH ROW EXECUTE FUNCTION economia.trg_ledger_imutavel();

-- -----------------------------------------------------------------------------
-- RN20: novo membro entra com 100 CP, lancados no ledger.
-- Garante que o saldo inicial tambem obedece a contabilidade.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION grupos.trg_credito_inicial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO economia.transacao_cp
        (id_grupo, id_usuario, id_desafio, tipo, valor, descricao)
    VALUES
        (NEW.id_grupo, NEW.id_usuario, NULL, 'CREDITO_INICIAL',
         NEW.saldo_cp, 'Credito inicial de entrada no grupo');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_membro_credito_inicial
    AFTER INSERT ON grupos.membro_grupo
    FOR EACH ROW EXECUTE FUNCTION grupos.trg_credito_inicial();

-- =============================================================================
-- VIEWS ANALITICAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reconciliacao: prova que o saldo materializado bate com o ledger.
-- Se esta view retornar QUALQUER linha, ha um bug de contabilidade.
-- Usada como caso de teste (documento 17) e como painel no Grafana.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW economia.vw_reconciliacao_saldo AS
SELECT m.id_grupo,
       m.id_usuario,
       u.apelido,
       m.saldo_cp                    AS saldo_materializado,
       COALESCE(SUM(t.valor), 0)     AS saldo_ledger,
       m.saldo_cp - COALESCE(SUM(t.valor), 0) AS divergencia
  FROM grupos.membro_grupo m
  JOIN identidade.usuario u ON u.id_usuario = m.id_usuario
  LEFT JOIN economia.transacao_cp t
         ON t.id_grupo   = m.id_grupo
        AND t.id_usuario = m.id_usuario
 GROUP BY m.id_grupo, m.id_usuario, u.apelido, m.saldo_cp
HAVING m.saldo_cp <> COALESCE(SUM(t.valor), 0);

COMMENT ON VIEW economia.vw_reconciliacao_saldo IS
    'Deve estar SEMPRE vazia. Cada linha e uma divergencia entre o saldo materializado e o ledger - ou seja, um bug.';

-- -----------------------------------------------------------------------------
-- Estado ao vivo de cada votacao: quantos votaram, quanto falta para o quorum.
-- Alimenta a Central de Votacao e o painel do Grafana.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW validacao.vw_status_votacao AS
SELECT e.id_evidencia,
       e.id_desafio,
       a.titulo                AS desafio,
       a.id_grupo,
       e.status,
       e.ordem,
       e.data_limite_votacao,
       COUNT(DISTINCT val.id_usuario)                          AS total_validadores,
       floor(COUNT(DISTINCT val.id_usuario) / 2.0) + 1         AS quorum,
       COUNT(DISTINCT v.id_usuario)                            AS total_votos,
       COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'VALIDO')   AS votos_favoraveis,
       COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'INVALIDO') AS votos_contra,
       GREATEST(
           (floor(COUNT(DISTINCT val.id_usuario) / 2.0) + 1)
           - GREATEST(
               COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'VALIDO'),
               COUNT(DISTINCT v.id_usuario) FILTER (WHERE v.voto = 'INVALIDO')
             ), 0)                                             AS votos_faltantes
  FROM validacao.evidencia e
  JOIN desafios.desafio a  ON a.id_desafio = e.id_desafio
  LEFT JOIN validacao.validador_evidencia val ON val.id_evidencia = e.id_evidencia
  LEFT JOIN validacao.voto_evidencia v        ON v.id_evidencia   = e.id_evidencia
 GROUP BY e.id_evidencia, e.id_desafio, a.titulo, a.id_grupo,
          e.status, e.ordem, e.data_limite_votacao;

-- -----------------------------------------------------------------------------
-- Escrow orfao: desafio encerrado com CP ainda preso na conta dele.
-- Deve estar SEMPRE vazia. A reconciliacao de saldo nao pega este caso, porque
-- compara saldo do usuario contra o ledger do usuario e ignora a conta do
-- desafio - foi assim que um pote nao distribuido passou despercebido no seed.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW economia.vw_escrow_orfao AS
SELECT a.id_desafio,
       a.titulo,
       a.status,
       SUM(t.valor) AS cp_preso
  FROM desafios.desafio a
  JOIN economia.transacao_cp t
    ON t.id_desafio = a.id_desafio AND t.id_usuario IS NULL
 WHERE a.status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')
 GROUP BY a.id_desafio, a.titulo, a.status
HAVING SUM(t.valor) <> 0;

COMMENT ON VIEW economia.vw_escrow_orfao IS
    'Deve estar SEMPRE vazia. Cada linha e um pote que ficou preso num desafio ja encerrado - CP que sumiu de circulacao.';

-- -----------------------------------------------------------------------------
-- CP preso em desafios abertos, por grupo. Painel do Grafana.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW economia.vw_cp_em_escrow AS
SELECT a.id_grupo,
       g.nome                    AS grupo,
       COUNT(DISTINCT a.id_desafio) AS desafios_abertas,
       COALESCE(SUM(t.valor), 0)   AS cp_em_escrow
  FROM desafios.desafio a
  JOIN grupos.grupo_amigos g ON g.id_grupo = a.id_grupo
  LEFT JOIN economia.transacao_cp t
         ON t.id_desafio = a.id_desafio AND t.id_usuario IS NULL
 WHERE a.status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO')
 GROUP BY a.id_grupo, g.nome;
