-- DDL Eu Duvido!
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    apelido VARCHAR(50) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grupo_amigos (
    id_grupo SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    descricao VARCHAR(255),
    id_criador INT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grupo_criador FOREIGN KEY (id_criador) REFERENCES usuario(id_usuario)
);

CREATE TABLE membro_grupo (
    id_membro SERIAL PRIMARY KEY,
    id_grupo INT NOT NULL,
    id_usuario INT NOT NULL,
    papel VARCHAR(20) DEFAULT 'MEMBRO' NOT NULL,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_membro_grupo FOREIGN KEY (id_grupo) REFERENCES grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_membro_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_membro_papel CHECK (papel IN ('ADMIN', 'MEMBRO')),
    CONSTRAINT unq_membro_grupo UNIQUE (id_grupo, id_usuario)
);

CREATE TABLE categoria_desafio (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(200)
);

CREATE TABLE aposta (
    id_aposta SERIAL PRIMARY KEY,
    id_grupo INT NOT NULL,
    id_criador INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_recompensa VARCHAR(20) NOT NULL,
    valor_monetario DECIMAL(10,2),
    descricao_prenda VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_limite TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'ABERTA' NOT NULL,
    CONSTRAINT fk_aposta_grupo FOREIGN KEY (id_grupo) REFERENCES grupo_amigos(id_grupo) ON DELETE CASCADE,
    CONSTRAINT fk_aposta_criador FOREIGN KEY (id_criador) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_aposta_categoria FOREIGN KEY (id_categoria) REFERENCES categoria_desafio(id_categoria),
    CONSTRAINT chk_aposta_tipo CHECK (tipo_recompensa IN ('MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO')),
    CONSTRAINT chk_aposta_valor CHECK (valor_monetario IS NULL OR valor_monetario > 0),
    CONSTRAINT chk_aposta_status CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO', 'FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA'))
);

CREATE TABLE participante_aposta (
    id_participante SERIAL PRIMARY KEY,
    id_aposta INT NOT NULL,
    id_usuario INT NOT NULL,
    papel_aposta VARCHAR(20) NOT NULL,
    escolha VARCHAR(20) NOT NULL,
    CONSTRAINT fk_participante_aposta FOREIGN KEY (id_aposta) REFERENCES aposta(id_aposta) ON DELETE CASCADE,
    CONSTRAINT fk_participante_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_participante_papel CHECK (papel_aposta IN ('DESAFIANTE', 'DESAFIADO', 'APOSTADOR')),
    CONSTRAINT chk_participante_escolha CHECK (escolha IN ('VAI_CUMPRIR', 'NAO_VAI_CUMPRIR')),
    CONSTRAINT unq_participante_aposta UNIQUE (id_aposta, id_usuario)
);

CREATE TABLE evidencia (
    id_evidencia SERIAL PRIMARY KEY,
    id_aposta INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_midia VARCHAR(20) NOT NULL,
    url_comprovante VARCHAR(255) NOT NULL,
    comentario TEXT,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidencia_aposta FOREIGN KEY (id_aposta) REFERENCES aposta(id_aposta) ON DELETE CASCADE,
    CONSTRAINT fk_evidencia_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_evidencia_midia CHECK (tipo_midia IN ('FOTO', 'VIDEO', 'LINK', 'TEXTO'))
);

CREATE TABLE voto_evidencia (
    id_voto SERIAL PRIMARY KEY,
    id_evidencia INT NOT NULL,
    id_usuario INT NOT NULL,
    voto VARCHAR(20) NOT NULL,
    justificativa VARCHAR(255),
    data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_voto_evidencia FOREIGN KEY (id_evidencia) REFERENCES evidencia(id_evidencia) ON DELETE CASCADE,
    CONSTRAINT fk_voto_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT chk_voto_tipo CHECK (voto IN ('VALIDO', 'INVALIDO')),
    CONSTRAINT unq_voto_usuario UNIQUE (id_evidencia, id_usuario)
);

CREATE INDEX idx_aposta_grupo ON aposta(id_grupo);
CREATE INDEX idx_aposta_status ON aposta(status);
CREATE INDEX idx_voto_evidencia ON voto_evidencia(id_evidencia);
