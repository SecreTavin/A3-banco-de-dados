using Dapper;
using EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// A prova vai direto ao juri (especificacao, telas 26-27): o envio grava a
// evidencia, congela o juri em jurado_evidencia e poe o desafio EM_VOTACAO.
public class EnviarEvidenciaTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    [Fact(DisplayName = "Envio congela o juri sem as partes e abre a votacao (RN14)")]
    public async Task EnvioCongelaJuri()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 5);
        await using var db = banco.CriarContexto();

        var resultado = await new EnviarEvidenciaHandler(db).Handle(
            new EnviarEvidenciaCommand(cenario.IdDesafio, "FOTO", " https://exemplo/prova.png ", "  "),
            cenario.IdDesafiado, default);

        resultado.IsError.Should().BeFalse();

        await using var c = new NpgsqlConnection(banco.ConnectionString);
        var juri = await c.QueryAsync<int>(
            "SELECT id_usuario FROM jurado_evidencia WHERE id_evidencia = @e AND voto IS NULL",
            new { e = resultado.Value });
        juri.Should().BeEquivalentTo(cenario.IdsValidadores);

        var evidencia = await c.QuerySingleAsync(
            "SELECT url_comprovante, comentario, status, ordem FROM evidencia WHERE id_evidencia = @e",
            new { e = resultado.Value });
        ((string)evidencia.url_comprovante).Should().Be("https://exemplo/prova.png");
        ((string?)evidencia.comentario).Should().BeNull();
        ((string)evidencia.status).Should().Be("EM_VOTACAO");
        ((int)evidencia.ordem).Should().Be(1);

        (await c.QuerySingleAsync<string>("SELECT status FROM desafio WHERE id_desafio = @d",
            new { d = cenario.IdDesafio })).Should().Be("EM_VOTACAO");
    }

    [Fact(DisplayName = "So o desafiado envia evidencia")]
    public async Task SoODesafiado()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await using var db = banco.CriarContexto();

        var resultado = await new EnviarEvidenciaHandler(db).Handle(
            new EnviarEvidenciaCommand(cenario.IdDesafio, "TEXTO", "Eu vi ele correr.", null),
            cenario.IdDesafiante, default);

        resultado.FirstError.Code.Should().Be("Evidencia.SomenteDesafiadoEnvia");
    }

    [Fact(DisplayName = "Nova evidencia espera a anterior ser apurada (RN10)")]
    public async Task AnteriorEmVotacao()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await cenario.EnviarEvidenciaAsync();
        await using var db = banco.CriarContexto();

        var resultado = await new EnviarEvidenciaHandler(db).Handle(
            new EnviarEvidenciaCommand(cenario.IdDesafio, "LINK", "https://exemplo/outra", null),
            cenario.IdDesafiado, default);

        resultado.FirstError.Code.Should().Be("Evidencia.AnteriorEmVotacao");
    }
}
