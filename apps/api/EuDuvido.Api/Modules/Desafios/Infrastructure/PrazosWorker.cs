using Dapper;
using EuDuvido.Api.Shared.Database;

namespace EuDuvido.Api.Modules.Desafios.Infrastructure;

// Expira votacoes e cancela desafios abandonados. Roda no proprio processo da
// API - nao ha infraestrutura de fila (ADR 0011).
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
            SELECT id_evidencia FROM evidencia
             WHERE status = 'EM_VOTACAO' AND data_limite_votacao < CURRENT_TIMESTAMP
            """);

        foreach (var id in expiradas)
            await conexao.ExecuteAsync("CALL apurar_votacao(@id)", new { id });

        // RN21: desafio que ninguem aceitou ate o prazo nao fica aberto pra sempre.
        var abandonadas = await conexao.QueryAsync<int>(
            """
            SELECT id_desafio FROM desafio
             WHERE status = 'ABERTA' AND data_limite < CURRENT_TIMESTAMP
            """);

        foreach (var id in abandonadas)
            await conexao.ExecuteAsync(
                "CALL cancelar_desafio(@id, 'Prazo encerrado sem participantes suficientes')",
                new { id });

        // RN30: o prazo do desafio acabou e nao ha prova no juri - o desafiado nao
        // provou a tempo. Encerra como perdido; o pote vai a quem apostou contra.
        // Roda depois da apuracao das provas vencidas, para nao fechar um desafio
        // cuja ultima prova acabou de ser decidida.
        var vencidos = await conexao.QueryAsync<int>(
            """
            SELECT d.id_desafio FROM desafio d
             WHERE d.status IN ('EM_ANDAMENTO', 'EM_VOTACAO')
               AND d.data_limite < CURRENT_TIMESTAMP
               AND NOT EXISTS (SELECT 1 FROM evidencia e
                                WHERE e.id_desafio = d.id_desafio AND e.status = 'EM_VOTACAO')
            """);

        foreach (var id in vencidos)
            await conexao.ExecuteAsync("CALL encerrar_desafio(@id, FALSE)", new { id });
    }
}
