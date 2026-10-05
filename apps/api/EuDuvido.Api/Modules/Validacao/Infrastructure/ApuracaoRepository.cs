using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace EuDuvido.Api.Modules.Validacao.Infrastructure;

public interface IApuracao
{
    // Delega para a procedure: apurar quorum, mudar status e liquidar CP
    // precisam commitar juntos, entao a decisao mora no banco (ADR 0003).
    Task ApurarAsync(int idEvidencia, CancellationToken ct = default);
}

public class Apuracao(EuDuvidoDbContext db) : IApuracao
{
    public async Task ApurarAsync(int idEvidencia, CancellationToken ct = default)
    {
        var parametro = new NpgsqlParameter("p_id_evidencia", NpgsqlDbType.Integer)
        {
            Value = idEvidencia
        };

        await db.Database.ExecuteSqlRawAsync(
            "CALL apurar_votacao(@p_id_evidencia)", [parametro], ct);
    }
}
