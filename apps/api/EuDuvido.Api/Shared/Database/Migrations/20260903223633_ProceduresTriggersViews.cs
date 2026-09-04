using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations;

/// <inheritdoc />
public partial class ProceduresTriggersViews : Migration
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
        foreach (var arquivo in Arquivos)
            migrationBuilder.Sql(SqlEmbutido.Ler(arquivo));
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP VIEW IF EXISTS economia.vw_cp_em_escrow");
        migrationBuilder.Sql("DROP VIEW IF EXISTS economia.vw_escrow_orfao");
        migrationBuilder.Sql("DROP VIEW IF EXISTS economia.vw_reconciliacao_saldo");
        migrationBuilder.Sql("DROP VIEW IF EXISTS validacao.vw_status_votacao");
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_membro_credito_inicial ON grupos.membro_grupo");
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_transacao_cp_imutavel ON economia.transacao_cp");
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_voto_evidencia_valida ON validacao.voto_evidencia");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS grupos.trg_credito_inicial");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS economia.trg_ledger_imutavel");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS validacao.trg_valida_voto");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS apostas.cancelar_aposta");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS apostas.encerrar_aposta");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS economia.creditar_recompensa_voto");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS economia.debitar_escrow");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS economia.lancar");
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS validacao.apurar_votacao");
    }
}
