using Dapper;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;

namespace EuDuvido.Api.Modules.Ranking.Features;

// Modulo somente leitura: nenhum Command, so Dapper. E o lado puro do CQRS.
public static class RankingEndpoints
{
    public static void MapRankingEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api").RequireAuthorization().WithTags("Ranking");

        grupo.MapGet("/ranking/grupos/{idGrupo:int}", async (int idGrupo, IUsuarioAtual usuario,
            IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            if (!await EhMembro(conexao, idGrupo, usuario.Id)) return Results.NotFound();

            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT u.apelido, u.avatar_url AS "avatarUrl", m.saldo_cp AS "saldoCp",
                       COUNT(DISTINCT p.id_desafio) AS "desafiosParticipadas",
                       COUNT(DISTINCT p.id_desafio) FILTER (
                           WHERE (a.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'VAI_CUMPRIR')
                              OR (a.status = 'FINALIZADA_PERDEU' AND p.escolha = 'NAO_VAI_CUMPRIR')
                       ) AS acertos,
                       COUNT(DISTINCT p.id_desafio) FILTER (
                           WHERE (a.status = 'FINALIZADA_CUMPRIU' AND p.escolha = 'NAO_VAI_CUMPRIR')
                              OR (a.status = 'FINALIZADA_PERDEU' AND p.escolha = 'VAI_CUMPRIR')
                       ) AS erros,
                       -- Subconsulta: somar no mesmo JOIN de desafios multiplicaria cada
                       -- premio pelo numero de desafios do grupo.
                       (SELECT COALESCE(SUM(t.valor), 0) FROM transacao_cp t
                         WHERE t.id_grupo = m.id_grupo AND t.id_usuario = m.id_usuario
                           AND t.tipo = 'PREMIO') AS "cpGanhoEmPremios"
                  FROM membro_grupo m
                  JOIN usuario u ON u.id_usuario = m.id_usuario
                  LEFT JOIN desafio a ON a.id_grupo = m.id_grupo
                  LEFT JOIN participante_desafio p
                         ON p.id_desafio = a.id_desafio AND p.id_usuario = m.id_usuario
                 WHERE m.id_grupo = @idGrupo
                 GROUP BY m.id_grupo, m.id_usuario, u.apelido, u.avatar_url, m.saldo_cp
                 ORDER BY m.saldo_cp DESC, acertos DESC
                """, new { idGrupo }));
        });

        grupo.MapGet("/ranking/grupos/{idGrupo:int}/maiores-desafios", async (int idGrupo,
            IUsuarioAtual usuario, IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            if (!await EhMembro(conexao, idGrupo, usuario.Id)) return Results.NotFound();

            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT a.id_desafio AS "idDesafio", a.titulo, c.nome AS categoria,
                       a.valor_cp AS "valorCp", COUNT(p.id_participante) AS participantes,
                       a.valor_cp * COUNT(p.id_participante) AS "poteTotalCp",
                       a.tipo_recompensa AS "tipoRecompensa", a.status
                  FROM desafio a
                  JOIN categoria_desafio c ON c.id_categoria = a.id_categoria
                  LEFT JOIN participante_desafio p ON p.id_desafio = a.id_desafio
                 WHERE a.id_grupo = @idGrupo
                 GROUP BY a.id_desafio, a.titulo, c.nome, a.valor_cp, a.tipo_recompensa, a.status
                 ORDER BY "poteTotalCp" DESC LIMIT 10
                """, new { idGrupo }));
        });

        grupo.MapGet("/perfil", async (IUsuarioAtual usuario, IConexaoLeitura leitura,
            CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);

            var dados = await conexao.QuerySingleAsync(
                """
                SELECT id_usuario AS "idUsuario", nome, apelido, email,
                       avatar_url AS "avatarUrl", data_cadastro AS "dataCadastro"
                  FROM usuario WHERE id_usuario = @id
                """, new { id = usuario.Id });

            var saldos = await conexao.QueryAsync(
                """
                SELECT g.id_grupo AS "idGrupo", g.nome AS grupo, m.saldo_cp AS "saldoCp"
                  FROM membro_grupo m
                  JOIN grupo_amigos g ON g.id_grupo = m.id_grupo
                 WHERE m.id_usuario = @id ORDER BY m.saldo_cp DESC
                """, new { id = usuario.Id });

            // Saldo corrente por window function - o ledger e a fonte da verdade.
            var extrato = await conexao.QueryAsync(
                """
                SELECT t.data_lancamento AS data, t.tipo, t.valor, t.descricao,
                       a.titulo AS desafio, g.nome AS grupo,
                       SUM(t.valor) OVER (PARTITION BY t.id_grupo
                                          ORDER BY t.data_lancamento, t.id_transacao)
                           AS "saldoApos"
                  FROM transacao_cp t
                  LEFT JOIN desafio a ON a.id_desafio = t.id_desafio
                  JOIN grupo_amigos g ON g.id_grupo = t.id_grupo
                 WHERE t.id_usuario = @id
                 ORDER BY t.data_lancamento DESC, t.id_transacao DESC LIMIT 50
                """, new { id = usuario.Id });

            var historico = await conexao.QuerySingleAsync(
                """
                SELECT (SELECT count(*) FROM desafio WHERE id_criador = @id) AS "desafiosCriadas",
                       (SELECT count(*) FROM participante_desafio WHERE id_usuario = @id) AS participacoes,
                       (SELECT count(*) FROM evidencia WHERE id_usuario = @id) AS "evidenciasEnviadas"
                """, new { id = usuario.Id });

            return Results.Ok(new { usuario = dados, saldos, extrato, historico });
        });
    }

    // O grupo e a fronteira de visibilidade: ranking so para quem e membro.
    private static async Task<bool> EhMembro(System.Data.IDbConnection conexao, int idGrupo, int idUsuario) =>
        await conexao.ExecuteScalarAsync<bool>(
            "SELECT EXISTS (SELECT 1 FROM membro_grupo WHERE id_grupo = @idGrupo AND id_usuario = @idUsuario)",
            new { idGrupo, idUsuario });
}
