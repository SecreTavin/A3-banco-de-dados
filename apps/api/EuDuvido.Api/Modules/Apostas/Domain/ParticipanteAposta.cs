namespace EuDuvido.Api.Modules.Apostas.Domain;

public class ParticipanteAposta
{
    public int IdParticipante { get; private set; }
    public int IdAposta { get; private set; }
    public int IdUsuario { get; private set; }
    public string PapelAposta { get; private set; } = null!;
    public string Escolha { get; private set; } = null!;
    public DateTimeOffset DataAceite { get; private set; }

    private ParticipanteAposta() { }

    internal static ParticipanteAposta Novo(int idUsuario, string papel, string escolha) => new()
    {
        IdUsuario = idUsuario,
        PapelAposta = papel,
        Escolha = escolha,
        DataAceite = DateTimeOffset.UtcNow
    };
}
