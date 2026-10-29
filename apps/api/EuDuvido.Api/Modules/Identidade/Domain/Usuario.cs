using ErrorOr;
using EuDuvido.Api.Shared.Results;

namespace EuDuvido.Api.Modules.Identidade.Domain;

// Login e externo (Google): o sistema nao guarda senha nem credencial, a
// identidade e o e-mail (RN05, ADR 0016).
public class Usuario
{
    public const int IdadeMinima = 16;

    public int IdUsuario { get; private set; }
    public string Nome { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Apelido { get; private set; } = null!;
    public string? AvatarUrl { get; private set; }
    public DateOnly DataNascimento { get; private set; }
    public DateTimeOffset DataCadastro { get; private set; }

    private Usuario() { }

    public static ErrorOr<Usuario> Criar(
        string nome, string email, string apelido, string? avatarUrl, DateOnly dataNascimento)
    {
        var agora = DateTimeOffset.UtcNow;

        // RN26. O trigger trg_usuario_idade_minima repete a regra no banco; aqui
        // ela vira erro legivel em vez de excecao do Postgres.
        if (dataNascimento > DateOnly.FromDateTime(agora.UtcDateTime).AddYears(-IdadeMinima))
            return UsuarioErrors.IdadeMinima;

        return new Usuario
        {
            Nome = nome,
            Email = email,
            Apelido = apelido,
            AvatarUrl = avatarUrl,
            DataNascimento = dataNascimento,
            DataCadastro = agora
        };
    }

    public void AtualizarPerfil(string nome, string apelido)
    {
        Nome = nome;
        Apelido = apelido;
    }
}

public static class UsuarioErrors
{
    public static Error IdadeMinima =>
        Error.Custom(TipoErro.Recusado, "Usuario.IdadeMinima",
            $"E preciso ter ao menos {Usuario.IdadeMinima} anos para usar o Eu Duvido!.");

    public static Error EmailEmUso =>
        Error.Conflict("Usuario.EmailEmUso", "Ja existe uma conta com este e-mail.");
}
