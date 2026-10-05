using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Grupos.Domain;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace EuDuvido.Api.Modules.Grupos.Features;

public static class GruposEndpoints
{
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
                       m.papel, g.nivel_filtro AS "nivelFiltro",
                       (SELECT count(*) FROM membro_grupo x
                         WHERE x.id_grupo = g.id_grupo) AS "totalMembros"
                  FROM grupo_amigos g
                  JOIN membro_grupo m ON m.id_grupo = g.id_grupo
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
                SELECT g.id_grupo AS "idGrupo", g.nome, g.descricao,
                       g.nivel_filtro AS "nivelFiltro", m.papel AS "meuPapel"
                  FROM grupo_amigos g
                  JOIN membro_grupo m ON m.id_grupo = g.id_grupo
                 WHERE g.id_grupo = @id AND m.id_usuario = @usuario
                """, new { id, usuario = usuario.Id });

            if (cabecalho is null) return Results.NotFound();

            var membros = await conexao.QueryAsync(
                """
                SELECT u.id_usuario AS "idUsuario", u.apelido, u.avatar_url AS "avatarUrl",
                       m.papel, m.saldo_cp AS "saldoCp"
                  FROM membro_grupo m
                  JOIN usuario u ON u.id_usuario = m.id_usuario
                 WHERE m.id_grupo = @id
                 ORDER BY m.saldo_cp DESC
                """, new { id });

            return Results.Ok(new
            {
                cabecalho.idGrupo, cabecalho.nome, cabecalho.descricao,
                cabecalho.nivelFiltro, cabecalho.meuPapel, membros
            });
        });

        grupo.MapPost("/", async (CriarGrupoRequest requisicao, IUsuarioAtual usuario,
            EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var nivel = requisicao.NivelFiltro ?? NiveisFiltro.Padrao;
            var erros = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(requisicao.Nome))
                erros["nome"] = ["Nome do grupo e obrigatorio."];
            if (!NiveisFiltro.Todos.Contains(nivel))
                erros["nivelFiltro"] = ["Nivel de filtro deve ser LEVE, MODERADO ou PESADO."];
            if (erros.Count > 0)
                return Results.ValidationProblem(erros);

            var novo = GrupoAmigos.Criar(
                requisicao.Nome.Trim(), requisicao.Descricao, usuario.Id, nivel);
            db.Grupos.Add(novo);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/grupos/{novo.IdGrupo}",
                new { idGrupo = novo.IdGrupo, novo.Nome, novo.Descricao, novo.NivelFiltro });
        });

        grupo.MapPatch("/{id:int}/nivel-filtro", async (int id, AlterarNivelFiltroRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (!NiveisFiltro.Todos.Contains(requisicao.NivelFiltro))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["nivelFiltro"] = ["Nivel de filtro deve ser LEVE, MODERADO ou PESADO."] });

            var alvo = await CarregarComMembros(db, id, usuario.Id, ct);
            if (alvo is null) return Results.NotFound();

            var resultado = alvo.AlterarNivelFiltro(usuario.Id, requisicao.NivelFiltro);
            if (resultado.IsError) return resultado.ToHttp();

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { idGrupo = id, alvo.NivelFiltro });
        })
        .WithSummary("Altera o nivel de filtro da moderacao por IA. So ADMIN (RN27).");

        grupo.MapPost("/{id:int}/membros", async (int id, AdicionarMembroRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(requisicao.Email))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["email"] = ["Informe o e-mail de quem vai entrar."] });

            var alvo = await CarregarComMembros(db, id, usuario.Id, ct);
            if (alvo is null) return Results.NotFound();

            // RN05: a identidade e o e-mail.
            var email = requisicao.Email.Trim().ToLowerInvariant();
            var convidado = await db.Usuarios
                .Where(u => u.Email.ToLower() == email)
                .Select(u => new { u.IdUsuario, u.Apelido })
                .FirstOrDefaultAsync(ct);

            if (convidado is null)
                return ((ErrorOr<Success>)GrupoErrors.UsuarioNaoEncontrado).ToHttp();

            var admitido = alvo.Admitir(usuario.Id, convidado.IdUsuario);
            if (admitido.IsError) return admitido.ToHttp();

            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/grupos/{id}",
                new { convidado.IdUsuario, convidado.Apelido });
        })
        .WithSummary("ADMIN adiciona um usuario ja cadastrado, pelo e-mail (RN25).");

        grupo.MapDelete("/{id:int}/membros/{idUsuario:int}", async (int id, int idUsuario,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var alvo = await CarregarComMembros(db, id, usuario.Id, ct);
            if (alvo is null) return Results.NotFound();

            var permitido = alvo.PodeRemover(usuario.Id, idUsuario);
            if (permitido.IsError) return permitido.ToHttp();

            try
            {
                // Lancamento de saida + DELETE na mesma procedure (RN25, RN24).
                await db.Database.ExecuteSqlRawAsync(
                    "CALL remover_membro(@g, @u)",
                    [new NpgsqlParameter("g", NpgsqlDbType.Integer) { Value = id },
                     new NpgsqlParameter("u", NpgsqlDbType.Integer) { Value = idUsuario }], ct);
            }
            catch (PostgresException e) when (e.SqlState == "EUD01")
            {
                // A procedure recusa quem tem aposta ou juri em curso: regra de
                // negocio garantida no banco, devolvida como conflito.
                return ((ErrorOr<Success>)GrupoErrors.MembroComPendencias).ToHttp();
            }

            return Results.NoContent();
        })
        .WithSummary("ADMIN remove um membro, ou o proprio membro sai do grupo (RN25).");
    }

    // So devolve o grupo para quem e membro dele: quem esta de fora recebe 404,
    // sem descobrir se o grupo existe.
    private static async Task<GrupoAmigos?> CarregarComMembros(
        EuDuvidoDbContext db, int idGrupo, int idUsuario, CancellationToken ct)
    {
        var grupo = await db.Grupos
            .Include(g => g.Membros)
            .FirstOrDefaultAsync(g => g.IdGrupo == idGrupo, ct);

        return grupo is not null && grupo.Membros.Any(m => m.IdUsuario == idUsuario)
            ? grupo
            : null;
    }
}

public record CriarGrupoRequest(string Nome, string? Descricao, string? NivelFiltro);
public record AlterarNivelFiltroRequest(string NivelFiltro);
public record AdicionarMembroRequest(string Email);
