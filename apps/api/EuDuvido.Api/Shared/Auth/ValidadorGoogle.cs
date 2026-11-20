using Google.Apis.Auth;

namespace EuDuvido.Api.Shared.Auth;

// O que o Google garante sobre quem fez login.
public record IdentidadeGoogle(string Email, string Nome, string? AvatarUrl, bool EmailVerificado);

public interface IValidadorGoogle
{
    // Null quando o token nao e do Google, expirou ou foi emitido para outro app.
    Task<IdentidadeGoogle?> ValidarAsync(string credencial, string clientId, CancellationToken ct);
}

// Confere o ID token do botao "Entrar com Google" no servidor: assinatura pelas
// chaves publicas do Google, emissor, validade e se foi emitido para o nosso
// Client ID. O front nunca decide quem e o usuario.
public class ValidadorGoogle : IValidadorGoogle
{
    public async Task<IdentidadeGoogle?> ValidarAsync(string credencial, string clientId, CancellationToken ct)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                credencial,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });

            return new IdentidadeGoogle(
                payload.Email,
                string.IsNullOrWhiteSpace(payload.Name) ? payload.Email : payload.Name,
                payload.Picture,
                payload.EmailVerified);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
