using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Apostas.Domain;
using EuDuvido.Api.Modules.Apostas.Features.CriarAposta;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace EuDuvido.Api.Modules.Apostas.Features;

public static class ApostasEndpoints
{
    public static void MapApostasEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/categorias", async (IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT id_categoria AS "idCategoria", nome, descricao
                  FROM categoria_desafio ORDER BY nome
                """));
        }).RequireAuthorization().WithTags("Apostas");

        var grupo = app.MapGroup("/api/apostas").RequireAuthorization().WithTags("Apostas");

        grupo.MapGet("/", async (string? status, IUsuarioAtual usuario,
            IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT DISTINCT
                       a.id_aposta AS "idAposta", a.titulo, a.status, a.valor_cp AS "valorCp",
                       a.tipo_recompensa AS "tipoRecompensa",
                       a.descricao_recompensa AS "descricaoRecompensa", a.data_limite AS "dataLimite",
                       c.nome AS categoria, g.nome AS grupo, a.id_grupo AS "idGrupo",
                       (a.id_criador = @id) AS "souCriador"
                  FROM aposta a
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

            var aposta = await conexao.QuerySingleOrDefaultAsync(
                """
                SELECT a.id_aposta AS "idAposta", a.id_grupo AS "idGrupo", a.titulo, a.descricao,
                       a.status, a.valor_cp AS "valorCp", a.tipo_recompensa AS "tipoRecompensa",
                       a.descricao_recompensa AS "descricaoRecompensa",
                       a.data_limite AS "dataLimite", a.data_encerramento AS "dataEncerramento",
                       a.motivo_cancelamento AS "motivoCancelamento",
                       c.nome AS categoria, g.nome AS grupo,
                       (a.id_criador = @usuario) AS "souCriador"
                  FROM aposta a
                  JOIN categoria_desafio c ON c.id_categoria = a.id_categoria
                  JOIN grupo_amigos g ON g.id_grupo = a.id_grupo
                  -- So quem e do grupo enxerga a aposta: o grupo e a fronteira de visibilidade.
                  JOIN membro_grupo m ON m.id_grupo = a.id_grupo AND m.id_usuario = @usuario
                 WHERE a.id_aposta = @id
                """, new { id, usuario = usuario.Id });

            if (aposta is null) return Results.NotFound();

            var participantes = await conexao.QueryAsync(
                """
                SELECT u.id_usuario AS "idUsuario", u.apelido, u.avatar_url AS "avatarUrl",
                       p.papel_aposta AS "papelAposta", p.escolha
                  FROM participante_aposta p
                  JOIN usuario u ON u.id_usuario = p.id_usuario
                 WHERE p.id_aposta = @id ORDER BY p.id_participante
                """, new { id });

            var evidencias = await conexao.QueryAsync(
                """
                SELECT e.id_evidencia AS "idEvidencia", e.ordem, e.tipo_midia AS "tipoMidia",
                       e.url_comprovante AS "urlComprovante", e.comentario, e.status,
                       e.data_envio AS "dataEnvio", e.data_limite_votacao AS "dataLimiteVotacao",
                       v.votos_favoraveis AS "votosFavoraveis", v.votos_contra AS "votosContra",
                       v.quorum, v.total_validadores AS "totalValidadores",
                       ve.parecer AS "parecerIa"
                  FROM evidencia e
                  JOIN vw_status_votacao v ON v.id_evidencia = e.id_evidencia
                  LEFT JOIN verificacao_evidencia ve ON ve.id_evidencia = e.id_evidencia
                 WHERE e.id_aposta = @id ORDER BY e.ordem
                """, new { id });

            return Results.Ok(new
            {
                aposta.idAposta, aposta.idGrupo, aposta.titulo, aposta.descricao, aposta.status,
                aposta.valorCp, aposta.tipoRecompensa, aposta.descricaoRecompensa,
                aposta.dataLimite, aposta.dataEncerramento, aposta.motivoCancelamento,
                aposta.categoria, aposta.grupo, aposta.souCriador,
                participantes, evidencias
            });
        });

        grupo.MapPost("/", async (
            CriarApostaCommand comando,
            IValidator<CriarApostaCommand> validador,
            CriarApostaHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp(id => Results.Created($"/api/apostas/{id}",
                new { idAposta = id }));
        })
        .WithName("CriarAposta")
        .WithSummary("Cria a aposta depois de a IA moderar o desafio no nivel do grupo (RN28).");

        grupo.MapPost("/{id:int}/participantes", async (int id, AceitarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (requisicao.PapelAposta is not (PapelAposta.Desafiante or PapelAposta.Desafiado
                    or PapelAposta.Apostador) ||
                requisicao.Escolha is not (Escolha.VaiCumprir or Escolha.NaoVaiCumprir))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["papelAposta"] = ["Papel ou escolha invalidos."] });

            var aposta = await db.Apostas
                .Include(a => a.Participantes)
                .FirstOrDefaultAsync(a => a.IdAposta == id, ct);

            if (aposta is null) return Results.NotFound();

            var saldo = await db.Membros
                .Where(m => m.IdGrupo == aposta.IdGrupo && m.IdUsuario == usuario.Id)
                .Select(m => (int?)m.SaldoCp)
                .FirstOrDefaultAsync(ct);

            if (saldo is null) return Results.Forbid();
            if (saldo < aposta.ValorCp)
            {
                ErrorOr.ErrorOr<Success> insuficiente =
                    ApostaErrors.SaldoInsuficiente(saldo.Value, aposta.ValorCp);
                return insuficiente.ToHttp();
            }

            var resultado = aposta.Aceitar(usuario.Id, requisicao.PapelAposta, requisicao.Escolha);
            if (resultado.IsError) return resultado.ToHttp();

            // O debito e a entrada na aposta precisam commitar juntos (RN18).
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

            return Results.Ok(new { idAposta = id, status = aposta.Status });
        });

        grupo.MapPost("/{id:int}/cancelar", async (int id, CancelarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var aposta = await db.Apostas.FirstOrDefaultAsync(a => a.IdAposta == id, ct);
            if (aposta is null) return Results.NotFound();

            var permitido = aposta.Cancelar(usuario.Id, requisicao.Motivo);
            if (permitido.IsError) return permitido.ToHttp();

            // Estorno e mudanca de status vivem na procedure (RN12).
            await db.Database.ExecuteSqlRawAsync(
                "CALL cancelar_aposta(@a, @m)",
                [new NpgsqlParameter("a", NpgsqlDbType.Integer) { Value = id },
                 new NpgsqlParameter("m", NpgsqlDbType.Varchar) { Value = requisicao.Motivo }], ct);

            return Results.Ok(new { idAposta = id, status = "CANCELADA" });
        });
    }
}

public record AceitarRequest(string PapelAposta, string Escolha);
public record CancelarRequest(string Motivo);
