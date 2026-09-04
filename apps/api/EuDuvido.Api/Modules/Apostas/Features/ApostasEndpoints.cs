using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Apostas.Domain;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
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
                  FROM apostas.categoria_desafio ORDER BY nome
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
                       a.tipo_recompensa AS "tipoRecompensa", a.valor_monetario AS "valorMonetario",
                       a.descricao_prenda AS "descricaoPrenda", a.data_limite AS "dataLimite",
                       c.nome AS categoria, g.nome AS grupo, a.id_grupo AS "idGrupo",
                       (a.id_criador = @id) AS "souCriador"
                  FROM apostas.aposta a
                  JOIN apostas.categoria_desafio c ON c.id_categoria = a.id_categoria
                  JOIN grupos.grupo_amigos g ON g.id_grupo = a.id_grupo
                  JOIN grupos.membro_grupo m ON m.id_grupo = a.id_grupo AND m.id_usuario = @id
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
                       a.valor_monetario AS "valorMonetario", a.descricao_prenda AS "descricaoPrenda",
                       a.data_limite AS "dataLimite", a.data_encerramento AS "dataEncerramento",
                       a.motivo_cancelamento AS "motivoCancelamento",
                       c.nome AS categoria, g.nome AS grupo,
                       (a.id_criador = @usuario) AS "souCriador"
                  FROM apostas.aposta a
                  JOIN apostas.categoria_desafio c ON c.id_categoria = a.id_categoria
                  JOIN grupos.grupo_amigos g ON g.id_grupo = a.id_grupo
                 WHERE a.id_aposta = @id
                """, new { id, usuario = usuario.Id });

            if (aposta is null) return Results.NotFound();

            var participantes = await conexao.QueryAsync(
                """
                SELECT u.id_usuario AS "idUsuario", u.apelido, u.avatar_url AS "avatarUrl",
                       p.papel_aposta AS "papelAposta", p.escolha
                  FROM apostas.participante_aposta p
                  JOIN identidade.usuario u ON u.id_usuario = p.id_usuario
                 WHERE p.id_aposta = @id ORDER BY p.id_participante
                """, new { id });

            var evidencias = await conexao.QueryAsync(
                """
                SELECT e.id_evidencia AS "idEvidencia", e.ordem, e.tipo_midia AS "tipoMidia",
                       e.url_comprovante AS "urlComprovante", e.comentario, e.status,
                       e.data_envio AS "dataEnvio", e.data_limite_votacao AS "dataLimiteVotacao",
                       v.votos_favoraveis AS "votosFavoraveis", v.votos_contra AS "votosContra",
                       v.quorum, v.total_validadores AS "totalValidadores"
                  FROM validacao.evidencia e
                  JOIN validacao.vw_status_votacao v ON v.id_evidencia = e.id_evidencia
                 WHERE e.id_aposta = @id ORDER BY e.ordem
                """, new { id });

            var comentarios = await conexao.QueryAsync(
                """
                SELECT c.id_comentario AS "idComentario", u.apelido, u.avatar_url AS "avatarUrl",
                       c.texto, c.data_envio AS "dataEnvio"
                  FROM apostas.comentario_aposta c
                  JOIN identidade.usuario u ON u.id_usuario = c.id_usuario
                 WHERE c.id_aposta = @id ORDER BY c.data_envio
                """, new { id });

            return Results.Ok(new
            {
                aposta.idAposta, aposta.idGrupo, aposta.titulo, aposta.descricao, aposta.status,
                aposta.valorCp, aposta.tipoRecompensa, aposta.valorMonetario,
                aposta.descricaoPrenda, aposta.dataLimite, aposta.dataEncerramento,
                aposta.motivoCancelamento, aposta.categoria, aposta.grupo, aposta.souCriador,
                participantes, evidencias, comentarios
            });
        });

        grupo.MapPost("/", async (CriarApostaRequest requisicao, IUsuarioAtual usuario,
            EuDuvidoDbContext db, CancellationToken ct) =>
        {
            var erros = ValidarCriacao(requisicao);
            if (erros.Count > 0) return Results.ValidationProblem(erros);

            var ehMembro = await db.Membros.AnyAsync(
                m => m.IdGrupo == requisicao.IdGrupo && m.IdUsuario == usuario.Id, ct);
            if (!ehMembro) return Results.Forbid();

            var aposta = Aposta.Criar(
                requisicao.IdGrupo, usuario.Id, requisicao.IdCategoria,
                requisicao.Titulo.Trim(), requisicao.Descricao.Trim(), requisicao.ValorCp,
                requisicao.TipoRecompensa, requisicao.ValorMonetario,
                requisicao.DescricaoPrenda, requisicao.DataLimite);

            db.Apostas.Add(aposta);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/apostas/{aposta.IdAposta}",
                new { idAposta = aposta.IdAposta });
        });

        grupo.MapPost("/{id:int}/participantes", async (int id, AceitarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
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
                    "CALL economia.debitar_escrow(@a, @u)",
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
                "CALL apostas.cancelar_aposta(@a, @m)",
                [new NpgsqlParameter("a", NpgsqlDbType.Integer) { Value = id },
                 new NpgsqlParameter("m", NpgsqlDbType.Varchar) { Value = requisicao.Motivo }], ct);

            return Results.Ok(new { idAposta = id, status = "CANCELADA" });
        });

        grupo.MapPost("/{id:int}/comentarios", async (int id, ComentarRequest requisicao,
            IUsuarioAtual usuario, EuDuvidoDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(requisicao.Texto))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                    { ["texto"] = ["Comentario vazio."] });

            db.Comentarios.Add(ComentarioAposta.Novo(id, usuario.Id, requisicao.Texto));
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
    }

    private static Dictionary<string, string[]> ValidarCriacao(CriarApostaRequest r)
    {
        var erros = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(r.Titulo))
            erros["titulo"] = ["Titulo e obrigatorio."];
        if (string.IsNullOrWhiteSpace(r.Descricao))
            erros["descricao"] = ["Descricao e obrigatoria."];
        if (r.ValorCp <= 0)
            erros["valorCp"] = ["A aposta precisa custar ao menos 1 CP."];
        if (r.DataLimite <= DateTimeOffset.UtcNow)
            erros["dataLimite"] = ["O prazo precisa estar no futuro."];
        if (r.TipoRecompensa == TipoRecompensa.Monetaria && r.ValorMonetario is <= 0)
            erros["valorMonetario"] = ["Valor monetario precisa ser maior que zero."];
        if (r.TipoRecompensa != TipoRecompensa.Monetaria &&
            string.IsNullOrWhiteSpace(r.DescricaoPrenda))
            erros["descricaoPrenda"] = ["Descreva a prenda combinada."];

        return erros;
    }
}

public record CriarApostaRequest(
    int IdGrupo, int IdCategoria, string Titulo, string Descricao, int ValorCp,
    string TipoRecompensa, decimal? ValorMonetario, string? DescricaoPrenda,
    DateTimeOffset DataLimite);

public record AceitarRequest(string PapelAposta, string Escolha);
public record CancelarRequest(string Motivo);
public record ComentarRequest(string Texto);
