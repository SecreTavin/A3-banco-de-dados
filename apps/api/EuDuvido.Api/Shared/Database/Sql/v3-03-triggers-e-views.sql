-- =============================================================================
-- Triggers de invariante e views analiticas - Eu Duvido! (modelo v3)
-- =============================================================================
-- Triggers guardam o que NUNCA pode ser violado, mesmo por acesso direto ao
-- banco. A aplicacao tambem valida, mas o banco e a ultima linha de defesa.
--
-- Os DROP TRIGGER antes de cada CREATE deixam o script reaplicavel: ele e
-- executado por migration e tambem pode ser rodado a mao num banco de estudo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RN26: idade minima de 16 anos.
-- Trigger, nao CHECK: a regra depende de uma data de referencia e o PostgreSQL
-- so aceita expressao imutavel em CHECK. Compara com data_cadastro (e nao com
-- CURRENT_DATE) para a linha continuar valida em qualquer reavaliacao.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_valida_idade_minima()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.data_nascimento > (NEW.data_cadastro::date - INTERVAL '16 years')::date THEN
        RAISE EXCEPTION
            'Idade minima de 16 anos nao atingida: nascimento em %, cadastro em %',
            NEW.data_nascimento, NEW.data_cadastro::date
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuario_idade_minima ON usuario;
CREATE TRIGGER trg_usuario_idade_minima
    BEFORE INSERT OR UPDATE OF data_nascimento, data_cadastro ON usuario
    FOR EACH ROW EXECUTE FUNCTION trg_valida_idade_minima();

-- -----------------------------------------------------------------------------
-- Juri e voto em jurado_evidencia (RN04, RN14, RN19).
--
-- INSERT congela um jurado: nasce sem voto e nunca e parte do desafio
--        (DESAFIANTE e DESAFIADO nao julgam a propria disputa).
-- UPDATE registra o voto: so uma vez, so com a evidencia EM_VOTACAO e dentro
--        do prazo. Quem nao tem linha nao tem o que atualizar - e a PK que
--        garante "so vota quem esta no juri".
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_valida_jurado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status      VARCHAR(20);
    v_data_limite TIMESTAMPTZ;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.voto IS NOT NULL THEN
            RAISE EXCEPTION 'Jurado da evidencia % nasce sem voto: o voto e registrado depois',
                NEW.id_evidencia;
        END IF;

        IF EXISTS (
            SELECT 1
              FROM evidencia e
              JOIN participante_desafio p ON p.id_desafio = e.id_desafio
             WHERE e.id_evidencia = NEW.id_evidencia
               AND p.id_usuario = NEW.id_usuario
               AND p.papel_desafio IN ('DESAFIANTE', 'DESAFIADO'))
        THEN
            RAISE EXCEPTION 'Usuario % e parte do desafio e nao pode julgar a evidencia %',
                NEW.id_usuario, NEW.id_evidencia;
        END IF;

        RETURN NEW;
    END IF;

    IF OLD.voto IS NOT NULL THEN
        RAISE EXCEPTION 'Usuario % ja votou na evidencia %: voto e definitivo',
            OLD.id_usuario, OLD.id_evidencia;
    END IF;

    SELECT status, data_limite_votacao
      INTO v_status, v_data_limite
      FROM evidencia
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

DROP TRIGGER IF EXISTS trg_jurado_evidencia_valida ON jurado_evidencia;
CREATE TRIGGER trg_jurado_evidencia_valida
    BEFORE INSERT OR UPDATE ON jurado_evidencia
    FOR EACH ROW EXECUTE FUNCTION trg_valida_jurado();

-- -----------------------------------------------------------------------------
-- O ledger e append-only: nenhum UPDATE, nenhum DELETE, nunca (RN24).
-- Estorno e um lancamento novo. Isso e o que torna a reconciliacao confiavel.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_ledger_imutavel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'transacao_cp e append-only: % nao e permitido. Lance um ESTORNO.',
        TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_transacao_cp_imutavel ON transacao_cp;
CREATE TRIGGER trg_transacao_cp_imutavel
    BEFORE UPDATE OR DELETE ON transacao_cp
    FOR EACH ROW EXECUTE FUNCTION trg_ledger_imutavel();

-- -----------------------------------------------------------------------------
-- RN06: novo membro entra com 100 CP, lancados no ledger.
-- Garante que o saldo inicial tambem obedece a contabilidade.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_credito_inicial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO transacao_cp
        (id_grupo, id_usuario, id_desafio, tipo, valor, descricao)
    VALUES
        (NEW.id_grupo, NEW.id_usuario, NULL, 'CREDITO_INICIAL',
         NEW.saldo_cp, 'Credito inicial de entrada no grupo');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_membro_credito_inicial ON membro_grupo;
CREATE TRIGGER trg_membro_credito_inicial
    AFTER INSERT ON membro_grupo
    FOR EACH ROW EXECUTE FUNCTION trg_credito_inicial();

-- =============================================================================
-- VIEWS ANALITICAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reconciliacao: prova que o saldo materializado bate com o ledger.
-- Se esta view retornar QUALQUER linha, ha um bug de contabilidade.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_reconciliacao_saldo AS
SELECT m.id_grupo,
       m.id_usuario,
       u.apelido,
       m.saldo_cp                    AS saldo_materializado,
       COALESCE(SUM(t.valor), 0)     AS saldo_ledger,
       m.saldo_cp - COALESCE(SUM(t.valor), 0) AS divergencia
  FROM membro_grupo m
  JOIN usuario u ON u.id_usuario = m.id_usuario
  LEFT JOIN transacao_cp t
         ON t.id_grupo   = m.id_grupo
        AND t.id_usuario = m.id_usuario
 GROUP BY m.id_grupo, m.id_usuario, u.apelido, m.saldo_cp
HAVING m.saldo_cp <> COALESCE(SUM(t.valor), 0);

COMMENT ON VIEW vw_reconciliacao_saldo IS
    'Deve estar SEMPRE vazia. Cada linha e uma divergencia entre o saldo materializado e o ledger - ou seja, um bug.';

-- -----------------------------------------------------------------------------
-- Estado ao vivo de cada votacao: quantos votaram, quanto falta para o quorum.
-- Alimenta a Central de Votacao. total_validadores = linhas do juri congelado;
-- total_votos = linhas com voto preenchido.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_status_votacao AS
SELECT e.id_evidencia,
       e.id_desafio,
       a.titulo                                           AS desafio,
       a.id_grupo,
       e.status,
       e.ordem,
       e.data_limite_votacao,
       COUNT(j.id_usuario)                                AS total_validadores,
       floor(COUNT(j.id_usuario) / 2.0) + 1               AS quorum,
       COUNT(j.voto)                                      AS total_votos,
       COUNT(j.voto) FILTER (WHERE j.voto = 'VALIDO')     AS votos_favoraveis,
       COUNT(j.voto) FILTER (WHERE j.voto = 'INVALIDO')   AS votos_contra,
       GREATEST(
           (floor(COUNT(j.id_usuario) / 2.0) + 1)
           - GREATEST(
               COUNT(j.voto) FILTER (WHERE j.voto = 'VALIDO'),
               COUNT(j.voto) FILTER (WHERE j.voto = 'INVALIDO')
             ), 0)                                        AS votos_faltantes
  FROM evidencia e
  JOIN desafio a ON a.id_desafio = e.id_desafio
  LEFT JOIN jurado_evidencia j ON j.id_evidencia = e.id_evidencia
 GROUP BY e.id_evidencia, e.id_desafio, a.titulo, a.id_grupo,
          e.status, e.ordem, e.data_limite_votacao;

-- -----------------------------------------------------------------------------
-- Escrow orfao: desafio encerrado com CP ainda preso na conta dele.
-- Deve estar SEMPRE vazia. A reconciliacao de saldo nao pega este caso, porque
-- compara saldo do usuario contra o ledger do usuario e ignora a conta do
-- desafio - foi assim que um pote nao distribuido passou despercebido no seed.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_escrow_orfao AS
SELECT a.id_desafio,
       a.titulo,
       a.status,
       SUM(t.valor) AS cp_preso
  FROM desafio a
  JOIN transacao_cp t
    ON t.id_desafio = a.id_desafio AND t.id_usuario IS NULL
 WHERE a.status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')
 GROUP BY a.id_desafio, a.titulo, a.status
HAVING SUM(t.valor) <> 0;

COMMENT ON VIEW vw_escrow_orfao IS
    'Deve estar SEMPRE vazia. Cada linha e um pote que ficou preso num desafio ja encerrado - CP que sumiu de circulacao.';

-- -----------------------------------------------------------------------------
-- CP preso em desafios abertos, por grupo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_cp_em_escrow AS
SELECT a.id_grupo,
       g.nome                      AS grupo,
       COUNT(DISTINCT a.id_desafio) AS desafios_abertos,
       COALESCE(SUM(t.valor), 0)   AS cp_em_escrow
  FROM desafio a
  JOIN grupo_amigos g ON g.id_grupo = a.id_grupo
  LEFT JOIN transacao_cp t
         ON t.id_desafio = a.id_desafio AND t.id_usuario IS NULL
 WHERE a.status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO')
 GROUP BY a.id_grupo, g.nome;

-- -----------------------------------------------------------------------------
-- Moderacao por nivel de filtro (RN27, RN28): taxa de bloqueio de desafios.
-- Le o nivel copiado na avaliacao, nao o atual do grupo - o admin pode ter
-- mudado o nivel depois.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_moderacao_por_nivel AS
SELECT nivel_filtro,
       COUNT(*)                                   AS avaliacoes,
       COUNT(*) FILTER (WHERE NOT aprovado)       AS recusadas,
       round(100.0 * COUNT(*) FILTER (WHERE NOT aprovado) / COUNT(*), 1)
                                                  AS taxa_recusa_pct
  FROM moderacao_desafio
 GROUP BY nivel_filtro;
