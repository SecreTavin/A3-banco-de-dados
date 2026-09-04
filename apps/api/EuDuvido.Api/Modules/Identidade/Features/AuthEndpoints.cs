using Dapper;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;

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
                  FROM identidade.usuario ORDER BY id_usuario
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
                  FROM identidade.usuario WHERE apelido = @apelido
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
    }
}

public record LoginDevRequest(string Apelido);

public record UsuarioAutenticado(
    int IdUsuario, string Nome, string Apelido, string Email, string? AvatarUrl);
