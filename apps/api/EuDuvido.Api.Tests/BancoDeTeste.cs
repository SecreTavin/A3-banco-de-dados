using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace EuDuvido.Api.Tests;

// Sobe um PostgreSQL real por classe de teste e aplica as migrations - inclui
// as procedures e triggers, que sao o que realmente queremos exercitar.
public class BancoDeTeste : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        await using var db = CriarContexto();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    public EuDuvidoDbContext CriarContexto()
    {
        var opcoes = new DbContextOptionsBuilder<EuDuvidoDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new EuDuvidoDbContext(opcoes);
    }
}
