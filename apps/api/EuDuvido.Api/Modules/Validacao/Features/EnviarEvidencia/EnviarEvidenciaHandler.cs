using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;

public record EnviarEvidenciaCommand(
    int IdDesafio, string TipoMidia, string UrlComprovante, string? Comentario);

public class EnviarEvidenciaHandler(EuDuvidoDbContext db, IConexaoLeitura leitura)
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
            .Select(e => new { e.Ordem, e.Status })
            .ToListAsync(ct);

        if (anteriores.Any(e => e.Status == StatusEvidencia.EmVotacao))
            return EvidenciaErrors.AnteriorEmVotacao;
        if (anteriores.Count >= Evidencia.MaximoPorDesafio)
            return EvidenciaErrors.LimiteAtingido;

        var elegiveis = await CarregarJuri(desafio.IdGrupo, comando.IdDesafio, ct);

        var evidencia = Evidencia.Enviar(
            comando.IdDesafio, idUsuario, anteriores.Count + 1,
            comando.TipoMidia, comando.UrlComprovante, comando.Comentario, elegiveis);

        if (evidencia.IsError) return evidencia.Errors;

        db.Evidencias.Add(evidencia.Value);
        desafio.MarcarEmVotacao();
        await db.SaveChangesAsync(ct);

        return evidencia.Value.IdEvidencia;
    }

    // Membros do grupo menos DESAFIANTE e DESAFIADO (RN14). Lido agora e
    // congelado na tabela: quem entrar depois nao muda o quorum.
    private async Task<List<int>> CarregarJuri(int idGrupo, int idDesafio, CancellationToken ct)
    {
        using var conexao = await leitura.AbrirAsync(ct);
        var elegiveis = await conexao.QueryAsync<int>(
            """
            SELECT m.id_usuario
              FROM grupos.membro_grupo m
             WHERE m.id_grupo = @idGrupo
               AND m.id_usuario NOT IN (
                   SELECT p.id_usuario FROM desafios.participante_desafio p
                    WHERE p.id_desafio = @idDesafio
                      AND p.papel_desafio IN ('DESAFIANTE', 'DESAFIADO'))
            """,
            new { idGrupo, idDesafio });

        return [.. elegiveis];
    }
}
