using Dapper;
using EuDuvido.Api.Modules.Desafios.Features;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// Voto e justificativa de cada jurado no detalhe do desafio (RF07) e a regra de
// visibilidade (RN29), contra o PostgreSQL real. Issue #83.
public class JuradosDoDesafioTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private async Task<JuradoLido[]> LerComoAsync(CenarioDesafio cenario, int idEvidencia, int idUsuario)
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        await c.OpenAsync();
        return [.. (await JuradosDoDesafio.LerAsync(c, cenario.IdDesafio, idUsuario))[idEvidencia]];
    }

    // Voto e justificativa no mesmo UPDATE, como a API grava: depois do voto a linha do
    // jurado nao muda mais (trigger trg_valida_jurado).
    private async Task VotarComComentarioAsync(int idEvidencia, int idUsuario, string voto, string justificativa)
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

    // 5 membros: desafiado, desafiante e 3 jurados (quorum 2). O primeiro jurado vota
    // VALIDO com comentario; a prova continua em votacao.
    private async Task<(CenarioDesafio Cenario, int IdEvidencia)> UmVotoAsync()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await VotarComComentarioAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO", "A foto confere.");
        return (cenario, idEvidencia);
    }

    [Fact(DisplayName = "O desafiado ve o voto e o comentario de quem ja votou")]
    public async Task DesafiadoVeOsVotos()
    {
        var (cenario, idEvidencia) = await UmVotoAsync();

        var jurados = await LerComoAsync(cenario, idEvidencia, cenario.IdDesafiado);

        jurados.Should().HaveCount(3);
        var votou = jurados.Single(j => j.IdUsuario == cenario.IdsValidadores[0]);
        votou.Votou.Should().BeTrue();
        votou.Voto.Should().Be("VALIDO");
        votou.Justificativa.Should().Be("A foto confere.");
        votou.DataVoto.Should().NotBeNull();
        jurados.Where(j => j.IdUsuario != cenario.IdsValidadores[0])
            .Should().OnlyContain(j => !j.Votou && j.Voto == null && j.Justificativa == null);
    }

    [Fact(DisplayName = "RN29: o jurado que ainda nao votou ve quem votou, mas nao o voto nem o comentario")]
    public async Task JuradoPendenteNaoVeOsVotos()
    {
        var (cenario, idEvidencia) = await UmVotoAsync();

        var jurados = await LerComoAsync(cenario, idEvidencia, cenario.IdsValidadores[1]);

        var votou = jurados.Single(j => j.IdUsuario == cenario.IdsValidadores[0]);
        votou.Votou.Should().BeTrue();
        votou.Voto.Should().BeNull();
        votou.Justificativa.Should().BeNull();
        votou.DataVoto.Should().BeNull();
    }

    [Fact(DisplayName = "RN29: depois de votar, o jurado ve os votos dos outros")]
    public async Task JuradoQueVotouVeOsVotos()
    {
        var (cenario, idEvidencia) = await UmVotoAsync();

        var jurados = await LerComoAsync(cenario, idEvidencia, cenario.IdsValidadores[0]);

        jurados.Single(j => j.IdUsuario == cenario.IdsValidadores[0]).Justificativa.Should().Be("A foto confere.");
    }

    [Fact(DisplayName = "RN29: com a votacao fechada, ate quem nao votou ve os votos")]
    public async Task VotacaoFechadaMostraTudo()
    {
        var (cenario, idEvidencia) = await UmVotoAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        var jurados = await LerComoAsync(cenario, idEvidencia, cenario.IdsValidadores[2]);

        jurados.Where(j => j.Votou).Should().HaveCount(2).And.OnlyContain(j => j.Voto == "VALIDO");
        jurados.Single(j => j.IdUsuario == cenario.IdsValidadores[0]).Justificativa.Should().Be("A foto confere.");
    }
}
