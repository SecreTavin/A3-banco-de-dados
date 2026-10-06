namespace EuDuvido.Api.Modules.Desafios.Domain;

public class ParticipanteDesafio
{
    public int IdParticipante { get; private set; }
    public int IdDesafio { get; private set; }
    public int IdUsuario { get; private set; }
    public string PapelDesafio { get; private set; } = null!;
    public string Escolha { get; private set; } = null!;
    public DateTimeOffset DataAceite { get; private set; }

    private ParticipanteDesafio() { }

    internal static ParticipanteDesafio Novo(int idUsuario, string papel, string escolha) => new()
    {
        IdUsuario = idUsuario,
        PapelDesafio = papel,
        Escolha = escolha,
        DataAceite = DateTimeOffset.UtcNow
    };
}
