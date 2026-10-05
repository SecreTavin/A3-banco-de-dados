-- =============================================================================
-- Procedures da economia de CP - Eu Duvido! (modelo v3)
-- =============================================================================
-- Toda movimentacao de CP passa por aqui. Regra invariante: o ledger e
-- append-only e o saldo materializado em membro_grupo sempre bate com a soma
-- dos lancamentos do membro (vw_reconciliacao_saldo vazia - ADR 0007).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Lancamento primitivo. Escreve no ledger e atualiza o saldo materializado na
-- mesma transacao - os dois nunca divergem.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE lancar(
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
    INSERT INTO transacao_cp
        (id_grupo, id_usuario, id_aposta, tipo, valor, descricao)
    VALUES
        (p_id_grupo, p_id_usuario, p_id_aposta, p_tipo, p_valor, p_descricao);

    -- Conta da aposta nao tem saldo materializado - e derivada do ledger.
    IF p_id_usuario IS NOT NULL THEN
        UPDATE membro_grupo
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
CREATE OR REPLACE PROCEDURE debitar_escrow(
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
      FROM aposta
     WHERE id_aposta = p_id_aposta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aposta % nao encontrada', p_id_aposta;
    END IF;

    CALL lancar(v_id_grupo, p_id_usuario, p_id_aposta,
        'APOSTA_ESCROW', -v_valor_cp, 'Entrada na aposta: ' || v_titulo);

    CALL lancar(v_id_grupo, NULL, p_id_aposta,
        'APOSTA_ESCROW', v_valor_cp, 'Escrow recebido de participante');
END;
$$;

-- -----------------------------------------------------------------------------
-- Recompensa por votar em evidencia que atingiu quorum (RN17).
-- Valor pequeno e fixo - o CP vem do sistema, e a unica entrada de CP novo
-- alem do credito inicial. So recebe quem efetivamente votou (voto preenchido).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE creditar_recompensa_voto(
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
        SELECT id_usuario FROM jurado_evidencia
         WHERE id_evidencia = p_id_evidencia
           AND voto IS NOT NULL
    LOOP
        CALL lancar(p_id_grupo, v_votante.id_usuario, NULL,
            'RECOMPENSA_VOTO', c_recompensa, 'Participacao na validacao');
    END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- Encerramento: distribui o pote entre quem acertou.
-- p_cumpriu = TRUE  -> ganham os que escolheram VAI_CUMPRIR
-- p_cumpriu = FALSE -> ganham os que escolheram NAO_VAI_CUMPRIR
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE encerrar_aposta(
    p_id_aposta INT,
    p_cumpriu   BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_grupo       INT;
    v_status         VARCHAR(30);
    v_escolha_vence  VARCHAR(20);
    v_pote           INT;
    v_n_vencedores   INT;
    v_premio         INT;
    v_resto          INT;
    v_vencedor       RECORD;
    v_primeiro       BOOLEAN := TRUE;
BEGIN
    SELECT id_grupo, status
      INTO v_id_grupo, v_status
      FROM aposta
     WHERE id_aposta = p_id_aposta
       FOR UPDATE;

    -- Ja encerrada: idempotente.
    IF v_status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') THEN
        RETURN;
    END IF;

    v_escolha_vence := CASE WHEN p_cumpriu THEN 'VAI_CUMPRIR' ELSE 'NAO_VAI_CUMPRIR' END;

    SELECT COALESCE(SUM(valor), 0) INTO v_pote
      FROM transacao_cp
     WHERE id_aposta = p_id_aposta AND id_usuario IS NULL;

    SELECT COUNT(*) INTO v_n_vencedores
      FROM participante_aposta
     WHERE id_aposta = p_id_aposta AND escolha = v_escolha_vence;

    IF v_n_vencedores > 0 AND v_pote > 0 THEN
        -- CP e inteiro: o resto da divisao vai para o primeiro vencedor,
        -- para que a soma dos premios seja exatamente o pote (RN23).
        v_premio := v_pote / v_n_vencedores;
        v_resto  := v_pote - (v_premio * v_n_vencedores);

        FOR v_vencedor IN
            SELECT id_usuario FROM participante_aposta
             WHERE id_aposta = p_id_aposta AND escolha = v_escolha_vence
             ORDER BY id_participante
        LOOP
            CALL lancar(v_id_grupo, v_vencedor.id_usuario, p_id_aposta,
                'PREMIO', v_premio + CASE WHEN v_primeiro THEN v_resto ELSE 0 END,
                'Premio da aposta');
            v_primeiro := FALSE;
        END LOOP;

        CALL lancar(v_id_grupo, NULL, p_id_aposta,
            'PREMIO', -v_pote, 'Pote distribuido aos vencedores');
    END IF;

    UPDATE aposta
       SET status = CASE WHEN p_cumpriu THEN 'FINALIZADA_CUMPRIU'
                                        ELSE 'FINALIZADA_PERDEU' END,
           data_encerramento = CURRENT_TIMESTAMP
     WHERE id_aposta = p_id_aposta;
END;
$$;

-- -----------------------------------------------------------------------------
-- Cancelamento: estorna o escrow para cada participante (RN12).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE cancelar_aposta(
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
      FROM aposta
     WHERE id_aposta = p_id_aposta
       FOR UPDATE;

    IF v_status IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') THEN
        RETURN;
    END IF;

    FOR v_participante IN
        SELECT id_usuario FROM participante_aposta
         WHERE id_aposta = p_id_aposta
    LOOP
        CALL lancar(v_id_grupo, v_participante.id_usuario, p_id_aposta,
            'ESTORNO', v_valor_cp, 'Estorno por cancelamento');
        CALL lancar(v_id_grupo, NULL, p_id_aposta,
            'ESTORNO', -v_valor_cp, 'Estorno devolvido ao participante');
    END LOOP;

    UPDATE aposta
       SET status = 'CANCELADA',
           motivo_cancelamento = p_motivo,
           data_encerramento = CURRENT_TIMESTAMP
     WHERE id_aposta = p_id_aposta;
END;
$$;

-- -----------------------------------------------------------------------------
-- Saida do grupo (RN25): o saldo de quem sai deixa de circular no grupo.
-- O ledger e append-only, entao o historico fica - e um lancamento SAIDA_GRUPO
-- zera a conta. Sem ele, quem voltasse ao grupo ganharia 100 CP novos por cima
-- do historico antigo e a reconciliacao acusaria divergencia.
--
-- Recusa a saida enquanto o membro participa de aposta em curso ou integra
-- juri de votacao aberta: a liquidacao pagaria CP a quem ja nao e membro e
-- lancar() abortaria a apuracao inteira.
-- Essas recusas usam o SQLSTATE proprio EUD01, para a API distingui-las de
-- erro real.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE remover_membro(
    p_id_grupo   INT,
    p_id_usuario INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_saldo INT;
BEGIN
    SELECT saldo_cp INTO v_saldo
      FROM membro_grupo
     WHERE id_grupo = p_id_grupo AND id_usuario = p_id_usuario
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario % nao e membro do grupo %', p_id_usuario, p_id_grupo;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM participante_aposta p
          JOIN aposta a ON a.id_aposta = p.id_aposta
         WHERE a.id_grupo = p_id_grupo
           AND p.id_usuario = p_id_usuario
           AND a.status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO'))
    THEN
        RAISE EXCEPTION 'Usuario % participa de aposta em curso no grupo %',
            p_id_usuario, p_id_grupo
            USING ERRCODE = 'EUD01';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM jurado_evidencia j
          JOIN evidencia e ON e.id_evidencia = j.id_evidencia
          JOIN aposta a    ON a.id_aposta = e.id_aposta
         WHERE a.id_grupo = p_id_grupo
           AND j.id_usuario = p_id_usuario
           AND e.status = 'EM_VOTACAO')
    THEN
        RAISE EXCEPTION 'Usuario % integra juri de votacao aberta no grupo %',
            p_id_usuario, p_id_grupo
            USING ERRCODE = 'EUD01';
    END IF;

    IF v_saldo <> 0 THEN
        CALL lancar(p_id_grupo, p_id_usuario, NULL,
            'SAIDA_GRUPO', -v_saldo, 'Saida do grupo');
    END IF;

    DELETE FROM membro_grupo
     WHERE id_grupo = p_id_grupo AND id_usuario = p_id_usuario;
END;
$$;
