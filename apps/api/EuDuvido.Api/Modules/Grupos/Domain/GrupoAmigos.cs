using ErrorOr;

namespace EuDuvido.Api.Modules.Grupos.Domain;

public class GrupoAmigos
{
    public int IdGrupo { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? Descricao { get; private set; }
    public int IdCriador { get; private set; }
    public string NivelFiltro { get; private set; } = null!;
    public DateTimeOffset DataCriacao { get; private set; }

    private readonly List<MembroGrupo> _membros = [];
    public IReadOnlyCollection<MembroGrupo> Membros => _membros;

    private GrupoAmigos() { }

    public static GrupoAmigos Criar(string nome, string? descricao, int idCriador,
        string nivelFiltro = NiveisFiltro.Padrao)
    {
        var grupo = new GrupoAmigos
        {
            Nome = nome,
            Descricao = descricao,
            IdCriador = idCriador,
            NivelFiltro = nivelFiltro,
            DataCriacao = DateTimeOffset.UtcNow
        };
        // RN25: quem cria o grupo e ADMIN.
        grupo._membros.Add(MembroGrupo.Admin(idCriador));
        return grupo;
    }

    // RN25: so ADMIN adiciona. O membro novo entra com 100 CP pelo trigger
    // trg_membro_credito_inicial (RN06).
    public ErrorOr<MembroGrupo> Admitir(int idSolicitante, int idUsuario)
    {
        if (!EhAdmin(idSolicitante))
            return GrupoErrors.SomenteAdmin;

        if (_membros.Any(m => m.IdUsuario == idUsuario))
            return GrupoErrors.JaMembro;

        var membro = MembroGrupo.Comum(idUsuario);
        _membros.Add(membro);
        return membro;
    }

    // RN27: o banco nao sabe quem executa o UPDATE, entao a restricao ao ADMIN
    // e da aplicacao. O valor em si e garantido por chk_grupo_nivel_filtro.
    public ErrorOr<Success> AlterarNivelFiltro(int idSolicitante, string nivel)
    {
        if (!EhAdmin(idSolicitante))
            return GrupoErrors.SomenteAdmin;

        NivelFiltro = nivel;
        return Result.Success;
    }

    // RN25: ADMIN remove qualquer membro; qualquer um pode sair por conta
    // propria. A remocao em si (lancamento de saida + DELETE) e da procedure
    // remover_membro, que tambem recusa quem tem desafio ou juri em curso.
    public ErrorOr<Success> PodeRemover(int idSolicitante, int idUsuario)
    {
        var alvo = _membros.FirstOrDefault(m => m.IdUsuario == idUsuario);
        if (alvo is null)
            return GrupoErrors.NaoMembro;

        if (idSolicitante != idUsuario && !EhAdmin(idSolicitante))
            return GrupoErrors.SomenteAdmin;

        // Grupo nao pode ficar sem quem administre enquanto houver membros.
        var ultimoAdmin = alvo.EhAdmin && _membros.Count(m => m.EhAdmin) == 1;
        if (ultimoAdmin && _membros.Count > 1)
            return GrupoErrors.UltimoAdmin;

        return Result.Success;
    }

    public bool EhAdmin(int idUsuario) =>
        _membros.Any(m => m.IdUsuario == idUsuario && m.EhAdmin);
}

public static class NiveisFiltro
{
    public const string Leve = "LEVE";
    public const string Moderado = "MODERADO";
    public const string Pesado = "PESADO";
    public const string Padrao = Moderado;

    public static readonly string[] Todos = [Leve, Moderado, Pesado];
}

public static class GrupoErrors
{
    public static Error NaoEncontrado =>
        Error.NotFound("Grupo.NaoEncontrado", "Grupo nao encontrado.");

    public static Error SomenteAdmin =>
        Error.Forbidden("Grupo.SomenteAdmin",
            "Apenas administradores do grupo podem fazer isso.");

    public static Error JaMembro =>
        Error.Conflict("Grupo.JaMembro", "Este usuario ja participa do grupo.");

    public static Error NaoMembro =>
        Error.NotFound("Grupo.NaoMembro", "Este usuario nao participa do grupo.");

    public static Error UltimoAdmin =>
        Error.Conflict("Grupo.UltimoAdmin",
            "Voce e o unico administrador: o grupo precisa de outro ADMIN antes de voce sair.");

    public static Error UsuarioNaoEncontrado =>
        Error.NotFound("Grupo.UsuarioNaoEncontrado",
            "Nenhum usuario cadastrado com este e-mail.");

    public static Error MembroComPendencias =>
        Error.Conflict("Grupo.MembroComPendencias",
            "O membro participa de desafio em curso ou de um juri aberto. " +
            "Ele so pode sair depois que eles forem encerrados.");
}
