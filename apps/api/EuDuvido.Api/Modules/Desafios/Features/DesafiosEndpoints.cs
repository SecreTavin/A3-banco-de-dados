using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace EuDuvido.Api.Modules.Desafios.Features;

public static class DesafiosEndpoints
{
    public static void MapDesafiosEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/categorias", async (IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT id_categoria AS "idCategoria", nome, descricao
                  FROM categoria_desafio ORDER BY nome
                """));
        }).RequireAuthorization().WithTags("Desafios");

        var grupo = app.MapGroup("/api/desafios").RequireAuthorization().WithTags("Desafios");

        grupo.MapGet("/", async (string? status, IUsuarioAtual usuario,
            IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT DISTINCT
                       a.id_desafio AS "idDesafio", a.titulo, a.status, a.valor_cp AS "valorCp",
                       a.tipo_recompensa AS "tipoRecompensa",
                       a.descricao_recompensa AS "descricaoRecompensa", a.data_limite AS "dataLimite",
                       c.nome AS categoria, g.nome AS grupo, a.id_grupo AS "idGrupo",
                       (a.id_criador = @id) AS "souCriador"
                  FROM desafio a
                  JOIN categoria_desafio c ON c.id_categoria = a.id_categoria
                  JOIN grupo_amigos g ON g.id_grupo = a.id_grupo
                  JOIN membro_grupo m ON m.id_grupo = a.id_grupo AND m.id_usuario = @id
                 WHERE (@status IS NULL OR a.status = @status)
                 ORDER BY a.data_limite
                """, new { id = usuario.Id, status }));
        });

        grupo.MapGet("/{id:int}", async (int id, IUsuarioAtual usuario,
            IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);

            var desafio = await conexao.QuerySingleOrDefaultAsync(
                """
                SELECT a.id_desafio AS "idDesafio", a.id_grupo AS "idGrupo", a.titulo, a.descricao,
                       a.status, a.valor_cp AS "valorCp", a.tipo_recompensa AS "tipoRecompensa",
                       a.descricao_recompensa AS "descricaoRecompensa",
                       a.data_limite AS "dataLimite", a.data_encerramento AS "dataEncerramento",
                       a.motivo_cancelamento AS "motivoCancelamento",
                       c.nome AS categoria, g.nome AS grupo,
                       (a.id_criador = @usuario) AS "souCriador"
                  FROM desafio a
                  JOIN categoria_desafio c ON c.id_categoria = a.id_categoria
                  JOIN grupo_amigos g ON g.id_grupo = a.id_grupo
                  -- So quem e do grupo enxerga o desafio: o grupo e a fronteira de visibilidade.
                  JOIN membro_grupo m ON m.id_grupo = a.id_grupo AND m.id_usuario = @usuario
                 WHERE a.id_desafio = @id
                """, new { id, usuario = usuario.Id });

            if (desafio is null) return Results.NotFound();

            var participantes = await conexao.QueryAsync(
                """
                SELECT u.id_usuario AS "idUsuario", u.apelido, u.avatar_url AS "avatarUrl",
                       p.papel_desafio AS "papelDesafio", p.escolha
                  FROM participante_desafio p
                  JOIN usuario u ON u.id_usuario = p.id_usuario
                 WHERE p.id_desafio = @id ORDER BY p.id_participante
                """, new { id });

            var evidencias = await conexao.QueryAsync(
                """
                SELECT e.id_evidencia AS "idEvidencia", e.ordem, e.tipo_midia AS "tipoMidia",
                       e.url_comprovante AS "urlComprovante", e.comentario, e.status,
                       e.data_envio AS "dataEnvio", e.data_limite_votacao AS "dataLimiteVotacao",
                       v.votos_favoraveis AS "votosFavoraveis", v.votos_contra AS "votosContra",
                       v.quorum, v.total_validadores AS "totalValidadores"
                  FROM evidencia e
                  JOIN vw_status_votacao v ON v.id_evidencia = e.id_evidencia
                 WHERE e.id_desafio = @id ORDER BY e.ordem
                """, new { id });

            return Results.Ok(new
            {
                desafio.idDesafio, desafio.idGrupo, desafio.titulo, desafio.descricao, desafio.status,
                desafio.valorCp, desafio.tipoRecompensa, desafio.descricaoRecompensa,
                desafio.dataLimite, desafio.dataEncerramento, desafio.motivoCancelamento,
                desafio.categoria, desafio.grupo, desafio.souCriador,
                participantes, evidencias
            });
        });

        grupo.MapPost("/", async (
            CriarDesafioCommand comando,
            IValidator<CriarDesafioCommand> validador,
            CriarDesafioHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp(id => Results.Created($"/api/desafios/{id}",
                new { idDesafio = id }));
        })
        .WithName("CriarDesafio")
        .WithSummary("Cria o desafio depois de a IA moderar a proposta no nivel do grupo (RN28).");

        grupo.MapPost("/{id:int}/participantes", async (int id, AceitarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (requisicao.PapelDesafio is not (PapelDesafio.Desafiante or PapelDesafio.Desafiado
                    or PapelDesafio.Apostador) ||
                requisicao.Escolha is not (Escolha.VaiCumprir or Escolha.NaoVaiCumprir))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["papelDesafio"] = ["Papel ou escolha invalidos."] });

            var desafio = await db.Desafios
                .Include(a => a.Participantes)
                .FirstOrDefaultAsync(a => a.IdDesafio == id, ct);

            if (desafio is null) return Results.NotFound();

            var saldo = await db.Membros
                .Where(m => m.IdGrupo == desafio.IdGrupo && m.IdUsuario == usuario.Id)
                .Select(m => (int?)m.SaldoCp)
                .FirstOrDefaultAsync(ct);

            if (saldo is null) return Results.Forbid();
            if (saldo < desafio.ValorCp)
            {
                ErrorOr.ErrorOr<Success> insuficiente =
                    DesafioErrors.SaldoInsuficiente(saldo.Value, desafio.ValorCp);
                return insuficiente.ToHttp();
            }

            var resultado = desafio.Aceitar(usuario.Id, requisicao.PapelDesafio, requisicao.Escolha);
            if (resultado.IsError) return resultado.ToHttp();

            // O debito e a entrada no desafio precisam commitar juntos (RN18).
            var estrategia = db.Database.CreateExecutionStrategy();
            await estrategia.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync(ct);
                await db.SaveChangesAsync(ct);
                await db.Database.ExecuteSqlRawAsync(
                    "CALL debitar_escrow(@a, @u)",
                    [new NpgsqlParameter("a", NpgsqlDbType.Integer) { Value = id },
                     new NpgsqlParameter("u", NpgsqlDbType.Integer) { Value = usuario.Id }], ct);
                await tx.CommitAsync(ct);
            });

            return Results.Ok(new { idDesafio = id, status = desafio.Status });
        });

        grupo.MapPost("/{id:int}/cancelar", async (int id, CancelarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var desafio = await db.Desafios.FirstOrDefaultAsync(a => a.IdDesafio == id, ct);
            if (desafio is null) return Results.NotFound();

            var permitido = desafio.Cancelar(usuario.Id, requisicao.Motivo);
            if (permitido.IsError) return permitido.ToHttp();

            // Estorno e mudanca de status vivem na procedure (RN12).
            await db.Database.ExecuteSqlRawAsync(
                "CALL cancelar_desafio(@a, @m)",
                [new NpgsqlParameter("a", NpgsqlDbType.Integer) { Value = id },
                 new NpgsqlParameter("m", NpgsqlDbType.Varchar) { Value = requisicao.Motivo }], ct);

            return Results.Ok(new { idDesafio = id, status = "CANCELADA" });
        });
    }
}

public record AceitarRequest(string PapelDesafio, string Escolha);
public record CancelarRequest(string Motivo);
