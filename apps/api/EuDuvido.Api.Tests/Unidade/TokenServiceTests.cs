using System.IdentityModel.Tokens.Jwt;
using EuDuvido.Api.Shared.Auth;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;

namespace EuDuvido.Api.Tests.Unidade;

// O token de cadastro carrega o que o Google confirmou entre o login e o
// "Complete seu cadastro". Ele nao pode servir como sessao (ADR 0021).
public class TokenServiceTests
{
    private static AuthOptions Opcoes(string chave = "chave-de-teste-com-mais-de-32-caracteres!!") =>
        new() { Chave = chave };

    private static readonly IdentidadeCadastro Ana =
        new("ana@gmail.com", "Ana Souza", "https://lh3.googleusercontent.com/a/ana");

    [Fact(DisplayName = "O token de cadastro devolve e-mail, nome e foto do Google")]
    public void IdaEVolta()
    {
        var tokens = new TokenService(Opcoes());

        var lido = tokens.LerCadastro(tokens.GerarCadastro(Ana));

        lido.Should().Be(Ana);
    }

    [Fact(DisplayName = "Token de cadastro assinado com outra chave e recusado")]
    public void OutraChave()
    {
        var deFora = new TokenService(Opcoes("outra-chave-de-teste-com-mais-de-32-caracteres"));

        new TokenService(Opcoes()).LerCadastro(deFora.GerarCadastro(Ana)).Should().BeNull();
    }

    [Fact(DisplayName = "Token de sessao nao serve como token de cadastro")]
    public void SessaoNaoECadastro()
    {
        var tokens = new TokenService(Opcoes());

        tokens.LerCadastro(tokens.Gerar(1, "Ana", "ana@gmail.com")).Should().BeNull();
    }

    [Fact(DisplayName = "Token de cadastro nao abre endpoint protegido (audiencia da sessao)")]
    public void CadastroNaoESessao()
    {
        var opcoes = Opcoes();
        var cadastro = new TokenService(opcoes).GerarCadastro(Ana);

        var validar = () => new JwtSecurityTokenHandler()
            .ValidateToken(cadastro, TokenService.ParametrosValidacao(opcoes), out _);

        validar.Should().Throw<SecurityTokenInvalidAudienceException>();
    }

    [Fact(DisplayName = "Texto qualquer no lugar do token de cadastro e recusado sem excecao")]
    public void Lixo()
    {
        new TokenService(Opcoes()).LerCadastro("nao-e-um-jwt").Should().BeNull();
    }

    [Fact(DisplayName = "O token de cadastro vale 15 minutos")]
    public void Validade()
    {
        var token = new JwtSecurityTokenHandler().ReadJwtToken(new TokenService(Opcoes()).GerarCadastro(Ana));

        token.ValidTo.Should().BeCloseTo(DateTime.UtcNow.Add(TokenService.ValidadeCadastro), TimeSpan.FromSeconds(10));
        token.Audiences.Should().Equal(TokenService.AudienciaCadastro);
    }
}
