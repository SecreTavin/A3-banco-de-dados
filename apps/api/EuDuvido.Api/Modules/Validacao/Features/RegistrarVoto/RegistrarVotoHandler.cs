using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Validacao.Domain;
using EuDuvido.Api.Modules.Validacao.Infrastructure;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Realtime;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;

public class RegistrarVotoHandler(
    EuDuvidoDbContext db,
    IApuracao apuracao,
    IConexaoLeitura leitura,
    INotificadorVotacao notificador)
{
    public async Task<ErrorOr<VotoRegistradoResponse>> Handle(
        RegistrarVotoCommand comando, int idUsuario, CancellationToken ct)
    {
        var evidencia = await db.Evidencias
            .Include(e => e.Jurados)
            .FirstOrDefaultAsync(e => e.IdEvidencia == comando.IdEvidencia, ct);

        if (evidencia is null)
            return EvidenciaErrors.NaoEncontrada;

        // Votar e preencher a linha do jurado congelado (UPDATE em jurado_evidencia).
        var voto = evidencia.Votar(idUsuario, comando.Voto, comando.Justificativa);
        if (voto.IsError)
            return voto.Errors;

        var estrategia = db.Database.CreateExecutionStrategy();
        await estrategia.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await db.SaveChangesAsync(ct);
            await apuracao.ApurarAsync(comando.IdEvidencia, ct);
            await tx.CommitAsync(ct);
        });

        // Estado lido depois do commit: a procedure pode ter fechado a aposta.
        var estado = await LerEstado(comando.IdEvidencia, ct);

        await notificador.VotacaoAtualizada(estado.IdGrupo, estado.IdEvidencia, estado);
        if (estado.StatusAposta is not null && estado.StatusAposta.StartsWith("FINALIZADA"))
            await notificador.ApostaEncerrada(estado.IdGrupo, estado.IdAposta, estado.StatusAposta);

        return new VotoRegistradoResponse(
            estado.IdEvidencia, estado.Status, estado.TotalVotos, estado.VotosFavoraveis,
            estado.VotosContra, estado.Quorum, estado.VotosFaltantes, estado.StatusAposta);
    }

    private async Task<EstadoVotacao> LerEstado(int idEvidencia, CancellationToken ct)
    {
        using var conexao = await leitura.AbrirAsync(ct);
        return await conexao.QuerySingleAsync<EstadoVotacao>(
            """
            SELECT v.id_evidencia      AS "IdEvidencia",
                   v.id_aposta         AS "IdAposta",
                   v.id_grupo          AS "IdGrupo",
                   v.status            AS "Status",
                   v.total_votos::int  AS "TotalVotos",
                   v.votos_favoraveis::int AS "VotosFavoraveis",
                   v.votos_contra::int AS "VotosContra",
                   v.quorum::int       AS "Quorum",
                   v.votos_faltantes::int AS "VotosFaltantes",
                   a.status            AS "StatusAposta"
              FROM vw_status_votacao v
              JOIN aposta a ON a.id_aposta = v.id_aposta
             WHERE v.id_evidencia = @idEvidencia
            """,
            new { idEvidencia });
    }

    private record EstadoVotacao(
        int IdEvidencia, int IdAposta, int IdGrupo, string Status,
        int TotalVotos, int VotosFavoraveis, int VotosContra,
        int Quorum, int VotosFaltantes, string? StatusAposta);
}
