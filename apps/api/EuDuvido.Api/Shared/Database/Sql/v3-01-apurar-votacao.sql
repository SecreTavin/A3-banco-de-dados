-- =============================================================================
-- Procedure de apuracao de votacao - Eu Duvido! (modelo v3)
-- =============================================================================
-- Coracao do sistema. Decide se uma evidencia foi aceita ou recusada e, quando
-- isso encerra o desafio, transfere o CP do escrow para o vencedor.
--
-- Roda INTEIRA em uma transacao: ou tudo acontece, ou nada acontece. Nao existe
-- estado em que a evidencia foi aceita mas o CP nao foi pago (ADR 0003).
--
-- Juri e voto vivem na mesma tabela (jurado_evidencia, ADR 0016): cada linha e
-- um jurado congelado no envio; voto nulo = ainda nao votou.
--
-- Chamada pela aplicacao apos cada voto:  CALL apurar_votacao(:id);
-- E tambem pelo BackgroundService ao expirar o prazo.
-- =============================================================================

CREATE OR REPLACE PROCEDURE apurar_votacao(p_id_evidencia INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_desafio        INT;
    v_status_evidencia VARCHAR(20);
    v_data_limite      TIMESTAMPTZ;
    v_ordem            INT;
    v_total_jurados    INT;
    v_quorum           INT;
    v_total_votos      INT;
    v_votos_validos    INT;
    v_votos_invalidos  INT;
    v_expirou          BOOLEAN;
    v_novo_status      VARCHAR(20);
    v_recusadas        INT;
    v_id_grupo         INT;
BEGIN
    -- Trava a evidencia: dois votos simultaneos nao podem apurar em paralelo.
    SELECT e.id_desafio, e.status, e.data_limite_votacao, e.ordem, a.id_grupo
      INTO v_id_desafio, v_status_evidencia, v_data_limite, v_ordem, v_id_grupo
      FROM evidencia e
      JOIN desafio a ON a.id_desafio = e.id_desafio
     WHERE e.id_evidencia = p_id_evidencia
       FOR UPDATE OF e;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evidencia % nao encontrada', p_id_evidencia;
    END IF;

    -- Ja apurada: nada a fazer. Idempotente por design.
    IF v_status_evidencia <> 'EM_VOTACAO' THEN
        RETURN;
    END IF;

    -- Quorum sobre o juri congelado, nunca sobre o grupo atual (RN14).
    -- count(voto) ignora nulos: conta so quem ja votou.
    SELECT COUNT(*),
           COUNT(voto),
           COUNT(*) FILTER (WHERE voto = 'VALIDO'),
           COUNT(*) FILTER (WHERE voto = 'INVALIDO')
      INTO v_total_jurados, v_total_votos, v_votos_validos, v_votos_invalidos
      FROM jurado_evidencia
     WHERE id_evidencia = p_id_evidencia;

    v_quorum  := floor(v_total_jurados / 2.0) + 1;
    v_expirou := CURRENT_TIMESTAMP > v_data_limite;

    -- ---------------------------------------------------------------------
    -- Decisao (RN15, RN16)
    -- ---------------------------------------------------------------------
    IF v_votos_validos >= v_quorum THEN
        v_novo_status := 'ACEITA';
    ELSIF v_votos_invalidos >= v_quorum THEN
        v_novo_status := 'RECUSADA';
    ELSIF v_expirou THEN
        -- Prazo estourou sem maioria - inclui o caso de empate (RN16).
        v_novo_status := CASE WHEN v_total_votos = 0 THEN 'EXPIRADA' ELSE 'RECUSADA' END;
    ELSE
        -- Sem quorum e dentro do prazo: segue em votacao. Empate mantem aberto.
        RETURN;
    END IF;

    UPDATE evidencia
       SET status = v_novo_status,
           data_apuracao = CURRENT_TIMESTAMP
     WHERE id_evidencia = p_id_evidencia;

    -- RN17: quem votou em evidencia que atingiu quorum ganha CP.
    -- Nao paga em EXPIRADA (ninguem votou) nem por voto individual - so quando
    -- a decisao coletiva se concretizou, para nao incentivar voto sem analise.
    IF v_novo_status IN ('ACEITA', 'RECUSADA') AND v_total_votos > 0 THEN
        CALL creditar_recompensa_voto(p_id_evidencia, v_id_grupo);
    END IF;

    -- ---------------------------------------------------------------------
    -- Encerramento do desafio
    -- ---------------------------------------------------------------------
    IF v_novo_status = 'ACEITA' THEN
        CALL encerrar_desafio(v_id_desafio, TRUE);
    ELSE
        -- RN10: 3 recusadas OU a 5a evidencia esgotada encerra contra o desafiado.
        SELECT COUNT(*) INTO v_recusadas
          FROM evidencia
         WHERE id_desafio = v_id_desafio
           AND status IN ('RECUSADA', 'EXPIRADA');

        IF v_recusadas >= 3 OR v_ordem >= 5 THEN
            CALL encerrar_desafio(v_id_desafio, FALSE);
        END IF;
    END IF;
END;
$$;

COMMENT ON PROCEDURE apurar_votacao(INT) IS
    'Apura uma evidencia e, se for o caso, encerra o desafio. Idempotente: chamar de novo em evidencia ja apurada nao faz nada. Usa FOR UPDATE para serializar votos concorrentes.';
