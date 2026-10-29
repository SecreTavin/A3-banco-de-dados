using ErrorOr;
using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;

public record EnviarEvidenciaCommand(
    int IdDesafio, string TipoMidia, string UrlComprovante, string? Comentario);

public class EnviarEvidenciaHandler(EuDuvidoDbContext db)
{
    public async Task<ErrorOr<int>> Handle(
        EnviarEvidenciaCommand comando, int idUsuario, CancellationToken ct)
    {
        var desafio = await db.Desafios
            .Include(a => a.Participantes)
            .FirstOrDefaultAsync(a => a.IdDesafio == comando.IdDesafio, ct);

        if (desafio is null)
            return DesafioErrors.NaoEncontrado;
        if (!desafio.PodeReceberEvidencia)
            return EvidenciaErrors.DesafioNaoAceitaEvidencia;

        var desafiado = desafio.Participantes
            .FirstOrDefault(p => p.PapelDesafio == PapelDesafio.Desafiado);
        if (desafiado?.IdUsuario != idUsuario)
            return EvidenciaErrors.SomenteDesafiadoEnvia;

        var anteriores = await db.Evidencias
            .Where(e => e.IdDesafio == comando.IdDesafio)
            .Select(e => e.Status)
            .ToListAsync(ct);

        if (anteriores.Contains(StatusEvidencia.EmVotacao))
            return EvidenciaErrors.AnteriorEmVotacao;
        if (anteriores.Count >= Evidencia.MaximoPorDesafio)
            return EvidenciaErrors.LimiteAtingido;

        var url = comando.UrlComprovante.Trim();
        var comentario = string.IsNullOrWhiteSpace(comando.Comentario)
            ? null : comando.Comentario.Trim();

        // RN14: juri lido agora e congelado em jurado_evidencia. A prova vai
        // direto ao juri: e ele quem decide se ela vale.
        var elegiveis = await CarregarJuri(desafio.IdGrupo, desafio.IdDesafio, ct);

        var evidencia = Evidencia.Enviar(
            comando.IdDesafio, idUsuario, anteriores.Count + 1,
            comando.TipoMidia, url, comentario, elegiveis);

        if (evidencia.IsError) return evidencia.Errors;

        try
        {
            // Evidencia, juri e status do desafio commitam no mesmo SaveChanges.
            db.Evidencias.Add(evidencia.Value);
            desafio.MarcarEmVotacao();
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException e) when (e.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "unq_evidencia_ordem"
        })
        {
            // Outro envio do mesmo desafio passou na frente (RN10).
            return EvidenciaErrors.AnteriorEmVotacao;
        }

        return evidencia.Value.IdEvidencia;
    }

    // Membros do grupo menos DESAFIANTE e DESAFIADO (RN14). Lado de escrita:
    // le pelo EF, nunca por Dapper (CQRS).
    private async Task<List<int>> CarregarJuri(int idGrupo, int idDesafio, CancellationToken ct)
    {
        var partes = db.Participantes
            .Where(p => p.IdDesafio == idDesafio &&
                        (p.PapelDesafio == PapelDesafio.Desafiante ||
                         p.PapelDesafio == PapelDesafio.Desafiado))
            .Select(p => p.IdUsuario);

        return await db.Membros
            .Where(m => m.IdGrupo == idGrupo && !partes.Contains(m.IdUsuario))
            .Select(m => m.IdUsuario)
            .ToListAsync(ct);
    }
}
