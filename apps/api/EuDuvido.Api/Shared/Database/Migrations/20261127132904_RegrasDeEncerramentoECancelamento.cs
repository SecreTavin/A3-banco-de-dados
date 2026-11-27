using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations
{
    /// <summary>
    /// Regras decididas em 27/11/2026, depois do roteiro completo de testes de ponta a ponta
    /// (docs/05-qualidade/roteiro-e2e.md, cenarios V27 e D32):
    /// <list type="bullet">
    /// <item>encerrar_desafio devolve o pote a quem entrou quando ninguem escolheu o lado
    /// vencedor (RN23) - antes, o CP ficava preso e vw_escrow_orfao acusava;</item>
    /// <item>cancelar_desafio expira a prova que estava no juri (RN12) - antes, o juri
    /// continuava votando e recebendo CP num desafio cancelado.</item>
    /// </list>
    /// So muda procedures; o modelo do EF nao muda.
    /// </summary>
    public partial class RegrasDeEncerramentoECancelamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(SqlEmbutido.Ler("v4-02-economia.sql"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(SqlEmbutido.Ler("v3-02-economia.sql"));
        }
    }
}
