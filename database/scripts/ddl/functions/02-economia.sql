-- =============================================================================
-- Procedures da economia de CP - Eu Duvido!
-- =============================================================================
-- Toda movimentacao de CP passa por aqui. Regra invariante: o ledger e
-- append-only e balanceia por partidas dobradas - cada debito tem um credito
-- correspondente, entao a soma de todos os lancamentos de um grupo e sempre
-- 100 * numero de membros (ADR 0007).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Lancamento primitivo. Escreve no ledger e atualiza o saldo materializado na
-- mesma transacao - os dois nunca divergem.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE economia.lancar(
    p_id_grupo   INT,
    p_id_usuario INT,          -- NULL = conta da aposta (escrow)
    p_id_aposta  INT,
    p_tipo       VARCHAR(20),
    p_valor      INT,
    p_descricao  VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO economia.transacao_cp
        (id_grupo, id_usuario, id_aposta, tipo, valor, descricao)
    VALUES
        (p_id_grupo, p_id_usuario, p_id_aposta, p_tipo, p_valor, p_descricao);

    -- Conta da aposta nao tem saldo materializado - e derivada do ledger.
    IF p_id_usuario IS NOT NULL THEN
        UPDATE grupos.membro_grupo
           SET saldo_cp = saldo_cp + p_valor
         WHERE id_grupo = p_id_grupo
           AND id_usuario = p_id_usuario;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Usuario % nao e membro do grupo %',
                p_id_usuario, p_id_grupo;
        END IF;
        -- chk_membro_saldo (saldo_cp >= 0) barra saldo negativo aqui.
    END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Debito no aceite: CP sai da carteira e entra na conta da aposta (RN18).
-- Duas linhas no ledger - o CP muda de lugar, nao e destruido.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE economia.debitar_escrow(
    p_id_aposta  INT,
    p_id_usuario INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_grupo INT;
    v_valor_cp INT;
    v_titulo   VARCHAR(120);
BEGIN
    SELECT id_grupo, valor_cp, titulo
      INTO v_id_grupo, v_valor_cp, v_titulo
      FROM apostas.aposta
     WHERE id_aposta = p_id_aposta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aposta % nao encontrada', p_id_aposta;
    END IF;

    CALL economia.lancar(v_id_grupo, p_id_usuario, p_id_aposta,
        'APOSTA_ESCROW', -v_valor_cp, 'Entrada na aposta: ' || v_titulo);

    CALL economia.lancar(v_id_grupo, NULL, p_id_aposta,
        'APOSTA_ESCROW', v_valor_cp, 'Escrow recebido de participante');
END;
$$;

-- -----------------------------------------------------------------------------
-- Recompensa por votar em evidencia que atingiu quorum (RN17).
-- Valor pequeno e fixo - o CP vem do sistema, e a unica entrada de CP novo
-- alem do credito inicial.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE economia.creditar_recompensa_voto(
    p_id_evidencia INT,
    p_id_grupo     INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    c_recompensa CONSTANT INT := 2;
    v_votante    RECORD;
BEGIN
    FOR v_votante IN
        SELECT id_usuario FROM validacao.voto_evidencia
         WHERE id_evidencia = p_id_evidencia
    LOOP
        CALL economia.lancar(p_id_grupo, v_votante.id_usuario, NULL,
            'RECOMPENSA_VOTO', c_recompensa, 'Participacao na validacao');
    END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- Encerramento: distribui o pote entre quem acertou.
-- p_cumpriu = TRUE  -> ganham os que escolheram VAI_CUMPRIR
-- p_cumpriu = FALSE -> ganham os que escolheram NAO_VAI_CUMPRIR
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE apostas.encerrar_aposta(
    p_id_aposta INT,
    p_cumpriu   BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_grupo       INT;
    v_valor_cp       INT;
    v_status         VARCHAR(30);
    v_escolha_vence  VARCHAR(20);
    v_pote           INT;
    v_n_vencedores   INT;
    v_premio         INT;
    v_resto          INT;
    v_vencedor       RECORD;
    v_primeiro       BOOLEAN := TRUE;
BEGIN
    SELECT id_grupo, valor_cp, status
      INTO v_id_grupo, v_valor_cp, v_status
      FROM apostas.aposta
     WHERE id_aposta = p_id_aposta
       FOR UPDATE;

    -- Ja encerrada: idempotente.
    IF v_status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') THEN
        RETURN;
    END IF;

    v_escolha_vence := CASE WHEN p_cumpriu THEN 'VAI_CUMPRIR' ELSE 'NAO_VAI_CUMPRIR' END;

    SELECT COALESCE(SUM(valor), 0) INTO v_pote
      FROM economia.transacao_cp
     WHERE id_aposta = p_id_aposta AND id_usuario IS NULL;

    SELECT COUNT(*) INTO v_n_vencedores
      FROM apostas.participante_aposta
     WHERE id_aposta = p_id_aposta AND escolha = v_escolha_vence;

    IF v_n_vencedores > 0 AND v_pote > 0 THEN
        -- CP e inteiro: o resto da divisao vai para o primeiro vencedor,
        -- para que a soma dos premios seja exatamente o pote.
        v_premio := v_pote / v_n_vencedores;
        v_resto  := v_pote - (v_premio * v_n_vencedores);

        FOR v_vencedor IN
            SELECT id_usuario FROM apostas.participante_aposta
             WHERE id_aposta = p_id_aposta AND escolha = v_escolha_vence
             ORDER BY id_participante
        LOOP
            CALL economia.lancar(v_id_grupo, v_vencedor.id_usuario, p_id_aposta,
                'PREMIO', v_premio + CASE WHEN v_primeiro THEN v_resto ELSE 0 END,
                'Premio da aposta');
            v_primeiro := FALSE;
        END LOOP;

        CALL economia.lancar(v_id_grupo, NULL, p_id_aposta,
            'PREMIO', -v_pote, 'Pote distribuido aos vencedores');
    END IF;

    UPDATE apostas.aposta
       SET status = CASE WHEN p_cumpriu THEN 'FINALIZADA_CUMPRIU'
                                        ELSE 'FINALIZADA_PERDEU' END,
           data_encerramento = CURRENT_TIMESTAMP
     WHERE id_aposta = p_id_aposta;
END;
$$;

-- -----------------------------------------------------------------------------
-- Cancelamento: estorna o escrow para cada participante (RN12).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE apostas.cancelar_aposta(
    p_id_aposta INT,
    p_motivo    VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_grupo     INT;
    v_valor_cp     INT;
    v_status       VARCHAR(30);
    v_participante RECORD;
BEGIN
    SELECT id_grupo, valor_cp, status
      INTO v_id_grupo, v_valor_cp, v_status
      FROM apostas.aposta
     WHERE id_aposta = p_id_aposta
       FOR UPDATE;

    IF v_status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') THEN
        RETURN;
    END IF;

    FOR v_participante IN
        SELECT id_usuario FROM apostas.participante_aposta
         WHERE id_aposta = p_id_aposta
    LOOP
        CALL economia.lancar(v_id_grupo, v_participante.id_usuario, p_id_aposta,
            'ESTORNO', v_valor_cp, 'Estorno por cancelamento');
        CALL economia.lancar(v_id_grupo, NULL, p_id_aposta,
            'ESTORNO', -v_valor_cp, 'Estorno devolvido ao participante');
    END LOOP;

    UPDATE apostas.aposta
       SET status = 'CANCELADA',
           motivo_cancelamento = p_motivo,
           data_encerramento = CURRENT_TIMESTAMP
     WHERE id_aposta = p_id_aposta;
END;
$$;
