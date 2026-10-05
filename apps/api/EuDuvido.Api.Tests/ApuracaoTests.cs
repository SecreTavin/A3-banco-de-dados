using Dapper;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

public class ApuracaoTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private NpgsqlConnection Conectar() => new(banco.ConnectionString);

    [Fact(DisplayName = "Quorum atingido encerra a aposta e liquida o CP na mesma transacao")]
    public async Task CicloCompleto()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();

        await using var c = Conectar();
        await c.OpenAsync();

        // 3 validadores => quorum 2. O primeiro voto nao pode encerrar nada.
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");

        var apos1 = await c.QuerySingleAsync<(string Evidencia, string Aposta)>(
            """
            SELECT e.status, a.status FROM evidencia e
            JOIN aposta a ON a.id_aposta = e.id_aposta
            WHERE e.id_evidencia = @id
            """, new { id = idEvidencia });
        apos1.Evidencia.Should().Be("EM_VOTACAO");
        apos1.Aposta.Should().Be("EM_VOTACAO");

        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        var apos2 = await c.QuerySingleAsync<(string Evidencia, string Aposta)>(
            """
            SELECT e.status, a.status FROM evidencia e
            JOIN aposta a ON a.id_aposta = e.id_aposta
            WHERE e.id_evidencia = @id
            """, new { id = idEvidencia });
        apos2.Evidencia.Should().Be("ACEITA");
        apos2.Aposta.Should().Be("FINALIZADA_CUMPRIU");

        // Pote de 40 CP (2 participantes x 20) vai inteiro para quem apostou
        // VAI_CUMPRIR - o desafiado. Ele pagou 20, entao fecha em 120.
        var saldoDesafiado = await c.QuerySingleAsync<int>(
            "SELECT saldo_cp FROM membro_grupo WHERE id_grupo=@g AND id_usuario=@u",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado });
        saldoDesafiado.Should().Be(120);

        var saldoDesafiante = await c.QuerySingleAsync<int>(
            "SELECT saldo_cp FROM membro_grupo WHERE id_grupo=@g AND id_usuario=@u",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiante });
        saldoDesafiante.Should().Be(80);

        // Quem votou na evidencia que atingiu quorum recebe 2 CP (RN17).
        var saldoVotante = await c.QuerySingleAsync<int>(
            "SELECT saldo_cp FROM membro_grupo WHERE id_grupo=@g AND id_usuario=@u",
            new { g = cenario.IdGrupo, u = cenario.IdsValidadores[0] });
        saldoVotante.Should().Be(102);
    }

    [Fact(DisplayName = "A view de reconciliacao fica vazia apos o ciclo completo")]
    public async Task ReconciliacaoFecha()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        await using var c = Conectar();
        await c.OpenAsync();

        var divergencias = await c.QuerySingleAsync<int>(
            "SELECT count(*) FROM vw_reconciliacao_saldo");
        divergencias.Should().Be(0, "saldo materializado e ledger nunca podem divergir");

        var orfaos = await c.QuerySingleAsync<int>(
            "SELECT count(*) FROM vw_escrow_orfao");
        orfaos.Should().Be(0, "aposta encerrada nao pode reter CP no escrow");
    }

    [Fact(DisplayName = "Soma do ledger do grupo bate com creditos iniciais mais recompensas")]
    public async Task LedgerBalanceia()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        await using var c = Conectar();
        await c.OpenAsync();

        var resultado = await c.QuerySingleAsync<(long Soma, long Recompensas)>(
            """
            SELECT COALESCE(SUM(valor), 0),
                   COALESCE(SUM(valor) FILTER (WHERE tipo = 'RECOMPENSA_VOTO'), 0)
              FROM transacao_cp WHERE id_grupo = @g
            """, new { g = cenario.IdGrupo });

        resultado.Soma.Should().Be(5 * 100 + resultado.Recompensas);
    }

    [Fact(DisplayName = "Apurar duas vezes nao altera nada")]
    public async Task ApuracaoIdempotente()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        await using var c = Conectar();
        await c.OpenAsync();

        var antes = await c.QuerySingleAsync<int>(
            "SELECT saldo_cp FROM membro_grupo WHERE id_grupo=@g AND id_usuario=@u",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado });

        await c.ExecuteAsync("CALL apurar_votacao(@e)", new { e = idEvidencia });
        await c.ExecuteAsync("CALL apurar_votacao(@e)", new { e = idEvidencia });

        var depois = await c.QuerySingleAsync<int>(
            "SELECT saldo_cp FROM membro_grupo WHERE id_grupo=@g AND id_usuario=@u",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado });

        depois.Should().Be(antes);
    }

    [Fact(DisplayName = "Maioria INVALIDO recusa a evidencia sem encerrar a aposta na primeira")]
    public async Task EvidenciaRecusada()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "INVALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "INVALIDO");

        await using var c = Conectar();
        await c.OpenAsync();

        var estado = await c.QuerySingleAsync<(string Evidencia, string Aposta)>(
            """
            SELECT e.status, a.status FROM evidencia e
            JOIN aposta a ON a.id_aposta = e.id_aposta
            WHERE e.id_evidencia = @id
            """, new { id = idEvidencia });

        estado.Evidencia.Should().Be("RECUSADA");
        // RN10: so a terceira recusa encerra contra o desafiado.
        estado.Aposta.Should().Be("EM_VOTACAO");
    }

    [Fact(DisplayName = "Tres evidencias recusadas encerram a aposta contra o desafiado")]
    public async Task TresRecusasEncerram()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync(membros: 5);

        for (var ordem = 1; ordem <= 3; ordem++)
        {
            var id = await cenario.EnviarEvidenciaAsync(ordem);
            await cenario.VotarAsync(id, cenario.IdsValidadores[0], "INVALIDO");
            await cenario.VotarAsync(id, cenario.IdsValidadores[1], "INVALIDO");
        }

        await using var c = Conectar();
        await c.OpenAsync();

        var status = await c.QuerySingleAsync<string>(
            "SELECT status FROM aposta WHERE id_aposta = @a", new { a = cenario.IdAposta });
        status.Should().Be("FINALIZADA_PERDEU");

        var orfaos = await c.QuerySingleAsync<int>(
            "SELECT count(*) FROM vw_escrow_orfao");
        orfaos.Should().Be(0);
    }
}
