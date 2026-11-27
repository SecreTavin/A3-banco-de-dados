using Dapper;
using EuDuvido.Api.Modules.Validacao.Features.MinhasProvas;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// A aba Votacao do desafiado: as provas dele no juri, com o placar e os comentarios
// (#83), contra o PostgreSQL real.
public class MinhasProvasNoJuriTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private async Task<IReadOnlyList<ProvaNoJuri>> LerAsync(int idUsuario)
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        await c.OpenAsync();
        return await MinhasProvasNoJuri.LerAsync(c, idUsuario);
    }

    private async Task VotarAsync(int idEvidencia, int idUsuario, string voto, string justificativa)
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        await c.ExecuteAsync(
            """
            UPDATE jurado_evidencia
               SET voto = @v, justificativa = @j, data_voto = CURRENT_TIMESTAMP
             WHERE id_evidencia = @e AND id_usuario = @u
            """,
            new { v = voto, j = justificativa, e = idEvidencia, u = idUsuario });
        await c.ExecuteAsync("CALL apurar_votacao(@e)", new { e = idEvidencia });
    }

    [Fact(DisplayName = "O desafiado ve a propria prova no juri, com o placar e o comentario de quem votou")]
    public async Task DesafiadoVeAPropriaProva()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO", "Confere.");

        var prova = (await LerAsync(cenario.IdDesafiado)).Single(p => p.IdEvidencia == idEvidencia);

        prova.IdDesafio.Should().Be(cenario.IdDesafio);
        prova.Quorum.Should().Be(2);
        prova.VotosFavoraveis.Should().Be(1);
        prova.VotosContra.Should().Be(0);
        prova.Jurados.Should().HaveCount(3);
        var voto = prova.Jurados.Single(j => j.Votou);
        voto.Voto.Should().Be("VALIDO");
        voto.Justificativa.Should().Be("Confere.");
    }

    [Fact(DisplayName = "Quem nao enviou a prova nao a recebe como sua; votacao fechada sai da lista")]
    public async Task SoAsPropriasEmVotacao()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();

        (await LerAsync(cenario.IdsValidadores[0])).Should().NotContain(p => p.IdEvidencia == idEvidencia);
        (await LerAsync(cenario.IdDesafiante)).Should().NotContain(p => p.IdEvidencia == idEvidencia);

        await VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO", "Ok.");
        await VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO", "Ok.");

        (await LerAsync(cenario.IdDesafiado)).Should().NotContain(p => p.IdEvidencia == idEvidencia);
    }
}
