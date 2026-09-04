using System.Reflection;

namespace EuDuvido.Api.Shared.Database;

// EF Core nao tem migrationBuilder.SqlFile(). Os .sql viajam dentro do
// assembly como embedded resource e sao passados para migrationBuilder.Sql().
public static class SqlEmbutido
{
    public static string Ler(string arquivo)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var nome = $"EuDuvido.Api.Shared.Database.Sql.{arquivo}";

        using var stream = assembly.GetManifestResourceStream(nome)
            ?? throw new InvalidOperationException(
                $"Recurso {nome} nao encontrado. Recursos: " +
                string.Join(", ", assembly.GetManifestResourceNames()));

        using var leitor = new StreamReader(stream);
        return leitor.ReadToEnd();
    }
}
