using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace EuDuvido.Api.Shared.Auth;

public class AuthOptions
{
    public const string Secao = "Auth";

    // "Dev" libera login por apelido; "Google" exige OIDC. Trocar de provedor
    // e configuracao, nao reescrita do fluxo.
    public string Provider { get; set; } = "Dev";
    public string Chave { get; set; } = null!;
    public string Emissor { get; set; } = "euduvido";
    public string Audiencia { get; set; } = "euduvido";
    public int ExpiracaoHoras { get; set; } = 12;
    public string? GoogleClientId { get; set; }
}

public class TokenService(AuthOptions opcoes)
{
    public string Gerar(int idUsuario, string apelido, string email)
    {
        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opcoes.Chave));
        var token = new JwtSecurityToken(
            issuer: opcoes.Emissor,
            audience: opcoes.Audiencia,
            claims: [
                new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
                new Claim(ClaimTypes.Name, apelido),
                new Claim(ClaimTypes.Email, email)
            ],
            expires: DateTime.UtcNow.AddHours(opcoes.ExpiracaoHoras),
            signingCredentials: new SigningCredentials(chave, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
