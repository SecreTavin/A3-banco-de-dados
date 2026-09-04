namespace EuDuvido.Api.Modules.Identidade.Domain;

public class Usuario
{
    public int IdUsuario { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Apelido { get; private set; } = null!;
    public string? AvatarUrl { get; private set; }
    public DateTimeOffset DataCadastro { get; private set; }

    private readonly List<CredencialUsuario> _credenciais = [];
    public IReadOnlyCollection<CredencialUsuario> Credenciais => _credenciais;

    private Usuario() { }

    public static Usuario Criar(string nome, string email, string apelido, string? avatarUrl)
    {
        var usuario = new Usuario
        {
            Nome = nome,
            Email = email,
            Apelido = apelido,
            AvatarUrl = avatarUrl,
            DataCadastro = DateTimeOffset.UtcNow
        };
        return usuario;
    }

    public void VincularGoogle(string idExterno)
    {
        _credenciais.Add(CredencialUsuario.Google(idExterno));
    }

    public void AtualizarPerfil(string nome, string apelido)
    {
        Nome = nome;
        Apelido = apelido;
    }
}
