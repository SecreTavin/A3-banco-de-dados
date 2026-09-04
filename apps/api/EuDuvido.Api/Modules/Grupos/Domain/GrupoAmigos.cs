namespace EuDuvido.Api.Modules.Grupos.Domain;

public class GrupoAmigos
{
    public int IdGrupo { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? Descricao { get; private set; }
    public int IdCriador { get; private set; }
    public DateTimeOffset DataCriacao { get; private set; }

    private readonly List<MembroGrupo> _membros = [];
    public IReadOnlyCollection<MembroGrupo> Membros => _membros;

    private GrupoAmigos() { }

    public static GrupoAmigos Criar(string nome, string? descricao, int idCriador)
    {
        var grupo = new GrupoAmigos
        {
            Nome = nome,
            Descricao = descricao,
            IdCriador = idCriador,
            DataCriacao = DateTimeOffset.UtcNow
        };
        grupo._membros.Add(MembroGrupo.Admin(idCriador));
        return grupo;
    }

    public MembroGrupo Admitir(int idUsuario)
    {
        var membro = MembroGrupo.Comum(idUsuario);
        _membros.Add(membro);
        return membro;
    }
}
