using Dapper;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// Documento 17, nivel 1: cada teste tenta violar uma regra e espera que o
// BANCO recuse. Nao e a aplicacao que protege - e o SGBD.
public class ConstraintTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private async Task<NpgsqlConnection> AbrirAsync()
    {
        var c = new NpgsqlConnection(banco.ConnectionString);
        await c.OpenAsync();
        return c;
    }

    private async Task DeveRecusar(string sql, object? param, string constraint)
    {
        await using var c = await AbrirAsync();
        var acao = async () => await c.ExecuteAsync(sql, param);
        var erro = await acao.Should().ThrowAsync<PostgresException>();
        erro.And.Message.Should().Contain(constraint);
    }

    [Fact(DisplayName = "T01 - status invalido de aposta e recusado")]
    public async Task T01() => await DeveRecusar(
        """
        INSERT INTO apostas.aposta (id_grupo, id_criador, id_categoria, titulo,
            descricao, valor_cp, tipo_recompensa, data_limite, status)
        VALUES (1, 1, 1, 't', 'd', 10, 'MONETARIA', CURRENT_TIMESTAMP, 'INVENTADO')
        """, null, "chk_aposta_status");

    [Fact(DisplayName = "T02 - valor monetario negativo e recusado")]
    public async Task T02()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO apostas.aposta (id_grupo, id_criador, id_categoria, titulo,
                descricao, valor_cp, tipo_recompensa, valor_monetario, data_limite)
            SELECT @g, @u, id_categoria, 't', 'd', 10, 'MONETARIA', -10,
                   CURRENT_TIMESTAMP + INTERVAL '1 day'
              FROM apostas.categoria_desafio LIMIT 1
            """, new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_aposta_valor");
    }

    [Fact(DisplayName = "T03 - aposta sem custo em CP e recusada")]
    public async Task T03()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO apostas.aposta (id_grupo, id_criador, id_categoria, titulo,
                descricao, valor_cp, tipo_recompensa, data_limite)
            SELECT @g, @u, id_categoria, 't', 'd', 0, 'MONETARIA',
                   CURRENT_TIMESTAMP + INTERVAL '1 day'
              FROM apostas.categoria_desafio LIMIT 1
            """, new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_aposta_valor_cp");
    }

    [Fact(DisplayName = "T04 - voto duplicado do mesmo usuario e recusado")]
    public async Task T04()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");

        await DeveRecusar(
            "INSERT INTO validacao.voto_evidencia (id_evidencia, id_usuario, voto) VALUES (@e, @u, 'VALIDO')",
            new { e = idEvidencia, u = cenario.IdsValidadores[0] }, "unq_voto_usuario");
    }

    [Fact(DisplayName = "T05 - FK de grupo inexistente e recusada")]
    public async Task T05() => await DeveRecusar(
        """
        INSERT INTO apostas.aposta (id_grupo, id_criador, id_categoria, titulo,
            descricao, valor_cp, tipo_recompensa, data_limite)
        VALUES (999999, 1, 1, 't', 'd', 10, 'MONETARIA', CURRENT_TIMESTAMP + INTERVAL '1 day')
        """, null, "fk_aposta_grupo");

    [Fact(DisplayName = "T06 - segundo DESAFIADO na mesma aposta e recusado")]
    public async Task T06()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO apostas.participante_aposta (id_aposta, id_usuario, papel_aposta, escolha)
            VALUES (@a, @u, 'DESAFIADO', 'VAI_CUMPRIR')
            """,
            new { a = cenario.IdAposta, u = cenario.IdsValidadores[0] }, "unq_aposta_papel_unico");
    }

    [Fact(DisplayName = "T07 - voto de quem nao esta no snapshot de validadores e recusado")]
    public async Task T07()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();

        // O desafiante nunca entra no juri (RN14).
        await DeveRecusar(
            "INSERT INTO validacao.voto_evidencia (id_evidencia, id_usuario, voto) VALUES (@e, @u, 'VALIDO')",
            new { e = idEvidencia, u = cenario.IdDesafiante }, "fk_voto_validador");
    }

    [Fact(DisplayName = "T08 - saldo nao pode ficar negativo")]
    public async Task T08()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "CALL economia.lancar(@g, @u, NULL, 'ESTORNO', -100000, 'estouro')",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_membro_saldo");
    }

    [Fact(DisplayName = "T09 - UPDATE no ledger e bloqueado")]
    public async Task T09()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await using var c = await AbrirAsync();
        var acao = async () => await c.ExecuteAsync(
            "UPDATE economia.transacao_cp SET valor = 1 WHERE id_grupo = @g",
            new { g = cenario.IdGrupo });
        var erro = await acao.Should().ThrowAsync<PostgresException>();
        erro.And.Message.Should().Contain("append-only");
    }

    [Fact(DisplayName = "T10 - DELETE no ledger e bloqueado")]
    public async Task T10()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await using var c = await AbrirAsync();
        var acao = async () => await c.ExecuteAsync(
            "DELETE FROM economia.transacao_cp WHERE id_grupo = @g", new { g = cenario.IdGrupo });
        var erro = await acao.Should().ThrowAsync<PostgresException>();
        erro.And.Message.Should().Contain("append-only");
    }

    [Fact(DisplayName = "T11 - voto em evidencia ja apurada e bloqueado pelo trigger")]
    public async Task T11()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        await using var c = await AbrirAsync();
        var acao = async () => await c.ExecuteAsync(
            "INSERT INTO validacao.voto_evidencia (id_evidencia, id_usuario, voto) VALUES (@e, @u, 'VALIDO')",
            new { e = idEvidencia, u = cenario.IdsValidadores[2] });
        var erro = await acao.Should().ThrowAsync<PostgresException>();
        erro.And.Message.Should().Contain("nao esta em votacao");
    }

    [Fact(DisplayName = "T13 - sexta evidencia na mesma aposta e recusada")]
    public async Task T13()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO validacao.evidencia (id_aposta, id_usuario, ordem, tipo_midia,
                url_comprovante, data_limite_votacao)
            VALUES (@a, @u, 6, 'FOTO', 'x', CURRENT_TIMESTAMP + INTERVAL '7 days')
            """,
            new { a = cenario.IdAposta, u = cenario.IdDesafiado }, "chk_evidencia_ordem");
    }

    [Fact(DisplayName = "T14 - credencial GOOGLE com segredo e recusada")]
    public async Task T14()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO identidade.credencial_usuario (id_usuario, provedor, id_externo, segredo_hash)
            VALUES (@u, 'GOOGLE', 'sub-123', 'hash-nao-deveria-existir')
            """, new { u = cenario.IdDesafiado }, "chk_credencial_segredo");
    }

    [Fact(DisplayName = "T15 - aposta CANCELADA sem motivo e recusada")]
    public async Task T15()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            UPDATE apostas.aposta
               SET status = 'CANCELADA', data_encerramento = CURRENT_TIMESTAMP
             WHERE id_aposta = @a
            """, new { a = cenario.IdAposta }, "chk_aposta_cancelamento");
    }

    [Fact(DisplayName = "T16 - convite expirando antes de ser criado e recusado")]
    public async Task T16()
    {
        var cenario = await new CenarioAposta(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO grupos.convite_grupo (id_grupo, codigo, id_criador, data_expiracao)
            VALUES (@g, 'ABC234', @u, CURRENT_TIMESTAMP - INTERVAL '1 day')
            """,
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_convite_expiracao");
    }
}
