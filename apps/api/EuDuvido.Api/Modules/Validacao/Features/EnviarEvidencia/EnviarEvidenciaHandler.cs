using ErrorOr;
using EuDuvido.Api.Modules.Apostas.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using EuDuvido.Api.Modules.Validacao.Infrastructure;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;

public record EnviarEvidenciaCommand(
    int IdAposta, string TipoMidia, string UrlComprovante, string? Comentario);

public record EvidenciaEnviadaResponse(int IdEvidencia, string ParecerIa);

public class EnviarEvidenciaHandler(EuDuvidoDbContext db, IVerificadorEvidencia verificador)
{
    public async Task<ErrorOr<EvidenciaEnviadaResponse>> Handle(
        EnviarEvidenciaCommand comando, int idUsuario, CancellationToken ct)
    {
        var aposta = await db.Apostas
            .Include(a => a.Participantes)
            .FirstOrDefaultAsync(a => a.IdAposta == comando.IdAposta, ct);

        if (aposta is null)
            return ApostaErrors.NaoEncontrada;
        if (!aposta.PodeReceberEvidencia)
            return EvidenciaErrors.ApostaNaoAceitaEvidencia;

        var desafiado = aposta.Participantes
            .FirstOrDefault(p => p.PapelAposta == PapelAposta.Desafiado);
        if (desafiado?.IdUsuario != idUsuario)
            return EvidenciaErrors.SomenteDesafiadoEnvia;

        var anteriores = await db.Evidencias
            .Where(e => e.IdAposta == comando.IdAposta)
            .Select(e => e.Status)
            .ToListAsync(ct);

        if (anteriores.Contains(StatusEvidencia.EmVotacao))
            return EvidenciaErrors.AnteriorEmVotacao;
        if (anteriores.Count >= Evidencia.MaximoPorAposta)
            return EvidenciaErrors.LimiteAtingido;

        var url = comando.UrlComprovante.Trim();
        var comentario = string.IsNullOrWhiteSpace(comando.Comentario)
            ? null : comando.Comentario.Trim();

        // Triagem da IA antes do juri (ADR 0017), fora de transacao: a analise
        // de uma foto pode levar dezenas de segundos.
        var verificacao = await verificador.VerificarAsync(
            aposta.Titulo, aposta.Descricao, comando.TipoMidia, url, comentario, ct);
        if (verificacao.IsError)
            return verificacao.Errors;

        var registro = VerificacaoEvidencia.Registrar(
            aposta.IdAposta, idUsuario, comando.TipoMidia, url, comentario,
            verificacao.Value.Aprovado, verificacao.Value.Parecer);

        if (!registro.Aprovado)
        {
            // Nao vira evidencia nem gasta tentativa, mas a analise fica gravada.
            db.Verificacoes.Add(registro);
            await db.SaveChangesAsync(ct);
            return EvidenciaErrors.ProvaRecusada(registro.Parecer);
        }

        // RN14: juri lido agora e congelado em jurado_evidencia.
        var elegiveis = await CarregarJuri(aposta.IdGrupo, aposta.IdAposta, ct);

        var evidencia = Evidencia.Enviar(
            comando.IdAposta, idUsuario, anteriores.Count + 1,
            comando.TipoMidia, url, comentario, elegiveis);

        if (evidencia.IsError) return evidencia.Errors;

        try
        {
            // Evidencia, juri, status da aposta e verificacao commitam juntos.
            var estrategia = db.Database.CreateExecutionStrategy();
            await estrategia.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync(ct);
                db.Evidencias.Add(evidencia.Value);
                aposta.MarcarEmVotacao();
                await db.SaveChangesAsync(ct);

                registro.VincularEvidencia(evidencia.Value.IdEvidencia);
                db.Verificacoes.Add(registro);
                await db.SaveChangesAsync(ct);

                await tx.CommitAsync(ct);
            });
        }
        catch (DbUpdateException e) when (e.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "unq_evidencia_ordem"
        })
        {
            // Outro envio da mesma aposta passou na frente enquanto a IA analisava.
            return EvidenciaErrors.AnteriorEmVotacao;
        }

        return new EvidenciaEnviadaResponse(evidencia.Value.IdEvidencia, registro.Parecer);
    }

    // Membros do grupo menos DESAFIANTE e DESAFIADO (RN14). Lado de escrita:
    // le pelo EF, nunca por Dapper (CQRS).
    private async Task<List<int>> CarregarJuri(int idGrupo, int idAposta, CancellationToken ct)
    {
        var partes = db.Participantes
            .Where(p => p.IdAposta == idAposta &&
                        (p.PapelAposta == PapelAposta.Desafiante ||
                         p.PapelAposta == PapelAposta.Desafiado))
            .Select(p => p.IdUsuario);

        return await db.Membros
            .Where(m => m.IdGrupo == idGrupo && !partes.Contains(m.IdUsuario))
            .Select(m => m.IdUsuario)
            .ToListAsync(ct);
    }
}
