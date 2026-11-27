using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace EuDuvido.Api.Shared.Auth;

// Validador do login com Google para o ambiente de TESTE (ADR 0024). O popup do
// Google nao se automatiza, e o ID token real so o Google assina. Com este
// validador, os roteiros de ponta a ponta assinam um token no formato do Google
// (email, email_verified, name, picture) com uma chave de teste e exercitam o
// caminho inteiro: conta existente, cadastro pendente, e-mail nao verificado.
//
// So entra quando Auth:GoogleSimuladoChave esta configurada (Program.cs). Sem
// ela, que e o padrao e o caso da producao, vale o ValidadorGoogle real. O
// emissor proprio impede que um token simulado se passe por um do Google, e o
// Client ID continua obrigatorio, como no real.
public class ValidadorGoogleSimulado(string chave) : IValidadorGoogle
{
    public const string Emissor = "euduvido-google-simulado";
    public const int TamanhoMinimoChave = 32;

    public Task<IdentidadeGoogle?> ValidarAsync(string credencial, string clientId, CancellationToken ct)
    {
        var parametros = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Emissor,
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        try
        {
            var principal = new JwtSecurityTokenHandler { MapInboundClaims = false }
                .ValidateToken(credencial, parametros, out _);
            var email = principal.FindFirstValue("email");
            if (string.IsNullOrWhiteSpace(email))
                return Task.FromResult<IdentidadeGoogle?>(null);

            var nome = principal.FindFirstValue("name");
            var verificado = string.Equals(principal.FindFirstValue("email_verified"), "true",
                StringComparison.OrdinalIgnoreCase);

            return Task.FromResult<IdentidadeGoogle?>(new IdentidadeGoogle(
                email, string.IsNullOrWhiteSpace(nome) ? email : nome,
                principal.FindFirstValue("picture"), verificado));
        }
        catch (Exception e) when (e is SecurityTokenException or ArgumentException)
        {
            return Task.FromResult<IdentidadeGoogle?>(null);
        }
    }
}
