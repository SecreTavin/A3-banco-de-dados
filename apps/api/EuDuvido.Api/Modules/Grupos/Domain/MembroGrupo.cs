namespace EuDuvido.Api.Modules.Grupos.Domain;

public class MembroGrupo
{
    public const int SaldoInicial = 100;

    public int IdMembro { get; private set; }
    public int IdGrupo { get; private set; }
    public int IdUsuario { get; private set; }
    public string Papel { get; private set; } = null!;
    public int SaldoCp { get; private set; }
    public DateTimeOffset DataEntrada { get; private set; }

    private MembroGrupo() { }

    public static MembroGrupo Admin(int idUsuario) => Novo(idUsuario, "ADMIN");
    public static MembroGrupo Comum(int idUsuario) => Novo(idUsuario, "MEMBRO");

    private static MembroGrupo Novo(int idUsuario, string papel) => new()
    {
        IdUsuario = idUsuario,
        Papel = papel,
        // O trigger trg_membro_credito_inicial lanca este valor no ledger.
        SaldoCp = SaldoInicial,
        DataEntrada = DateTimeOffset.UtcNow
    };

    public bool EhAdmin => Papel == "ADMIN";
}
