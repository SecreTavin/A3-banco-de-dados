using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations
{
    /// <summary>
    /// Troca a palavra "aposta" por "desafio" em todo o banco.
    ///
    /// Escrita a mao de proposito: o diff que o EF gera para esta troca derruba
    /// e recria tabelas (perderia dados). Aqui tudo e RENAME, que preserva linhas.
    ///
    /// Procedures, triggers e views guardam o nome antigo no corpo do texto e nao
    /// acompanham o RENAME, entao sao removidas antes e recriadas no fim a partir
    /// de Sql/v2-*.sql (copias de database/scripts/ddl/functions/*.sql).
    /// Os arquivos Sql/01..03 continuam congelados: a migration
    /// ProceduresTriggersViews ainda os le para montar um banco do zero.
    /// </summary>
    public partial class RenomeiaApostaParaDesafio : Migration
    {
        private static readonly string[] ArquivosV2 =
        [
            "v2-01-apurar-votacao.sql",
            "v2-02-economia.sql",
            "v2-03-triggers-e-views.sql"
        ];

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Remove o que referencia o nome antigo por texto.
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
                DROP PROCEDURE IF EXISTS apostas.encerrar_aposta;
                DROP PROCEDURE IF EXISTS apostas.cancelar_aposta;
                DROP PROCEDURE IF EXISTS economia.creditar_recompensa_voto;
                DROP PROCEDURE IF EXISTS economia.debitar_escrow;
                DROP PROCEDURE IF EXISTS economia.lancar;
                """);

            // 2. Renomeia schema, tabelas e colunas.
            migrationBuilder.Sql("""
                ALTER SCHEMA apostas RENAME TO desafios;
                ALTER TABLE desafios.aposta RENAME TO desafio;
                ALTER TABLE desafios.comentario_aposta RENAME TO comentario_desafio;
                ALTER TABLE desafios.participante_aposta RENAME TO participante_desafio;

                ALTER TABLE desafios.desafio RENAME COLUMN id_aposta TO id_desafio;
                ALTER TABLE desafios.comentario_desafio RENAME COLUMN id_aposta TO id_desafio;
                ALTER TABLE desafios.participante_desafio RENAME COLUMN id_aposta TO id_desafio;
                ALTER TABLE desafios.participante_desafio RENAME COLUMN papel_aposta TO papel_desafio;
                ALTER TABLE validacao.evidencia RENAME COLUMN id_aposta TO id_desafio;
                ALTER TABLE economia.transacao_cp RENAME COLUMN id_aposta TO id_desafio;
                """);

            // 3. Renomeia constraints (PK, FK, CHECK) e indices.
            migrationBuilder.Sql("""
                ALTER TABLE desafios.desafio RENAME CONSTRAINT pk_aposta TO pk_desafio;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_cancelamento TO chk_desafio_cancelamento;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_encerramento TO chk_desafio_encerramento;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_status TO chk_desafio_status;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_tipo TO chk_desafio_tipo;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_valor TO chk_desafio_valor;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_aposta_valor_cp TO chk_desafio_valor_cp;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_aposta_categoria TO fk_desafio_categoria;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_aposta_criador TO fk_desafio_criador;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_aposta_grupo TO fk_desafio_grupo;

                ALTER TABLE desafios.comentario_desafio RENAME CONSTRAINT pk_comentario_aposta TO pk_comentario_desafio;
                ALTER TABLE desafios.comentario_desafio RENAME CONSTRAINT fk_comentario_aposta TO fk_comentario_desafio;

                ALTER TABLE desafios.participante_desafio RENAME CONSTRAINT pk_participante_aposta TO pk_participante_desafio;
                ALTER TABLE desafios.participante_desafio RENAME CONSTRAINT fk_participante_aposta TO fk_participante_desafio;

                ALTER TABLE validacao.evidencia RENAME CONSTRAINT fk_evidencia_aposta TO fk_evidencia_desafio;
                ALTER TABLE economia.transacao_cp RENAME CONSTRAINT fk_transacao_aposta TO fk_transacao_desafio;

                ALTER INDEX desafios.idx_aposta_data_limite RENAME TO idx_desafio_data_limite;
                ALTER INDEX desafios.idx_aposta_grupo RENAME TO idx_desafio_grupo;
                ALTER INDEX desafios.idx_aposta_status RENAME TO idx_desafio_status;
                ALTER INDEX desafios."IX_aposta_id_categoria" RENAME TO "IX_desafio_id_categoria";
                ALTER INDEX desafios."IX_aposta_id_criador" RENAME TO "IX_desafio_id_criador";
                ALTER INDEX desafios.idx_comentario_aposta RENAME TO idx_comentario_desafio;
                ALTER INDEX desafios."IX_comentario_aposta_id_usuario" RENAME TO "IX_comentario_desafio_id_usuario";
                ALTER INDEX desafios.unq_aposta_papel_unico RENAME TO unq_desafio_papel_unico;
                ALTER INDEX desafios.unq_participante_aposta RENAME TO unq_participante_desafio;
                ALTER INDEX validacao.idx_evidencia_aposta RENAME TO idx_evidencia_desafio;
                ALTER INDEX economia.idx_transacao_aposta RENAME TO idx_transacao_desafio;
                """);

            // 4. Valores de enumeracao dentro de CHECK.
            //    notificacao nao e ledger: pode ser atualizada.
            //    transacao_cp e append-only (trigger + ADR 0007): as linhas antigas
            //    com APOSTA_ESCROW nao sao reescritas, por isso o valor legado
            //    continua aceito e o novo entra ao lado.
            migrationBuilder.Sql("""
                ALTER TABLE notificacoes.notificacao DROP CONSTRAINT chk_notificacao_tipo;
                UPDATE notificacoes.notificacao SET tipo = 'DESAFIO_ENCERRADO' WHERE tipo = 'APOSTA_ENCERRADA';
                ALTER TABLE notificacoes.notificacao ADD CONSTRAINT chk_notificacao_tipo
                    CHECK (tipo IN ('PRAZO_VENCENDO', 'EVIDENCIA_ENVIADA', 'VOTACAO_ABERTA', 'DESAFIO_ENCERRADO', 'CONVITE_ACEITO'));

                ALTER TABLE economia.transacao_cp DROP CONSTRAINT chk_transacao_tipo;
                ALTER TABLE economia.transacao_cp ADD CONSTRAINT chk_transacao_tipo
                    CHECK (tipo IN ('CREDITO_INICIAL', 'DESAFIO_ESCROW', 'APOSTA_ESCROW', 'PREMIO', 'ESTORNO', 'RECOMPENSA_VOTO'));

                ALTER TABLE economia.transacao_cp DROP CONSTRAINT chk_transacao_escrow;
                ALTER TABLE economia.transacao_cp ADD CONSTRAINT chk_transacao_escrow
                    CHECK (tipo NOT IN ('DESAFIO_ESCROW', 'APOSTA_ESCROW') OR id_desafio IS NOT NULL);
                """);

            // 5. Recria procedures, triggers e views com os nomes novos.
            foreach (var arquivo in ArquivosV2)
                migrationBuilder.Sql(SqlEmbutido.Ler(arquivo));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

                ALTER TABLE economia.transacao_cp DROP CONSTRAINT chk_transacao_escrow;
                ALTER TABLE economia.transacao_cp DROP CONSTRAINT chk_transacao_tipo;
                ALTER TABLE economia.transacao_cp ADD CONSTRAINT chk_transacao_tipo
                    CHECK (tipo IN ('CREDITO_INICIAL', 'APOSTA_ESCROW', 'PREMIO', 'ESTORNO', 'RECOMPENSA_VOTO'));
                ALTER TABLE economia.transacao_cp ADD CONSTRAINT chk_transacao_escrow
                    CHECK (tipo <> 'APOSTA_ESCROW' OR id_desafio IS NOT NULL);
                ALTER TABLE notificacoes.notificacao DROP CONSTRAINT chk_notificacao_tipo;
                UPDATE notificacoes.notificacao SET tipo = 'APOSTA_ENCERRADA' WHERE tipo = 'DESAFIO_ENCERRADO';
                ALTER TABLE notificacoes.notificacao ADD CONSTRAINT chk_notificacao_tipo
                    CHECK (tipo IN ('PRAZO_VENCENDO', 'EVIDENCIA_ENVIADA', 'VOTACAO_ABERTA', 'APOSTA_ENCERRADA', 'CONVITE_ACEITO'));

                ALTER INDEX economia.idx_transacao_desafio RENAME TO idx_transacao_aposta;
                ALTER INDEX validacao.idx_evidencia_desafio RENAME TO idx_evidencia_aposta;
                ALTER INDEX desafios.unq_participante_desafio RENAME TO unq_participante_aposta;
                ALTER INDEX desafios.unq_desafio_papel_unico RENAME TO unq_aposta_papel_unico;
                ALTER INDEX desafios."IX_comentario_desafio_id_usuario" RENAME TO "IX_comentario_aposta_id_usuario";
                ALTER INDEX desafios.idx_comentario_desafio RENAME TO idx_comentario_aposta;
                ALTER INDEX desafios."IX_desafio_id_criador" RENAME TO "IX_aposta_id_criador";
                ALTER INDEX desafios."IX_desafio_id_categoria" RENAME TO "IX_aposta_id_categoria";
                ALTER INDEX desafios.idx_desafio_status RENAME TO idx_aposta_status;
                ALTER INDEX desafios.idx_desafio_grupo RENAME TO idx_aposta_grupo;
                ALTER INDEX desafios.idx_desafio_data_limite RENAME TO idx_aposta_data_limite;

                ALTER TABLE economia.transacao_cp RENAME CONSTRAINT fk_transacao_desafio TO fk_transacao_aposta;
                ALTER TABLE validacao.evidencia RENAME CONSTRAINT fk_evidencia_desafio TO fk_evidencia_aposta;
                ALTER TABLE desafios.participante_desafio RENAME CONSTRAINT fk_participante_desafio TO fk_participante_aposta;
                ALTER TABLE desafios.participante_desafio RENAME CONSTRAINT pk_participante_desafio TO pk_participante_aposta;
                ALTER TABLE desafios.comentario_desafio RENAME CONSTRAINT fk_comentario_desafio TO fk_comentario_aposta;
                ALTER TABLE desafios.comentario_desafio RENAME CONSTRAINT pk_comentario_desafio TO pk_comentario_aposta;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_desafio_grupo TO fk_aposta_grupo;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_desafio_criador TO fk_aposta_criador;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT fk_desafio_categoria TO fk_aposta_categoria;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_valor_cp TO chk_aposta_valor_cp;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_valor TO chk_aposta_valor;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_tipo TO chk_aposta_tipo;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_status TO chk_aposta_status;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_encerramento TO chk_aposta_encerramento;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT chk_desafio_cancelamento TO chk_aposta_cancelamento;
                ALTER TABLE desafios.desafio RENAME CONSTRAINT pk_desafio TO pk_aposta;

                ALTER TABLE economia.transacao_cp RENAME COLUMN id_desafio TO id_aposta;
                ALTER TABLE validacao.evidencia RENAME COLUMN id_desafio TO id_aposta;
                ALTER TABLE desafios.participante_desafio RENAME COLUMN papel_desafio TO papel_aposta;
                ALTER TABLE desafios.participante_desafio RENAME COLUMN id_desafio TO id_aposta;
                ALTER TABLE desafios.comentario_desafio RENAME COLUMN id_desafio TO id_aposta;
                ALTER TABLE desafios.desafio RENAME COLUMN id_desafio TO id_aposta;

                ALTER TABLE desafios.participante_desafio RENAME TO participante_aposta;
                ALTER TABLE desafios.comentario_desafio RENAME TO comentario_aposta;
                ALTER TABLE desafios.desafio RENAME TO aposta;
                ALTER SCHEMA desafios RENAME TO apostas;
                """);

            foreach (var arquivo in new[] { "01-apurar-votacao.sql", "02-economia.sql", "03-triggers-e-views.sql" })
                migrationBuilder.Sql(SqlEmbutido.Ler(arquivo));
        }
    }
}
