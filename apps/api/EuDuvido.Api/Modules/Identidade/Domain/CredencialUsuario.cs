namespace EuDuvido.Api.Modules.Identidade.Domain;

public class CredencialUsuario
{
    public int IdCredencial { get; private set; }
    public int IdUsuario { get; private set; }
    public string Provedor { get; private set; } = null!;
    public string IdExterno { get; private set; } = null!;
    public string? SegredoHash { get; private set; }
    public DateTimeOffset DataVinculo { get; private set; }

    private CredencialUsuario() { }

    public static CredencialUsuario Google(string idExterno) => new()
    {
        Provedor = "GOOGLE",
        IdExterno = idExterno,
        SegredoHash = null,
        DataVinculo = DateTimeOffset.UtcNow
    };
}
