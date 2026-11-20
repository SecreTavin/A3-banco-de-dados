using ErrorOr;
using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Modules.Identidade.Features.EntrarComGoogle;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EuDuvido.Api.Modules.Identidade.Features.CompletarCadastro;

// Escrita (EF Core). O apelido nao e unico: quem identifica o usuario e o id
// (decisao do PO em 09/11/2026; modelo logico, documento 11).
public class CompletarCadastroHandler(EuDuvidoDbContext db, TokenService tokens)
{
    private const int LimiteNome = 100;
    private const int LimiteFoto = 500;

    public async Task<ErrorOr<RespostaEntrada>> Handle(CompletarCadastroCommand comando, CancellationToken ct)
    {
        var identidade = tokens.LerCadastro(comando.TokenCadastro);
        if (identidade is null)
            return AuthErrors.CadastroExpirado;

        var email = identidade.Email.Trim().ToLowerInvariant();
        if (await db.Usuarios.AnyAsync(u => u.Email.ToLower() == email, ct))
            return UsuarioErrors.EmailEmUso;

        var nome = identidade.Nome.Trim();
        if (nome.Length > LimiteNome) nome = nome[..LimiteNome];
        var foto = identidade.AvatarUrl is { Length: <= LimiteFoto } ? identidade.AvatarUrl : null;

        var novo = Usuario.Criar(nome, email, comando.Apelido.Trim(), foto, comando.DataNascimento);
        if (novo.IsError) return novo.Errors;

        db.Usuarios.Add(novo.Value);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Dois cadastros simultaneos com o mesmo e-mail: o indice unico decide.
            return UsuarioErrors.EmailEmUso;
        }

        var u = novo.Value;
        return new RespostaEntrada(
            Token: tokens.Gerar(u.IdUsuario, u.Apelido, u.Email),
            Usuario: new UsuarioAutenticado(u.IdUsuario, u.Nome, u.Apelido, u.Email, u.AvatarUrl));
    }
}
