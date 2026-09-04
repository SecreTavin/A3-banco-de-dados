using Dapper;
using ErrorOr;
using EuDuvido.Api.Modules.Apostas.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;

public record EnviarEvidenciaCommand(
    int IdAposta, string TipoMidia, string UrlComprovante, string? Comentario);

public class EnviarEvidenciaHandler(EuDuvidoDbContext db, IConexaoLeitura leitura)
{
    public async Task<ErrorOr<int>> Handle(
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
            .Select(e => new { e.Ordem, e.Status })
            .ToListAsync(ct);

        if (anteriores.Any(e => e.Status == StatusEvidencia.EmVotacao))
            return EvidenciaErrors.AnteriorEmVotacao;
        if (anteriores.Count >= Evidencia.MaximoPorAposta)
            return EvidenciaErrors.LimiteAtingido;

        var elegiveis = await CarregarJuri(aposta.IdGrupo, comando.IdAposta, ct);

        var evidencia = Evidencia.Enviar(
            comando.IdAposta, idUsuario, anteriores.Count + 1,
            comando.TipoMidia, comando.UrlComprovante, comando.Comentario, elegiveis);

        if (evidencia.IsError) return evidencia.Errors;

        db.Evidencias.Add(evidencia.Value);
        aposta.MarcarEmVotacao();
        await db.SaveChangesAsync(ct);

        return evidencia.Value.IdEvidencia;
    }

    // Membros do grupo menos DESAFIANTE e DESAFIADO (RN14). Lido agora e
    // congelado na tabela: quem entrar depois nao muda o quorum.
    private async Task<List<int>> CarregarJuri(int idGrupo, int idAposta, CancellationToken ct)
    {
        using var conexao = await leitura.AbrirAsync(ct);
        var elegiveis = await conexao.QueryAsync<int>(
            """
            SELECT m.id_usuario
              FROM grupos.membro_grupo m
             WHERE m.id_grupo = @idGrupo
               AND m.id_usuario NOT IN (
                   SELECT p.id_usuario FROM apostas.participante_aposta p
                    WHERE p.id_aposta = @idAposta
                      AND p.papel_aposta IN ('DESAFIANTE', 'DESAFIADO'))
            """,
            new { idGrupo, idAposta });

        return [.. elegiveis];
    }
}
