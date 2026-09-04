using System.Security.Claims;

namespace EuDuvido.Api.Shared.Auth;

public interface IUsuarioAtual
{
    int Id { get; }
    string Apelido { get; }
}

public class UsuarioAtual(IHttpContextAccessor accessor) : IUsuarioAtual
{
    public int Id => int.Parse(Claim(ClaimTypes.NameIdentifier));
    public string Apelido => Claim(ClaimTypes.Name);

    private string Claim(string tipo) =>
        accessor.HttpContext?.User.FindFirstValue(tipo)
        ?? throw new InvalidOperationException($"Claim {tipo} ausente no token.");
}
