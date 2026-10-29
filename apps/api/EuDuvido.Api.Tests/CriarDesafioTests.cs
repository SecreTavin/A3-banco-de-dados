using Dapper;
using EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;
using EuDuvido.Api.Modules.Desafios.Infrastructure;
using EuDuvido.Api.Shared.Ia;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// RN28 de ponta a ponta no banco: a avaliacao (aprovada ou nao) fica em
// moderacao_desafio, e so a aprovada vira desafio. A IA e um moderador falso -
// o comportamento da Groq em si e coberto por ChatIaTests e ModeradorDesafioTests.
public class CriarDesafioTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private sealed class ModeradorFalso(ResultadoModeracao? resultado) : IModeradorDesafio
    {
        public string? NivelRecebido { get; private set; }

        public Task<ResultadoModeracao> AvaliarAsync(
            string titulo, string descricao, string nivelFiltro, CancellationToken ct)
        {
            NivelRecebido = nivelFiltro;
            return resultado is null
                ? throw new IaIndisponivelException("Groq fora do ar.")
                : Task.FromResult(resultado);
        }
    }

    private async Task<(CenarioDesafio Cenario, CriarDesafioCommand Comando)> PrepararAsync()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 3);
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        var idCategoria = await c.QuerySingleAsync<int>(
            "INSERT INTO categoria_desafio (nome) VALUES (@n) RETURNING id_categoria",
            new { n = $"Cat {Guid.NewGuid():N}" });
        await c.ExecuteAsync("UPDATE grupo_amigos SET nivel_filtro = 'PESADO' WHERE id_grupo = @g",
            new { g = cenario.IdGrupo });

        var comando = new CriarDesafioCommand(
            cenario.IdGrupo, idCategoria, "  Correr 5km  ", "Abaixo de 25 minutos", 20,
            "MONETARIA", "R$ 50,00", DateTimeOffset.UtcNow.AddDays(7));
        return (cenario, comando);
    }

    private async Task<List<dynamic>> ModeracoesAsync(int idGrupo)
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        return (await c.QueryAsync(
            """
            SELECT id_desafio, nivel_filtro, titulo, aprovado, motivo
              FROM moderacao_desafio WHERE id_grupo = @idGrupo
            """, new { idGrupo })).ToList();
    }

    private async Task<int> DesafiosNoGrupoAsync(int idGrupo)
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        return await c.QuerySingleAsync<int>(
            "SELECT count(*) FROM desafio WHERE id_grupo = @idGrupo", new { idGrupo });
    }

    [Fact(DisplayName = "IA aprovando: desafio criado e avaliacao ligada a ele (RN28)")]
    public async Task Aprovado()
    {
        var (cenario, comando) = await PrepararAsync();
        var moderador = new ModeradorFalso(new ResultadoModeracao(true, "Desafio saudavel."));
        await using var db = banco.CriarContexto();

        var resultado = await new CriarDesafioHandler(db, moderador)
            .Handle(comando, cenario.IdDesafiado, default);

        resultado.IsError.Should().BeFalse();
        moderador.NivelRecebido.Should().Be("PESADO", "a regua e a do grupo (RN27)");

        var moderacao = (await ModeracoesAsync(cenario.IdGrupo)).Should().ContainSingle().Subject;
        ((int?)moderacao.id_desafio).Should().Be(resultado.Value);
        ((bool)moderacao.aprovado).Should().BeTrue();
        ((string)moderacao.nivel_filtro).Should().Be("PESADO");
        ((string)moderacao.titulo).Should().Be("Correr 5km");
    }

    [Fact(DisplayName = "IA reprovando: nenhum desafio, avaliacao gravada com motivo (RN28)")]
    public async Task Reprovado()
    {
        var (cenario, comando) = await PrepararAsync();
        var antes = await DesafiosNoGrupoAsync(cenario.IdGrupo);
        var moderador = new ModeradorFalso(new ResultadoModeracao(false, "Risco fisico."));
        await using var db = banco.CriarContexto();

        var resultado = await new CriarDesafioHandler(db, moderador)
            .Handle(comando, cenario.IdDesafiado, default);

        resultado.IsError.Should().BeTrue();
        resultado.FirstError.Code.Should().Be("Desafio.DesafioRecusado");
        resultado.FirstError.Description.Should().Contain("Risco fisico.");
        (await DesafiosNoGrupoAsync(cenario.IdGrupo)).Should().Be(antes);

        var moderacao = (await ModeracoesAsync(cenario.IdGrupo)).Should().ContainSingle().Subject;
        ((int?)moderacao.id_desafio).Should().BeNull();
        ((bool)moderacao.aprovado).Should().BeFalse();
        ((string)moderacao.motivo).Should().Be("Risco fisico.");
    }

    [Fact(DisplayName = "IA fora do ar: excecao e nada gravado (ADR 0015)")]
    public async Task IaIndisponivel()
    {
        var (cenario, comando) = await PrepararAsync();
        var antes = await DesafiosNoGrupoAsync(cenario.IdGrupo);
        await using var db = banco.CriarContexto();

        var criar = () => new CriarDesafioHandler(db, new ModeradorFalso(null))
            .Handle(comando, cenario.IdDesafiado, default);

        await criar.Should().ThrowAsync<IaIndisponivelException>();
        (await DesafiosNoGrupoAsync(cenario.IdGrupo)).Should().Be(antes);
        (await ModeracoesAsync(cenario.IdGrupo)).Should().BeEmpty();
    }

    [Fact(DisplayName = "Quem nao e do grupo nao cria desafio nele, e a IA nem e chamada")]
    public async Task ForaDoGrupo()
    {
        var (_, comando) = await PrepararAsync();
        var outro = await new CenarioDesafio(banco.ConnectionString).MontarAsync(membros: 2);
        var moderador = new ModeradorFalso(new ResultadoModeracao(true, null));
        await using var db = banco.CriarContexto();

        var resultado = await new CriarDesafioHandler(db, moderador)
            .Handle(comando, outro.IdDesafiado, default);

        resultado.FirstError.Code.Should().Be("Desafio.NaoMembroDoGrupo");
        moderador.NivelRecebido.Should().BeNull();
    }
}
