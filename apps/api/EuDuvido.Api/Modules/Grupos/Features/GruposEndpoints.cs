using Dapper;
using EuDuvido.Api.Modules.Grupos.Domain;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Grupos.Features;

public static class GruposEndpoints
{
    private static readonly TimeSpan ValidadeConvite = TimeSpan.FromDays(7);

    public static void MapGruposEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/grupos").RequireAuthorization().WithTags("Grupos");

        grupo.MapGet("/", async (IUsuarioAtual usuario, IConexaoLeitura leitura,
            CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT g.id_grupo AS "idGrupo", g.nome, g.descricao, m.saldo_cp AS "saldoCp",
                       m.papel,
                       (SELECT count(*) FROM grupos.membro_grupo x
                         WHERE x.id_grupo = g.id_grupo) AS "totalMembros"
                  FROM grupos.grupo_amigos g
                  JOIN grupos.membro_grupo m ON m.id_grupo = g.id_grupo
                 WHERE m.id_usuario = @id
                 ORDER BY g.nome
                """, new { id = usuario.Id }));
        });

        grupo.MapGet("/{id:int}", async (int id, IUsuarioAtual usuario,
            IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);

            var cabecalho = await conexao.QuerySingleOrDefaultAsync(
                """
                SELECT g.id_grupo AS "idGrupo", g.nome, g.descricao
                  FROM grupos.grupo_amigos g
                  JOIN grupos.membro_grupo m ON m.id_grupo = g.id_grupo
                 WHERE g.id_grupo = @id AND m.id_usuario = @usuario
                """, new { id, usuario = usuario.Id });

            if (cabecalho is null) return Results.NotFound();

            var membros = await conexao.QueryAsync(
                """
                SELECT u.id_usuario AS "idUsuario", u.apelido, u.avatar_url AS "avatarUrl",
                       m.papel, m.saldo_cp AS "saldoCp"
                  FROM grupos.membro_grupo m
                  JOIN identidade.usuario u ON u.id_usuario = m.id_usuario
                 WHERE m.id_grupo = @id
                 ORDER BY m.saldo_cp DESC
                """, new { id });

            return Results.Ok(new { cabecalho.idGrupo, cabecalho.nome, cabecalho.descricao, membros });
        });

        grupo.MapPost("/", async (CriarGrupoRequest requisicao, IUsuarioAtual usuario,
            EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(requisicao.Nome))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["nome"] = ["Nome do grupo e obrigatorio."] });

            var novo = GrupoAmigos.Criar(requisicao.Nome.Trim(), requisicao.Descricao, usuario.Id);
            db.Grupos.Add(novo);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/grupos/{novo.IdGrupo}",
                new { idGrupo = novo.IdGrupo, novo.Nome, novo.Descricao });
        });

        grupo.MapPost("/{id:int}/convites", async (int id, IUsuarioAtual usuario,
            EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var membro = await db.Membros
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.IdGrupo == id && m.IdUsuario == usuario.Id, ct);

            if (membro is null || !membro.EhAdmin)
                return Results.Problem(
                    title: "Acesso negado.",
                    detail: "Apenas administradores do grupo podem gerar convites.",
                    statusCode: 403);

            var convite = ConviteGrupo.Gerar(id, usuario.Id, ValidadeConvite);
            db.Convites.Add(convite);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { convite.Codigo, convite.DataExpiracao });
        });

        grupo.MapPost("/entrar", async (EntrarGrupoRequest requisicao, IUsuarioAtual usuario,
            EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var codigo = requisicao.Codigo.Trim().ToUpperInvariant();
            var convite = await db.Convites.FirstOrDefaultAsync(c => c.Codigo == codigo, ct);

            if (convite is null)
                return Results.NotFound(new { erro = "Codigo invalido." });
            if (convite.Usado)
                return Results.Conflict(new { erro = "Este convite ja foi usado." });
            if (convite.Expirado)
                return Results.Conflict(new { erro = "Este convite expirou." });

            var jaMembro = await db.Membros
                .AnyAsync(m => m.IdGrupo == convite.IdGrupo && m.IdUsuario == usuario.Id, ct);
            if (jaMembro)
                return Results.Conflict(new { erro = "Voce ja participa deste grupo." });

            var alvo = await db.Grupos
                .Include(g => g.Membros)
                .FirstAsync(g => g.IdGrupo == convite.IdGrupo, ct);

            alvo.Admitir(usuario.Id);
            convite.Consumir(usuario.Id);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { idGrupo = alvo.IdGrupo, alvo.Nome });
        });
    }
}

public record CriarGrupoRequest(string Nome, string? Descricao);
public record EntrarGrupoRequest(string Codigo);
