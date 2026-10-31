using Dapper;
using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Identidade.Features;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/auth").WithTags("Auth");

        // Bypass de desenvolvimento. Com Auth:Provider = "Google" estes dois
        // endpoints somem e o fluxo passa a exigir o token do provedor.
        grupo.MapGet("/dev/usuarios", async (AuthOptions auth, IConexaoLeitura leitura,
            CancellationToken ct) =>
        {
            if (auth.Provider != "Dev") return Results.NotFound();

            using var conexao = await leitura.AbrirAsync(ct);
            var usuarios = await conexao.QueryAsync(
                """
                SELECT id_usuario AS "idUsuario", nome, apelido, email, avatar_url AS "avatarUrl"
                  FROM usuario ORDER BY id_usuario
                """);
            return Results.Ok(usuarios);
        })
        .WithSummary("Usuarios disponiveis para login de desenvolvimento.");

        grupo.MapPost("/dev/login", async (LoginDevRequest requisicao, AuthOptions auth,
            TokenService tokens, IConexaoLeitura leitura, CancellationToken ct) =>
        {
            if (auth.Provider != "Dev")
                return Results.Problem("Login de desenvolvimento desabilitado.", statusCode: 403);

            using var conexao = await leitura.AbrirAsync(ct);
            var usuario = await conexao.QuerySingleOrDefaultAsync<UsuarioAutenticado>(
                """
                SELECT id_usuario AS IdUsuario, nome AS Nome, apelido AS Apelido,
                       email AS Email, avatar_url AS AvatarUrl
                  FROM usuario WHERE apelido = @apelido
                """,
                new { requisicao.Apelido });

            if (usuario is null)
                return Results.NotFound(new { erro = $"Usuario '{requisicao.Apelido}' nao existe." });

            return Results.Ok(new
            {
                token = tokens.Gerar(usuario.IdUsuario, usuario.Apelido, usuario.Email),
                usuario
            });
        })
        .WithSummary("Autentica pelo apelido, sem senha. Somente em desenvolvimento.");

        // Demonstra a RN26 ao vivo: o cadastro de quem tem menos de 16 anos e
        // recusado pelo dominio (e, por baixo, pelo trigger do banco).
        grupo.MapPost("/dev/cadastro", async (CadastroDevRequest requisicao, AuthOptions auth,
            TokenService tokens, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (auth.Provider != "Dev")
                return Results.Problem("Cadastro de desenvolvimento desabilitado.", statusCode: 403);

            var erros = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(requisicao.Nome) || requisicao.Nome.Trim().Length > 100)
                erros["nome"] = ["Informe o nome (até 100 caracteres)."];
            if (string.IsNullOrWhiteSpace(requisicao.Email) || requisicao.Email.Trim().Length > 120 ||
                !requisicao.Email.Contains('@'))
                erros["email"] = ["Informe um e-mail válido."];
            if (string.IsNullOrWhiteSpace(requisicao.Apelido) || requisicao.Apelido.Trim().Length > 50)
                erros["apelido"] = ["Informe o apelido (até 50 caracteres)."];
            if (requisicao.DataNascimento < new DateOnly(1900, 1, 1))
                erros["dataNascimento"] = ["Informe a data de nascimento."];
            if (erros.Count > 0)
                return Results.ValidationProblem(erros);

            var email = requisicao.Email.Trim().ToLowerInvariant();
            if (await db.Usuarios.AnyAsync(u => u.Email.ToLower() == email, ct))
                return ((ErrorOr.ErrorOr<Usuario>)UsuarioErrors.EmailEmUso).ToHttp();

            // Apelido nao e unico no modelo, mas o login de desenvolvimento entra
            // por ele: dois iguais deixariam ambos sem conseguir entrar.
            var apelido = requisicao.Apelido.Trim();
            if (await db.Usuarios.AnyAsync(u => u.Apelido == apelido, ct))
                return Results.Conflict(new { erro = $"O apelido '{apelido}' ja esta em uso." });

            var novo = Usuario.Criar(
                requisicao.Nome.Trim(), email, apelido, null,
                requisicao.DataNascimento);
            if (novo.IsError) return novo.ToHttp();

            db.Usuarios.Add(novo.Value);
            await db.SaveChangesAsync(ct);

            var usuario = new UsuarioAutenticado(
                novo.Value.IdUsuario, novo.Value.Nome, novo.Value.Apelido,
                novo.Value.Email, novo.Value.AvatarUrl);

            return Results.Created($"/api/auth/dev/usuarios/{usuario.IdUsuario}", new
            {
                token = tokens.Gerar(usuario.IdUsuario, usuario.Apelido, usuario.Email),
                usuario
            });
        })
        .WithSummary("Cadastra usuario de teste com data de nascimento (RN26). Somente em desenvolvimento.");
    }
}

public record LoginDevRequest(string Apelido);

public record CadastroDevRequest(string Nome, string Email, string Apelido, DateOnly DataNascimento);

public record UsuarioAutenticado(
    int IdUsuario, string Nome, string Apelido, string Email, string? AvatarUrl);
