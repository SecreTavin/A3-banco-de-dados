-- =============================================================================
-- DDL - Eu Duvido!
-- =============================================================================
-- SGBD alvo: PostgreSQL 16+
--
-- Organizacao: um schema por modulo do monolito modular (ADR 0005).
-- Chaves estrangeiras atravessam schemas: a separacao e logica, a integridade
-- referencial e garantida pelo banco.
--
-- ATENCAO: este arquivo e GERADO a partir das migrations do EF Core (ADR 0004).
-- Nao edite manualmente. Regenere com:
--   dotnet ef migrations script --idempotent --output database/scripts/ddl/schema.sql
-- Objetos que o EF nao gera (procedures, triggers, views) vivem em
-- database/scripts/ddl/functions/ e sao aplicados por migration.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS identidade;
CREATE SCHEMA IF NOT EXISTS grupos;
CREATE SCHEMA IF NOT EXISTS apostas;
CREATE SCHEMA IF NOT EXISTS validacao;
CREATE SCHEMA IF NOT EXISTS economia;
CREATE SCHEMA IF NOT EXISTS notificacoes;

-- =============================================================================
-- MODULO: IDENTIDADE
-- =============================================================================

CREATE TABLE identidade.usuario (
    id_usuario    SERIAL PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    apelido       VARCHAR(50)  NOT NULL,
    avatar_url    VARCHAR(500),
    data_cadastro TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN identidade.usuario.apelido IS
    'Nao e UNIQUE - a identidade e o email/id do provedor (tela 22).';
COMMENT ON COLUMN identidade.usuario.avatar_url IS
    'Preenchido com a foto do Google no primeiro login. Upload proprio fora do MVP.';

-- Credenciais externalizadas: o sistema nao tem senha propria (RN05).
-- A tabela ja comporta login por senha no futuro sem alterar `usuario`.
CREATE TABLE identidade.credencial_usuario (
    id_credencial SERIAL PRIMARY KEY,
    id_usuario    INT          NOT NULL,
    provedor      VARCHAR(20)  NOT NULL,
    id_externo    VARCHAR(255) NOT NULL,
    segredo_hash  VARCHAR(255),
    data_vinculo  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credencial_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_credencial_provedor CHECK (provedor IN ('GOOGLE', 'SENHA')),
    CONSTRAINT unq_credencial_provedor UNIQUE (provedor, id_externo),
    CONSTRAINT unq_credencial_usuario_provedor UNIQUE (id_usuario, provedor),
    -- GOOGLE nunca tem segredo; SENHA sempre tem.
    CONSTRAINT chk_credencial_segredo CHECK (
        (provedor = 'GOOGLE' AND segredo_hash IS NULL) OR
        (provedor = 'SENHA'  AND segredo_hash IS NOT NULL)
    )
);

COMMENT ON COLUMN identidade.credencial_usuario.id_externo IS
    'Para GOOGLE: o claim `sub` do OIDC (identificador estavel). Para SENHA: o email.';

-- =============================================================================
-- MODULO: GRUPOS
-- =============================================================================

CREATE TABLE grupos.grupo_amigos (
    id_grupo     SERIAL PRIMARY KEY,
    nome         VARCHAR(80) NOT NULL,
    descricao    VARCHAR(255),
    id_criador   INT         NOT NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grupo_criador FOREIGN KEY (id_criador)
        REFERENCES identidade.usuario(id_usuario)
);

CREATE TABLE grupos.membro_grupo (
    id_membro    SERIAL PRIMARY KEY,
    id_grupo     INT         NOT NULL,
    id_usuario   INT         NOT NULL,
    papel        VARCHAR(20) NOT NULL DEFAULT 'MEMBRO',
    saldo_cp     INT         NOT NULL DEFAULT 100,
    data_entrada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_membro_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupos.grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_membro_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_membro_papel CHECK (papel IN ('ADMIN', 'MEMBRO')),
    -- RN08: saldo nunca negativo. Garante que ninguem aposta CP que nao tem.
    CONSTRAINT chk_membro_saldo CHECK (saldo_cp >= 0),
    CONSTRAINT unq_membro_grupo UNIQUE (id_grupo, id_usuario)
);

COMMENT ON COLUMN grupos.membro_grupo.saldo_cp IS
    'Saldo materializado (ADR 0007). Fonte da verdade e economia.transacao_cp; esta coluna e atualizada na mesma transacao e reconciliada pela view economia.vw_reconciliacao_saldo. Todo membro entra com 100 CP (RN06).';

-- Convite por codigo, uso unico e rastreavel (tela 23).
CREATE TABLE grupos.convite_grupo (
    id_convite      SERIAL PRIMARY KEY,
    id_grupo        INT         NOT NULL,
    codigo          CHAR(6)     NOT NULL UNIQUE,
    id_criador      INT         NOT NULL,
    data_criacao    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao  TIMESTAMPTZ NOT NULL,
    id_usado_por    INT,
    data_uso        TIMESTAMPTZ,
    CONSTRAINT fk_convite_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupos.grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_convite_criador FOREIGN KEY (id_criador)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT fk_convite_usado_por FOREIGN KEY (id_usado_por)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT chk_convite_expiracao CHECK (data_expiracao > data_criacao),
    -- Uso e um evento unico: ou tem os dois campos, ou nenhum.
    CONSTRAINT chk_convite_uso CHECK (
        (id_usado_por IS NULL     AND data_uso IS NULL) OR
        (id_usado_por IS NOT NULL AND data_uso IS NOT NULL)
    )
);

COMMENT ON COLUMN grupos.convite_grupo.codigo IS
    'Alfabeto sem caracteres ambiguos (sem 0/O, 1/I/L) - o codigo e ditado em voz alta.';

-- =============================================================================
-- MODULO: APOSTAS
-- =============================================================================

CREATE TABLE apostas.categoria_desafio (
    id_categoria SERIAL PRIMARY KEY,
    nome         VARCHAR(50) NOT NULL UNIQUE,
    descricao    VARCHAR(200)
);

CREATE TABLE apostas.aposta (
    id_aposta        SERIAL PRIMARY KEY,
    id_grupo         INT          NOT NULL,
    id_criador       INT          NOT NULL,
    id_categoria     INT          NOT NULL,
    titulo           VARCHAR(120) NOT NULL,
    descricao        TEXT         NOT NULL,
    valor_cp         INT          NOT NULL,
    tipo_recompensa  VARCHAR(20)  NOT NULL,
    valor_monetario  DECIMAL(10,2),
    descricao_prenda VARCHAR(255),
    data_criacao     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_limite      TIMESTAMPTZ  NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'ABERTA',
    motivo_cancelamento VARCHAR(255),
    data_encerramento   TIMESTAMPTZ,
    CONSTRAINT fk_aposta_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupos.grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_aposta_criador FOREIGN KEY (id_criador)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT fk_aposta_categoria FOREIGN KEY (id_categoria)
        REFERENCES apostas.categoria_desafio(id_categoria),
    -- RN01
    CONSTRAINT chk_aposta_tipo CHECK (
        tipo_recompensa IN ('MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO')),
    -- RN02: descritivo, nunca transacional (ADR 0006).
    CONSTRAINT chk_aposta_valor CHECK (valor_monetario IS NULL OR valor_monetario > 0),
    -- RN07: toda aposta custa CP, inclusive as de prenda.
    CONSTRAINT chk_aposta_valor_cp CHECK (valor_cp > 0),
    -- RN03
    CONSTRAINT chk_aposta_status CHECK (status IN (
        'ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO',
        'FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')),
    -- RN12: cancelamento exige motivo.
    CONSTRAINT chk_aposta_cancelamento CHECK (
        status <> 'CANCELADA' OR motivo_cancelamento IS NOT NULL),
    CONSTRAINT chk_aposta_encerramento CHECK (
        status NOT IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')
        OR data_encerramento IS NOT NULL)
);

COMMENT ON COLUMN apostas.aposta.valor_cp IS
    'Custo fixo em CP por participante (RN07). O pote e valor_cp * n_participantes.';
COMMENT ON COLUMN apostas.aposta.valor_monetario IS
    'DESCRITIVO apenas - registra o que foi combinado fora do app. Nenhum calculo do sistema le esta coluna (ADR 0006).';

CREATE TABLE apostas.participante_aposta (
    id_participante SERIAL PRIMARY KEY,
    id_aposta       INT         NOT NULL,
    id_usuario      INT         NOT NULL,
    papel_aposta    VARCHAR(20) NOT NULL,
    escolha         VARCHAR(20) NOT NULL,
    data_aceite     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participante_aposta FOREIGN KEY (id_aposta)
        REFERENCES apostas.aposta(id_aposta) ON DELETE CASCADE,
    CONSTRAINT fk_participante_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT chk_participante_papel CHECK (
        papel_aposta IN ('DESAFIANTE', 'DESAFIADO', 'APOSTADOR')),
    CONSTRAINT chk_participante_escolha CHECK (
        escolha IN ('VAI_CUMPRIR', 'NAO_VAI_CUMPRIR')),
    -- Um usuario, um papel por aposta. O DESAFIADO ja aposta em si mesmo
    -- via `escolha`, entao papel duplo seria redundante (tela 25, Q11).
    CONSTRAINT unq_participante_aposta UNIQUE (id_aposta, id_usuario)
);

-- RN09: exatamente 1 DESAFIANTE e 1 DESAFIADO por aposta.
-- Indice parcial unico: permite N APOSTADOR, no maximo 1 de cada papel unico.
CREATE UNIQUE INDEX unq_aposta_papel_unico
    ON apostas.participante_aposta (id_aposta, papel_aposta)
    WHERE papel_aposta IN ('DESAFIANTE', 'DESAFIADO');

-- Comentarios na aposta (substitui o modulo de chat - Q18).
CREATE TABLE apostas.comentario_aposta (
    id_comentario SERIAL PRIMARY KEY,
    id_aposta     INT         NOT NULL,
    id_usuario    INT         NOT NULL,
    texto         VARCHAR(500) NOT NULL,
    data_envio    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_aposta FOREIGN KEY (id_aposta)
        REFERENCES apostas.aposta(id_aposta) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT chk_comentario_texto CHECK (length(trim(texto)) > 0)
);

-- =============================================================================
-- MODULO: VALIDACAO
-- =============================================================================

CREATE TABLE validacao.evidencia (
    id_evidencia         SERIAL PRIMARY KEY,
    id_aposta            INT          NOT NULL,
    id_usuario           INT          NOT NULL,
    ordem                INT          NOT NULL,
    tipo_midia           VARCHAR(20)  NOT NULL,
    url_comprovante      VARCHAR(500) NOT NULL,
    comentario           TEXT,
    status               VARCHAR(20)  NOT NULL DEFAULT 'EM_VOTACAO',
    data_envio           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_limite_votacao  TIMESTAMPTZ  NOT NULL,
    data_apuracao        TIMESTAMPTZ,
    CONSTRAINT fk_evidencia_aposta FOREIGN KEY (id_aposta)
        REFERENCES apostas.aposta(id_aposta) ON DELETE CASCADE,
    CONSTRAINT fk_evidencia_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT chk_evidencia_midia CHECK (tipo_midia IN ('FOTO', 'VIDEO', 'LINK', 'TEXTO')),
    -- RN13: status da evidencia, escrito pela procedure de apuracao.
    CONSTRAINT chk_evidencia_status CHECK (
        status IN ('EM_VOTACAO', 'ACEITA', 'RECUSADA', 'EXPIRADA')),
    -- RN10: no maximo 5 evidencias por aposta.
    CONSTRAINT chk_evidencia_ordem CHECK (ordem BETWEEN 1 AND 5),
    CONSTRAINT unq_evidencia_ordem UNIQUE (id_aposta, ordem),
    CONSTRAINT chk_evidencia_votacao CHECK (data_limite_votacao > data_envio),
    CONSTRAINT chk_evidencia_apuracao CHECK (
        status = 'EM_VOTACAO' OR data_apuracao IS NOT NULL)
);

COMMENT ON COLUMN validacao.evidencia.url_comprovante IS
    'URL do objeto no R2. A linha so e criada APOS o upload confirmar (ADR 0009).';
COMMENT ON COLUMN validacao.evidencia.data_limite_votacao IS
    'Coluna explicita, nao derivada - permite prorrogar sem mudar codigo (RN11).';

-- Conjunto de validadores CONGELADO no momento em que a evidencia e enviada.
-- Sem isso, alguem entrando no grupo altera o quorum retroativamente e o
-- resultado da aposta muda sozinho (ADR 0008).
CREATE TABLE validacao.validador_evidencia (
    id_evidencia INT NOT NULL,
    id_usuario   INT NOT NULL,
    -- PK composta: a linha E a associacao, nao precisa de id artificial.
    -- Tambem e o alvo da FK composta em voto_evidencia.
    CONSTRAINT pk_validador_evidencia PRIMARY KEY (id_evidencia, id_usuario),
    CONSTRAINT fk_validador_evidencia FOREIGN KEY (id_evidencia)
        REFERENCES validacao.evidencia(id_evidencia) ON DELETE CASCADE,
    CONSTRAINT fk_validador_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario)
);

COMMENT ON TABLE validacao.validador_evidencia IS
    'Snapshot dos elegiveis a votar, gravado na transicao para EM_VOTACAO. Membros do grupo exceto DESAFIANTE e DESAFIADO (RN14). Quorum = floor(count/2) + 1 sobre estas linhas.';

CREATE TABLE validacao.voto_evidencia (
    id_voto       SERIAL PRIMARY KEY,
    id_evidencia  INT          NOT NULL,
    id_usuario    INT          NOT NULL,
    voto          VARCHAR(20)  NOT NULL,
    justificativa VARCHAR(255),
    data_voto     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_voto_evidencia FOREIGN KEY (id_evidencia)
        REFERENCES validacao.evidencia(id_evidencia) ON DELETE CASCADE,
    CONSTRAINT fk_voto_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT chk_voto_tipo CHECK (voto IN ('VALIDO', 'INVALIDO')),
    -- RN04: voto unico por usuario/evidencia.
    CONSTRAINT unq_voto_usuario UNIQUE (id_evidencia, id_usuario),
    -- RN14: so vota quem estava no snapshot de validadores.
    CONSTRAINT fk_voto_validador FOREIGN KEY (id_evidencia, id_usuario)
        REFERENCES validacao.validador_evidencia(id_evidencia, id_usuario)
);

-- =============================================================================
-- MODULO: ECONOMIA (CP)
-- =============================================================================

-- Ledger append-only. Nunca sofre UPDATE nem DELETE.
-- Estorno e um lancamento novo, nao a remocao do original.
CREATE TABLE economia.transacao_cp (
    id_transacao SERIAL PRIMARY KEY,
    id_grupo     INT          NOT NULL,
    id_usuario   INT,
    id_aposta    INT,
    tipo         VARCHAR(20)  NOT NULL,
    valor        INT          NOT NULL,
    descricao    VARCHAR(255) NOT NULL,
    data_lancamento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transacao_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupos.grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_transacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario),
    CONSTRAINT fk_transacao_aposta FOREIGN KEY (id_aposta)
        REFERENCES apostas.aposta(id_aposta),
    CONSTRAINT chk_transacao_tipo CHECK (tipo IN (
        'CREDITO_INICIAL',   -- 100 CP na entrada do grupo
        'APOSTA_ESCROW',     -- debito do participante -> conta da aposta
        'PREMIO',            -- conta da aposta -> vencedor
        'ESTORNO',           -- conta da aposta -> participantes (cancelamento)
        'RECOMPENSA_VOTO'    -- credito por votar em evidencia que atingiu quorum
    )),
    CONSTRAINT chk_transacao_valor CHECK (valor <> 0),
    -- Lancamento na conta da aposta tem id_usuario NULL; na conta do
    -- usuario tem id_usuario preenchido. Toda transacao pertence a uma das duas.
    CONSTRAINT chk_transacao_conta CHECK (
        id_usuario IS NOT NULL OR id_aposta IS NOT NULL),
    CONSTRAINT chk_transacao_escrow CHECK (
        tipo <> 'APOSTA_ESCROW' OR id_aposta IS NOT NULL)
);

COMMENT ON TABLE economia.transacao_cp IS
    'Ledger append-only de partidas dobradas (ADR 0007). Todo debito tem um credito correspondente: a soma de todos os lancamentos de um grupo e sempre 100 * numero de membros. Ver economia.vw_reconciliacao_saldo.';
COMMENT ON COLUMN economia.transacao_cp.id_usuario IS
    'NULL quando o lancamento e da conta da aposta (escrow), nao de um usuario.';
COMMENT ON COLUMN economia.transacao_cp.valor IS
    'Positivo = credito, negativo = debito. Nunca zero.';

-- =============================================================================
-- MODULO: NOTIFICACOES
-- =============================================================================

CREATE TABLE notificacoes.notificacao (
    id_notificacao SERIAL PRIMARY KEY,
    id_usuario     INT          NOT NULL,
    tipo           VARCHAR(30)  NOT NULL,
    titulo         VARCHAR(120) NOT NULL,
    corpo          VARCHAR(255) NOT NULL,
    url_destino    VARCHAR(255),
    data_criacao   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_leitura   TIMESTAMPTZ,
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_notificacao_tipo CHECK (tipo IN (
        'PRAZO_VENCENDO', 'EVIDENCIA_ENVIADA', 'VOTACAO_ABERTA',
        'APOSTA_ENCERRADA', 'CONVITE_ACEITO'))
);

COMMENT ON TABLE notificacoes.notificacao IS
    'Persistida sempre. O Web Push e apenas o transporte - quem perdeu o push ve a notificacao aqui ao abrir o app.';

-- Inscricoes de Web Push (VAPID). Um usuario pode ter varios dispositivos.
CREATE TABLE notificacoes.push_subscription (
    id_subscription SERIAL PRIMARY KEY,
    id_usuario      INT          NOT NULL,
    endpoint        VARCHAR(500) NOT NULL UNIQUE,
    chave_p256dh    VARCHAR(255) NOT NULL,
    chave_auth      VARCHAR(255) NOT NULL,
    data_criacao    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_uso TIMESTAMPTZ,
    CONSTRAINT fk_push_usuario FOREIGN KEY (id_usuario)
        REFERENCES identidade.usuario(id_usuario) ON DELETE CASCADE
);

-- =============================================================================
-- INDICES
-- =============================================================================

CREATE INDEX idx_credencial_usuario   ON identidade.credencial_usuario(id_usuario);
CREATE INDEX idx_membro_usuario       ON grupos.membro_grupo(id_usuario);
CREATE INDEX idx_convite_grupo        ON grupos.convite_grupo(id_grupo);
CREATE INDEX idx_aposta_grupo         ON apostas.aposta(id_grupo);
CREATE INDEX idx_aposta_status        ON apostas.aposta(status);
CREATE INDEX idx_aposta_data_limite   ON apostas.aposta(data_limite)
    WHERE status IN ('ABERTA', 'EM_ANDAMENTO');
CREATE INDEX idx_participante_usuario ON apostas.participante_aposta(id_usuario);
CREATE INDEX idx_comentario_aposta    ON apostas.comentario_aposta(id_aposta);
CREATE INDEX idx_evidencia_aposta     ON validacao.evidencia(id_aposta);
CREATE INDEX idx_evidencia_pendente   ON validacao.evidencia(data_limite_votacao)
    WHERE status = 'EM_VOTACAO';
CREATE INDEX idx_voto_evidencia       ON validacao.voto_evidencia(id_evidencia);
CREATE INDEX idx_transacao_conta      ON economia.transacao_cp(id_grupo, id_usuario);
CREATE INDEX idx_transacao_aposta     ON economia.transacao_cp(id_aposta);
CREATE INDEX idx_notificacao_nao_lida ON notificacoes.notificacao(id_usuario)
    WHERE data_leitura IS NULL;
