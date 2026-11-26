using System.Data;
using Dapper;

namespace EuDuvido.Api.Modules.Validacao.Features.MinhasProvas;

// O jurado de uma prova, com o voto e a justificativa (RF07).
public record VotoDaProva(int IdEvidencia, int IdUsuario, string Apelido, string? AvatarUrl, bool Votou,
    string? Voto, string? Justificativa, DateTime? DataVoto);

public record ProvaNoJuri(int IdEvidencia, int IdDesafio, string Desafio, int IdGrupo, string Grupo, int Ordem,
    string? Comentario, DateTime DataLimiteVotacao, int TotalValidadores, int Quorum, int VotosFavoraveis,
    int VotosContra, int VotosFaltantes)
{
    public IReadOnlyList<VotoDaProva> Jurados { get; init; } = [];
}

// As provas que o proprio usuario enviou e que estao no juri: o desafiado acompanha
// o placar e os comentarios na aba Votacao (#83). Quem enviou nunca e jurado da
// propria prova (RN14), entao a RN29 nao esconde nada aqui.
public static class MinhasProvasNoJuri
{
    public static async Task<IReadOnlyList<ProvaNoJuri>> LerAsync(IDbConnection conexao, int idUsuario)
    {
        var provas = (await conexao.QueryAsync<ProvaNoJuri>(
            """
            SELECT v.id_evidencia AS IdEvidencia, v.id_desafio AS IdDesafio, v.desafio AS Desafio,
                   v.id_grupo AS IdGrupo, g.nome AS Grupo, e.ordem AS Ordem, e.comentario AS Comentario,
                   e.data_limite_votacao AS DataLimiteVotacao,
                   v.total_validadores::int AS TotalValidadores, v.quorum::int AS Quorum,
                   v.votos_favoraveis::int AS VotosFavoraveis, v.votos_contra::int AS VotosContra,
                   v.votos_faltantes::int AS VotosFaltantes
              FROM vw_status_votacao v
              JOIN evidencia e ON e.id_evidencia = v.id_evidencia
              JOIN grupo_amigos g ON g.id_grupo = v.id_grupo
             WHERE v.status = 'EM_VOTACAO' AND e.id_usuario = @id
             ORDER BY e.data_limite_votacao
            """, new { id = idUsuario })).ToList();

        if (provas.Count == 0) return provas;

        var votos = (await conexao.QueryAsync<VotoDaProva>(
            """
            SELECT j.id_evidencia AS IdEvidencia, j.id_usuario AS IdUsuario, u.apelido AS Apelido,
                   u.avatar_url AS AvatarUrl, (j.voto IS NOT NULL) AS Votou, j.voto AS Voto,
                   j.justificativa AS Justificativa, j.data_voto AS DataVoto
              FROM jurado_evidencia j
              JOIN usuario u ON u.id_usuario = j.id_usuario
             WHERE j.id_evidencia = ANY(@ids)
             ORDER BY j.data_voto NULLS LAST, u.apelido
            """, new { ids = provas.Select(p => p.IdEvidencia).ToArray() })).ToLookup(v => v.IdEvidencia);

        return [.. provas.Select(p => p with { Jurados = [.. votos[p.IdEvidencia]] })];
    }
}
