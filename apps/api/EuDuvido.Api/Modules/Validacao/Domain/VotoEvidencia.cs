namespace EuDuvido.Api.Modules.Validacao.Domain;

public class VotoEvidencia
{
    public int IdVoto { get; private set; }
    public int IdEvidencia { get; private set; }
    public int IdUsuario { get; private set; }
    public string Voto { get; private set; } = null!;
    public string? Justificativa { get; private set; }
    public DateTimeOffset DataVoto { get; private set; }

    private VotoEvidencia() { }

    internal static VotoEvidencia Novo(int idUsuario, string voto, string? justificativa) => new()
    {
        IdUsuario = idUsuario,
        Voto = voto,
        Justificativa = justificativa,
        DataVoto = DateTimeOffset.UtcNow
    };
}
