using EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;
using EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;
using EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// Entrada invalida para no validador, antes do handler (CLAUDE.md) - e, na
// criacao de desafio, antes de gastar uma chamada a IA.
public class ValidadoresTests
{
    private static CriarDesafioCommand DesafioValido() => new(
        IdGrupo: 1, IdCategoria: 1, Titulo: "Correr 5km", Descricao: "Abaixo de 25 minutos",
        ValorCp: 20, TipoRecompensa: "MONETARIA", DescricaoRecompensa: "R$ 50,00",
        DataLimite: DateTimeOffset.UtcNow.AddDays(7));

    [Fact(DisplayName = "Desafio bem formado passa no validador")]
    public void DesafioValidoPassa() =>
        new CriarDesafioValidator().Validate(DesafioValido()).IsValid.Should().BeTrue();

    [Fact(DisplayName = "Descricao da recompensa e opcional (RN02)")]
    public void RecompensaOpcional() =>
        new CriarDesafioValidator().Validate(DesafioValido() with { DescricaoRecompensa = null })
            .IsValid.Should().BeTrue();

    public static TheoryData<string, CriarDesafioCommand> DesafiosInvalidos()
    {
        var valido = DesafioValido();
        return new()
        {
            { "Titulo", valido with { Titulo = " " } },
            { "Titulo", valido with { Titulo = new string('t', 121) } },
            { "Descricao", valido with { Descricao = "" } },
            { "ValorCp", valido with { ValorCp = 0 } },
            { "TipoRecompensa", valido with { TipoRecompensa = "PIX" } },
            { "DescricaoRecompensa", valido with { DescricaoRecompensa = new string('r', 256) } },
            { "DataLimite", valido with { DataLimite = DateTimeOffset.UtcNow.AddMinutes(-1) } },
            { "IdGrupo", valido with { IdGrupo = 0 } },
        };
    }

    [Theory(DisplayName = "Desafio mal formado e barrado no campo certo")]
    [MemberData(nameof(DesafiosInvalidos))]
    public void DesafioInvalido(string campo, CriarDesafioCommand comando) =>
        new CriarDesafioValidator().Validate(comando).Errors
            .Should().Contain(e => e.PropertyName == campo);

    [Theory(DisplayName = "Comprovante de FOTO, VIDEO e LINK precisa ser link http(s); TEXTO e o relato")]
    [InlineData("FOTO", "https://exemplo.com/prova.png", true)]
    [InlineData("VIDEO", "http://exemplo.com/prova.mp4", true)]
    [InlineData("LINK", "ftp://exemplo.com/prova", false)]
    [InlineData("FOTO", "minha foto", false)]
    [InlineData("TEXTO", "Corri 5km no parque, o Theus viu.", true)]
    [InlineData("AUDIO", "https://exemplo.com/prova.mp3", false)]
    [InlineData("FOTO", "", false)]
    public void Comprovante(string tipoMidia, string url, bool valido) =>
        new EnviarEvidenciaValidator()
            .Validate(new EnviarEvidenciaCommand(1, tipoMidia, url, null))
            .IsValid.Should().Be(valido);

    [Theory(DisplayName = "Voto e VALIDO ou INVALIDO")]
    [InlineData("VALIDO", true)]
    [InlineData("INVALIDO", true)]
    [InlineData("TALVEZ", false)]
    [InlineData("valido", false)]
    public void Voto(string voto, bool valido) =>
        new RegistrarVotoValidator()
            .Validate(new RegistrarVotoCommand(1, voto, null))
            .IsValid.Should().Be(valido);
}
