using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations;

/// <summary>
/// Alinha o banco ao modelo v3 (ADR 0016) e cria a auditoria da verificacao de
/// prova por IA (ADR 0017). Incremental de proposito: preserva usuarios,
/// grupos, apostas, votos e o ledger de qualquer ambiente onde a API ja rodou.
/// O EF roda a migration inteira numa transacao - ou tudo, ou nada.
/// </summary>
public partial class AlinhamentoModeloV3 : Migration
{
    private static readonly string[] Arquivos =
    [
        "01-apurar-votacao.sql",
        "02-economia.sql",
        "03-triggers-e-views.sql"
    ];

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1. Procedures, triggers e views do modelo anterior citam tabelas por
        //    schema e as tabelas validador/voto, que deixam de existir. Saem
        //    antes e voltam reescritas no passo 9.
        migrationBuilder.Sql(
            """
            DROP VIEW IF EXISTS economia.vw_cp_em_escrow;
            DROP VIEW IF EXISTS economia.vw_escrow_orfao;
            DROP VIEW IF EXISTS economia.vw_reconciliacao_saldo;
            DROP VIEW IF EXISTS validacao.vw_status_votacao;

            DROP TRIGGER IF EXISTS trg_membro_credito_inicial ON grupos.membro_grupo;
            DROP TRIGGER IF EXISTS trg_transacao_cp_imutavel ON economia.transacao_cp;
            DROP TRIGGER IF EXISTS trg_voto_evidencia_valida ON validacao.voto_evidencia;

            DROP FUNCTION IF EXISTS grupos.trg_credito_inicial();
            DROP FUNCTION IF EXISTS economia.trg_ledger_imutavel();
            DROP FUNCTION IF EXISTS validacao.trg_valida_voto();

            DROP PROCEDURE IF EXISTS validacao.apurar_votacao;
            DROP PROCEDURE IF EXISTS apostas.cancelar_aposta;
            DROP PROCEDURE IF EXISTS apostas.encerrar_aposta;
            DROP PROCEDURE IF EXISTS economia.creditar_recompensa_voto;
            DROP PROCEDURE IF EXISTS economia.debitar_escrow;
            DROP PROCEDURE IF EXISTS economia.lancar;
            """);

        // 2. Fora do escopo do modelo v3: convite, comentario, credencial,
        //    notificacao e push (ADR 0016).
        migrationBuilder.Sql(
            """
            DROP TABLE identidade.credencial_usuario;
            DROP TABLE grupos.convite_grupo;
            DROP TABLE apostas.comentario_aposta;
            DROP TABLE notificacoes.notificacao;
            DROP TABLE notificacoes.push_subscription;
            """);

        // 3. Schema unico: as tabelas que ficam vao para public. SET SCHEMA leva
        //    junto indices, constraints e a sequence da identity.
        migrationBuilder.Sql(
            """
            ALTER TABLE identidade.usuario          SET SCHEMA public;
            ALTER TABLE grupos.grupo_amigos         SET SCHEMA public;
            ALTER TABLE grupos.membro_grupo         SET SCHEMA public;
            ALTER TABLE apostas.categoria_desafio   SET SCHEMA public;
            ALTER TABLE apostas.aposta              SET SCHEMA public;
            ALTER TABLE apostas.participante_aposta SET SCHEMA public;
            ALTER TABLE validacao.evidencia         SET SCHEMA public;
            ALTER TABLE economia.transacao_cp       SET SCHEMA public;
            """);

        // 4. Juri e voto numa tabela so. Cada jurado congelado vira uma linha;
        //    o voto, se existia, vem junto. Jurado sem voto fica com voto nulo.
        migrationBuilder.Sql(
            """
            CREATE TABLE jurado_evidencia (
                id_evidencia  integer NOT NULL,
                id_usuario    integer NOT NULL,
                voto          character varying(20),
                justificativa character varying(255),
                data_voto     timestamp with time zone,
                CONSTRAINT pk_jurado_evidencia PRIMARY KEY (id_evidencia, id_usuario),
                CONSTRAINT chk_jurado_voto CHECK (voto IN ('VALIDO', 'INVALIDO')),
                CONSTRAINT chk_jurado_voto_data CHECK ((voto IS NULL) = (data_voto IS NULL)),
                CONSTRAINT fk_jurado_evidencia FOREIGN KEY (id_evidencia)
                    REFERENCES evidencia (id_evidencia) ON DELETE CASCADE,
                CONSTRAINT fk_jurado_usuario FOREIGN KEY (id_usuario)
                    REFERENCES usuario (id_usuario) ON DELETE RESTRICT
            );

            CREATE INDEX idx_jurado_usuario ON jurado_evidencia (id_usuario);

            INSERT INTO jurado_evidencia (id_evidencia, id_usuario, voto, justificativa, data_voto)
            SELECT j.id_evidencia, j.id_usuario, v.voto, v.justificativa, v.data_voto
              FROM validacao.validador_evidencia j
              LEFT JOIN validacao.voto_evidencia v
                     ON v.id_evidencia = j.id_evidencia
                    AND v.id_usuario   = j.id_usuario;

            DROP TABLE validacao.voto_evidencia;
            DROP TABLE validacao.validador_evidencia;
            """);

        // 5. Com as tabelas fora, os schemas de modulo ficam vazios. Sem CASCADE:
        //    se sobrar algo inesperado, a migration falha em vez de apagar.
        migrationBuilder.Sql(
            """
            DROP SCHEMA identidade;
            DROP SCHEMA grupos;
            DROP SCHEMA apostas;
            DROP SCHEMA validacao;
            DROP SCHEMA economia;
            DROP SCHEMA notificacoes;
            """);

        // 6. Colunas novas do modelo v3.
        //    data_nascimento (RN26): nula, preenchida, e so entao NOT NULL - o
        //    backfill da a quem ja existia 18 anos na data do cadastro, valor
        //    que passa no trigger de idade minima e e marcado como estimado no
        //    registro desta migration.
        //    descricao_recompensa (RN02): valor_monetario e descricao_prenda
        //    viram um texto so, ja que nenhum calculo os usava (ADR 0006).
        migrationBuilder.Sql(
            """
            ALTER TABLE usuario ADD COLUMN data_nascimento date;
            UPDATE usuario SET data_nascimento = (data_cadastro - INTERVAL '18 years')::date;
            ALTER TABLE usuario ALTER COLUMN data_nascimento SET NOT NULL;

            ALTER TABLE grupo_amigos
                ADD COLUMN nivel_filtro character varying(10) NOT NULL DEFAULT 'MODERADO';
            ALTER TABLE grupo_amigos
                ADD CONSTRAINT chk_grupo_nivel_filtro
                CHECK (nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO'));

            ALTER TABLE aposta ADD COLUMN descricao_recompensa character varying(255);
            UPDATE aposta
               SET descricao_recompensa = left(NULLIF(concat_ws(' - ',
                       'R$ ' || replace(to_char(valor_monetario, 'FM999999990.00'), '.', ','),
                       descricao_prenda), ''), 255);
            ALTER TABLE aposta DROP CONSTRAINT chk_aposta_valor;
            ALTER TABLE aposta DROP COLUMN valor_monetario;
            ALTER TABLE aposta DROP COLUMN descricao_prenda;
            """);

        // 7. Ledger: SAIDA_GRUPO zera o saldo de quem sai do grupo (RN25), para
        //    a reconciliacao continuar fechando se a pessoa voltar.
        migrationBuilder.Sql(
            """
            ALTER TABLE transacao_cp DROP CONSTRAINT chk_transacao_tipo;
            ALTER TABLE transacao_cp
                ADD CONSTRAINT chk_transacao_tipo
                CHECK (tipo IN ('CREDITO_INICIAL', 'APOSTA_ESCROW', 'PREMIO',
                                'ESTORNO', 'RECOMPENSA_VOTO', 'SAIDA_GRUPO'));
            """);

        // 8. Auditoria das duas IAs. Conteudo reprovado nao vira aposta nem
        //    evidencia, por isso as tabelas guardam o que foi avaliado e a FK
        //    para o resultado so e preenchida na aprovacao.
        migrationBuilder.Sql(
            """
            CREATE TABLE moderacao_desafio (
                id_moderacao   integer GENERATED BY DEFAULT AS IDENTITY,
                id_grupo       integer NOT NULL,
                id_criador     integer NOT NULL,
                id_aposta      integer,
                nivel_filtro   character varying(10) NOT NULL,
                titulo         character varying(120) NOT NULL,
                descricao      text NOT NULL,
                aprovado       boolean NOT NULL,
                motivo         character varying(500),
                data_avaliacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT pk_moderacao_desafio PRIMARY KEY (id_moderacao),
                CONSTRAINT chk_moderacao_nivel CHECK (nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO')),
                CONSTRAINT chk_moderacao_motivo CHECK (aprovado OR motivo IS NOT NULL),
                CONSTRAINT chk_moderacao_aposta CHECK (id_aposta IS NULL OR aprovado),
                CONSTRAINT fk_moderacao_grupo FOREIGN KEY (id_grupo)
                    REFERENCES grupo_amigos (id_grupo) ON DELETE CASCADE,
                CONSTRAINT fk_moderacao_criador FOREIGN KEY (id_criador)
                    REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
                CONSTRAINT fk_moderacao_aposta FOREIGN KEY (id_aposta)
                    REFERENCES aposta (id_aposta) ON DELETE SET NULL
            );

            CREATE INDEX idx_moderacao_grupo ON moderacao_desafio (id_grupo);
            CREATE INDEX idx_moderacao_criador ON moderacao_desafio (id_criador);
            CREATE UNIQUE INDEX unq_moderacao_aposta ON moderacao_desafio (id_aposta);

            CREATE TABLE verificacao_evidencia (
                id_verificacao  integer GENERATED BY DEFAULT AS IDENTITY,
                id_aposta       integer NOT NULL,
                id_usuario      integer NOT NULL,
                id_evidencia    integer,
                tipo_midia      character varying(20) NOT NULL,
                url_comprovante character varying(500) NOT NULL,
                comentario      text,
                aprovado        boolean NOT NULL,
                parecer         character varying(500) NOT NULL,
                data_avaliacao  timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT pk_verificacao_evidencia PRIMARY KEY (id_verificacao),
                CONSTRAINT chk_verificacao_midia CHECK (tipo_midia IN ('FOTO', 'VIDEO', 'LINK', 'TEXTO')),
                CONSTRAINT chk_verificacao_evidencia CHECK (id_evidencia IS NULL OR aprovado),
                CONSTRAINT fk_verificacao_aposta FOREIGN KEY (id_aposta)
                    REFERENCES aposta (id_aposta) ON DELETE CASCADE,
                CONSTRAINT fk_verificacao_usuario FOREIGN KEY (id_usuario)
                    REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
                CONSTRAINT fk_verificacao_evidencia FOREIGN KEY (id_evidencia)
                    REFERENCES evidencia (id_evidencia) ON DELETE SET NULL
            );

            CREATE INDEX idx_verificacao_aposta ON verificacao_evidencia (id_aposta);
            CREATE INDEX idx_verificacao_usuario ON verificacao_evidencia (id_usuario);
            CREATE UNIQUE INDEX unq_verificacao_evidencia ON verificacao_evidencia (id_evidencia);
            """);

        // 9. Procedures, triggers e views reescritas para o modelo v3. Mesmos
        //    arquivos de database/scripts/ddl/functions, embutidos no assembly
        //    porque o EF nao tem migrationBuilder.SqlFile().
        foreach (var arquivo in Arquivos)
            migrationBuilder.Sql(SqlEmbutido.Ler(arquivo));
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Sem volta automatica: as tabelas fora do escopo foram apagadas com os
        // dados, e valor_monetario/descricao_prenda viraram texto livre. Voltar
        // ao modelo anterior e restaurar o backup tirado antes do deploy.
        throw new NotSupportedException(
            "AlinhamentoModeloV3 nao e reversivel: restaure o backup anterior a migration.");
    }
}
