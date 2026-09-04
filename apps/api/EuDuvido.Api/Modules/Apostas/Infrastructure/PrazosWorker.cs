using Dapper;
using EuDuvido.Api.Shared.Database;

namespace EuDuvido.Api.Modules.Apostas.Infrastructure;

// Expira votacoes e avisa sobre prazos. Roda no proprio processo da API -
// nao ha infraestrutura de fila (ADR 0011).
public class PrazosWorker(IServiceProvider provedor, ILogger<PrazosWorker> log)
    : BackgroundService
{
    private static readonly TimeSpan Intervalo = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(Intervalo);
        do
        {
            try
            {
                await ProcessarAsync(ct);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                log.LogError(e, "Falha ao processar prazos.");
            }
        }
        while (await timer.WaitForNextTickAsync(ct));
    }

    private async Task ProcessarAsync(CancellationToken ct)
    {
        using var escopo = provedor.CreateScope();
        var leitura = escopo.ServiceProvider.GetRequiredService<IConexaoLeitura>();
        using var conexao = await leitura.AbrirAsync(ct);

        var expiradas = await conexao.QueryAsync<int>(
            """
            SELECT id_evidencia FROM validacao.evidencia
             WHERE status = 'EM_VOTACAO' AND data_limite_votacao < CURRENT_TIMESTAMP
            """);

        foreach (var id in expiradas)
            await conexao.ExecuteAsync("CALL validacao.apurar_votacao(@id)", new { id });

        // RN21: aposta que ninguem aceitou ate o prazo nao fica aberta pra sempre.
        var abandonadas = await conexao.QueryAsync<int>(
            """
            SELECT id_aposta FROM apostas.aposta
             WHERE status = 'ABERTA' AND data_limite < CURRENT_TIMESTAMP
            """);

        foreach (var id in abandonadas)
            await conexao.ExecuteAsync(
                "CALL apostas.cancelar_aposta(@id, 'Prazo encerrado sem participantes suficientes')",
                new { id });

        await NotificarPrazosAsync(conexao, ct);
    }

    private static async Task NotificarPrazosAsync(System.Data.IDbConnection conexao,
        CancellationToken ct)
    {
        await conexao.ExecuteAsync(
            """
            INSERT INTO notificacoes.notificacao (id_usuario, tipo, titulo, corpo, url_destino)
            SELECT p.id_usuario, 'PRAZO_VENCENDO',
                   'O prazo ta acabando!',
                   'A aposta "' || a.titulo || '" vence em menos de 48h.',
                   '/apostas/' || a.id_aposta
              FROM apostas.aposta a
              JOIN apostas.participante_aposta p ON p.id_aposta = a.id_aposta
             WHERE a.status IN ('ABERTA', 'EM_ANDAMENTO')
               AND a.data_limite BETWEEN CURRENT_TIMESTAMP
                                     AND CURRENT_TIMESTAMP + INTERVAL '48 hours'
               AND NOT EXISTS (
                   SELECT 1 FROM notificacoes.notificacao n
                    WHERE n.id_usuario = p.id_usuario
                      AND n.tipo = 'PRAZO_VENCENDO'
                      AND n.url_destino = '/apostas/' || a.id_aposta)
            """);
    }
}
