using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations
{
    /// <summary>
    /// Alinha o banco ao modelo v3 do documento 11 (ADR 0016): dez tabelas no
    /// schema public, juri e voto numa tabela so, idade minima, nivel de filtro
    /// e moderacao de desafios por IA (ADR 0015).
    ///
    /// Parte do estado deixado por RenomeiaApostaParaDesafio (ADR 0017) e e
    /// escrita a mao pelo mesmo motivo dela: o diff que o EF gera derruba e recria
    /// tabelas. Aqui as tabelas que ficam mudam de schema com SET SCHEMA, que leva
    /// junto linhas, indices, constraints e a sequence da identity. O EF roda a
    /// migration inteira numa transacao: ou tudo, ou nada.
    ///
    /// Procedures, triggers e views citam schema e tabelas no corpo do texto, entao
    /// saem antes e voltam no fim a partir de Sql/v3-*.sql (copias de
    /// database/scripts/ddl/functions/*.sql). Os Sql/01..03 e v2-* continuam
    /// congelados: as migrations anteriores ainda os leem.
    /// </summary>
    public partial class AlinhamentoModeloV3 : Migration
    {
        private static readonly string[] ArquivosV3 =
        [
            "v3-01-apurar-votacao.sql",
            "v3-02-economia.sql",
            "v3-03-triggers-e-views.sql"
        ];

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Remove o que cita schema e tabelas por texto.
            migrationBuilder.Sql("""
                DROP VIEW IF EXISTS economia.vw_cp_em_escrow;
                DROP VIEW IF EXISTS economia.vw_escrow_orfao;
                DROP VIEW IF EXISTS economia.vw_reconciliacao_saldo;
                DROP VIEW IF EXISTS validacao.vw_status_votacao;
                DROP TRIGGER IF EXISTS trg_membro_credito_inicial ON grupos.membro_grupo;
                DROP TRIGGER IF EXISTS trg_transacao_cp_imutavel ON economia.transacao_cp;
                DROP TRIGGER IF EXISTS trg_voto_evidencia_valida ON validacao.voto_evidencia;
                DROP FUNCTION IF EXISTS grupos.trg_credito_inicial;
                DROP FUNCTION IF EXISTS economia.trg_ledger_imutavel;
                DROP FUNCTION IF EXISTS validacao.trg_valida_voto;
                DROP PROCEDURE IF EXISTS validacao.apurar_votacao;
                DROP PROCEDURE IF EXISTS desafios.encerrar_desafio;
                DROP PROCEDURE IF EXISTS desafios.cancelar_desafio;
                DROP PROCEDURE IF EXISTS economia.creditar_recompensa_voto;
                DROP PROCEDURE IF EXISTS economia.debitar_escrow;
                DROP PROCEDURE IF EXISTS economia.lancar;
                """);

            // 2. Fora do escopo do modelo v3 (ADR 0016): credencial (o login e
            //    externo, RN05), convite (o ADMIN adiciona pelo e-mail, RN25),
            //    comentario, notificacao e push.
            migrationBuilder.Sql("""
                DROP TABLE identidade.credencial_usuario;
                DROP TABLE grupos.convite_grupo;
                DROP TABLE desafios.comentario_desafio;
                DROP TABLE notificacoes.notificacao;
                DROP TABLE notificacoes.push_subscription;
                """);

            // 3. Schema unico. As tabelas que ficam vao para public com as linhas.
            migrationBuilder.Sql("""
                ALTER TABLE identidade.usuario             SET SCHEMA public;
                ALTER TABLE grupos.grupo_amigos            SET SCHEMA public;
                ALTER TABLE grupos.membro_grupo            SET SCHEMA public;
                ALTER TABLE desafios.categoria_desafio     SET SCHEMA public;
                ALTER TABLE desafios.desafio               SET SCHEMA public;
                ALTER TABLE desafios.participante_desafio  SET SCHEMA public;
                ALTER TABLE validacao.evidencia            SET SCHEMA public;
                ALTER TABLE economia.transacao_cp          SET SCHEMA public;
                """);

            // 4. Juri e voto numa tabela so (RN04, RN14). Cada validador congelado
            //    vira uma linha; o voto, se existia, vem junto. Quem nao votou fica
            //    com voto nulo.
            migrationBuilder.Sql("""
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

            // 5. Os schemas de modulo ficaram vazios. Sem CASCADE: se sobrar algo
            //    inesperado, a migration falha em vez de apagar.
            migrationBuilder.Sql("""
                DROP SCHEMA identidade;
                DROP SCHEMA grupos;
                DROP SCHEMA desafios;
                DROP SCHEMA validacao;
                DROP SCHEMA economia;
                DROP SCHEMA notificacoes;
                """);

            // 6. Colunas do modelo v3.
            //    data_nascimento (RN26): nula, preenchida, e so entao NOT NULL (ADR
            //    0015). Quem ja existia recebe 18 anos antes da data do cadastro -
            //    valor estimado, que passa no trigger de idade minima.
            //    nivel_filtro (RN27): padrao MODERADO.
            //    descricao_recompensa (RN02): valor_monetario e descricao_prenda
            //    viram um texto so, ja que nenhum calculo os usava (ADR 0006).
            migrationBuilder.Sql("""
                ALTER TABLE usuario ADD COLUMN data_nascimento date;
                UPDATE usuario SET data_nascimento = (data_cadastro - INTERVAL '18 years')::date;
                ALTER TABLE usuario ALTER COLUMN data_nascimento SET NOT NULL;

                ALTER TABLE grupo_amigos
                    ADD COLUMN nivel_filtro character varying(10) NOT NULL DEFAULT 'MODERADO';
                ALTER TABLE grupo_amigos
                    ADD CONSTRAINT chk_grupo_nivel_filtro
                    CHECK (nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO'));

                ALTER TABLE desafio ADD COLUMN descricao_recompensa character varying(255);
                UPDATE desafio
                   SET descricao_recompensa = left(NULLIF(concat_ws(' - ',
                           'R$ ' || replace(to_char(valor_monetario, 'FM999999990.00'), '.', ','),
                           descricao_prenda), ''), 255);
                ALTER TABLE desafio DROP CONSTRAINT chk_desafio_valor;
                ALTER TABLE desafio DROP COLUMN valor_monetario;
                ALTER TABLE desafio DROP COLUMN descricao_prenda;
                """);

            // 7. Ledger: os cinco tipos do documento 11, o legado APOSTA_ESCROW (so
            //    leitura, ADR 0017) e SAIDA_GRUPO, que zera o saldo de quem sai do
            //    grupo para a RN24 continuar valendo (RN25). chk_transacao_escrow ja
            //    cobre DESAFIO_ESCROW e APOSTA_ESCROW desde a migration anterior.
            migrationBuilder.Sql("""
                ALTER TABLE transacao_cp DROP CONSTRAINT chk_transacao_tipo;
                ALTER TABLE transacao_cp ADD CONSTRAINT chk_transacao_tipo
                    CHECK (tipo IN ('CREDITO_INICIAL', 'DESAFIO_ESCROW', 'APOSTA_ESCROW', 'PREMIO',
                                    'ESTORNO', 'RECOMPENSA_VOTO', 'SAIDA_GRUPO'));
                """);

            // 8. Auditoria da moderacao por IA (RN28). Proposta reprovada nao vira
            //    desafio, por isso a tabela guarda o texto avaliado e id_desafio so
            //    e preenchido na aprovacao.
            migrationBuilder.Sql("""
                CREATE TABLE moderacao_desafio (
                    id_moderacao   integer GENERATED BY DEFAULT AS IDENTITY,
                    id_grupo       integer NOT NULL,
                    id_criador     integer NOT NULL,
                    id_desafio     integer,
                    nivel_filtro   character varying(10) NOT NULL,
                    titulo         character varying(120) NOT NULL,
                    descricao      text NOT NULL,
                    aprovado       boolean NOT NULL,
                    motivo         character varying(500),
                    data_avaliacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT pk_moderacao_desafio PRIMARY KEY (id_moderacao),
                    CONSTRAINT chk_moderacao_nivel CHECK (nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO')),
                    CONSTRAINT chk_moderacao_motivo CHECK (aprovado OR motivo IS NOT NULL),
                    CONSTRAINT chk_moderacao_desafio CHECK (id_desafio IS NULL OR aprovado),
                    CONSTRAINT fk_moderacao_grupo FOREIGN KEY (id_grupo)
                        REFERENCES grupo_amigos (id_grupo) ON DELETE CASCADE,
                    CONSTRAINT fk_moderacao_criador FOREIGN KEY (id_criador)
                        REFERENCES usuario (id_usuario) ON DELETE RESTRICT,
                    CONSTRAINT fk_moderacao_desafio FOREIGN KEY (id_desafio)
                        REFERENCES desafio (id_desafio) ON DELETE SET NULL
                );

                CREATE INDEX idx_moderacao_grupo ON moderacao_desafio (id_grupo);
                CREATE INDEX idx_moderacao_criador ON moderacao_desafio (id_criador);
                CREATE UNIQUE INDEX unq_moderacao_desafio ON moderacao_desafio (id_desafio);
                """);

            // 9. Procedures, triggers e views do modelo v3.
            foreach (var arquivo in ArquivosV3)
                migrationBuilder.Sql(SqlEmbutido.Ler(arquivo));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Sem volta automatica: credencial, convite, comentario e notificacao
            // foram apagados com os dados, e valor_monetario/descricao_prenda
            // viraram texto livre. Voltar ao modelo anterior e restaurar o backup
            // tirado antes do deploy.
            throw new NotSupportedException(
                "AlinhamentoModeloV3 nao e reversivel: restaure o backup anterior a migration.");
        }
    }
}
