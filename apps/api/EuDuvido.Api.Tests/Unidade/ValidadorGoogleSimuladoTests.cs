using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EuDuvido.Api.Shared.Auth;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;

namespace EuDuvido.Api.Tests.Unidade;

// O validador simulado so serve aos testes de ponta a ponta (ADR 0024). Ele precisa
// recusar o que o real recusaria: outra chave, outro app, token vencido, emissor
// que nao e o dele.
public class ValidadorGoogleSimuladoTests
{
    private const string Chave = "chave-do-google-simulado-com-mais-de-32";
    private const string ClientId = "e2e.apps.googleusercontent.com";

    private static string Token(
        string chave = Chave, string emissor = ValidadorGoogleSimulado.Emissor, string audiencia = ClientId,
        bool verificado = true, int minutos = 10, string? email = "ana@gmail.com")
    {
        List<Claim> claims = [new("email_verified", verificado ? "true" : "false", ClaimValueTypes.Boolean),
            new("name", "Ana Souza"), new("picture", "https://lh3.googleusercontent.com/a/ana")];
        if (email is not null) claims.Add(new Claim("email", email));
        var token = new JwtSecurityToken(emissor, audiencia, claims, DateTime.UtcNow.AddMinutes(minutos - 20),
            DateTime.UtcNow.AddMinutes(minutos),
            new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)), SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static Task<IdentidadeGoogle?> Validar(string token) =>
        new ValidadorGoogleSimulado(Chave).ValidarAsync(token, ClientId, CancellationToken.None);

    [Fact(DisplayName = "Token simulado valido devolve e-mail, nome, foto e verificacao")]
    public async Task Valido()
    {
        var identidade = await Validar(Token());

        identidade.Should().Be(new IdentidadeGoogle("ana@gmail.com", "Ana Souza",
            "https://lh3.googleusercontent.com/a/ana", true));
    }

    [Fact(DisplayName = "E-mail nao verificado chega como nao verificado")]
    public async Task NaoVerificado() =>
        (await Validar(Token(verificado: false)))!.EmailVerificado.Should().BeFalse();

    [Theory(DisplayName = "Outra chave, outro Client ID, emissor do Google ou token vencido sao recusados")]
    [InlineData("chave")]
    [InlineData("audiencia")]
    [InlineData("emissor")]
    [InlineData("vencido")]
    public async Task Recusados(string caso)
    {
        var token = caso switch
        {
            "chave" => Token(chave: "outra-chave-qualquer-com-mais-de-32-caracteres"),
            "audiencia" => Token(audiencia: "outro-app.apps.googleusercontent.com"),
            "emissor" => Token(emissor: "https://accounts.google.com"),
            _ => Token(minutos: -5)
        };

        (await Validar(token)).Should().BeNull();
    }

    [Fact(DisplayName = "Token sem e-mail e texto qualquer sao recusados")]
    public async Task SemEmail()
    {
        (await Validar(Token(email: null))).Should().BeNull();
        (await Validar("nao-e-um-jwt")).Should().BeNull();
    }
}
