using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace EuDuvido.Api.Shared.Auth;

public class AuthOptions
{
    public const string Secao = "Auth";

    // O acesso e so pelo Google (RN05, ADR 0021). Sem GoogleClientId a API sobe,
    // mas o login responde 503 - como a criacao de desafio sem a chave da IA.
    public string Chave { get; set; } = null!;
    public string Emissor { get; set; } = "euduvido";
    public string Audiencia { get; set; } = "euduvido";
    public int ExpiracaoHoras { get; set; } = 12;
    public string? GoogleClientId { get; set; }
}

// Quem o Google disse que a pessoa e, enquanto ela completa o cadastro.
public record IdentidadeCadastro(string Email, string Nome, string? AvatarUrl);

public class TokenService(AuthOptions opcoes)
{
    // Audiencia propria: o token de cadastro so serve para completar o cadastro.
    // O JwtBearer da API exige a audiencia da sessao e o recusa nos endpoints.
    public const string AudienciaCadastro = "euduvido-cadastro";
    public static readonly TimeSpan ValidadeCadastro = TimeSpan.FromMinutes(15);

    private const string ClaimNome = "nome";
    private const string ClaimFoto = "foto";

    private SymmetricSecurityKey Chave => new(Encoding.UTF8.GetBytes(opcoes.Chave));

    public string Gerar(int idUsuario, string apelido, string email) =>
        Escrever(opcoes.Audiencia, DateTime.UtcNow.AddHours(opcoes.ExpiracaoHoras), [
            new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
            new Claim(ClaimTypes.Name, apelido),
            new Claim(ClaimTypes.Email, email)
        ]);

    public string GerarCadastro(IdentidadeCadastro identidade)
    {
        List<Claim> claims = [
            new Claim(ClaimTypes.Email, identidade.Email),
            new Claim(ClaimNome, identidade.Nome)
        ];
        if (!string.IsNullOrWhiteSpace(identidade.AvatarUrl))
            claims.Add(new Claim(ClaimFoto, identidade.AvatarUrl));
        return Escrever(AudienciaCadastro, DateTime.UtcNow.Add(ValidadeCadastro), claims);
    }

    // Null se o token for invalido, expirado ou de outra audiencia.
    public IdentidadeCadastro? LerCadastro(string token)
    {
        var parametros = ParametrosValidacao(opcoes, AudienciaCadastro);
        try
        {
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            var principal = handler.ValidateToken(token, parametros, out _);
            var email = principal.FindFirstValue(ClaimTypes.Email);
            var nome = principal.FindFirstValue(ClaimNome);
            return email is null || nome is null
                ? null
                : new IdentidadeCadastro(email, nome, principal.FindFirstValue(ClaimFoto));
        }
        catch (Exception e) when (e is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }

    // Os mesmos parametros que o JwtBearer usa para a sessao (Program.cs).
    public static TokenValidationParameters ParametrosValidacao(AuthOptions opcoes, string? audiencia = null) => new()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = opcoes.Emissor,
        ValidAudience = audiencia ?? opcoes.Audiencia,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opcoes.Chave)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };

    private string Escrever(string audiencia, DateTime expira, IEnumerable<Claim> claims)
    {
        var token = new JwtSecurityToken(
            issuer: opcoes.Emissor,
            audience: audiencia,
            claims: claims,
            expires: expira,
            signingCredentials: new SigningCredentials(Chave, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
