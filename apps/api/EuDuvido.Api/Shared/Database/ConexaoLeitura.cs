using System.Data;
using Npgsql;

namespace EuDuvido.Api.Shared.Database;

// Lado de leitura do CQRS. Queries usam Dapper sobre esta conexao e nunca
// tocam o DbContext (ADR 0003) - ha teste de arquitetura garantindo isso.
public interface IConexaoLeitura
{
    Task<IDbConnection> AbrirAsync(CancellationToken ct = default);
}

public class ConexaoLeitura(string connectionString) : IConexaoLeitura
{
    public async Task<IDbConnection> AbrirAsync(CancellationToken ct = default)
    {
        var conexao = new NpgsqlConnection(connectionString);
        await conexao.OpenAsync(ct);
        return conexao;
    }
}
