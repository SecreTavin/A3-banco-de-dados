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

    private async Task DeveRecusar(string sql, object? param, string trecho)
    {
        await using var c = await AbrirAsync();
        var acao = async () => await c.ExecuteAsync(sql, param);
        var erro = await acao.Should().ThrowAsync<PostgresException>();
        erro.And.Message.Should().Contain(trecho);
    }

    [Fact(DisplayName = "T01 - status invalido de desafio e recusado")]
    public async Task T01() => await DeveRecusar(
        """
        INSERT INTO desafio (id_grupo, id_criador, id_categoria, titulo,
            descricao, valor_cp, tipo_recompensa, data_limite, status)
        VALUES (1, 1, 1, 't', 'd', 10, 'MONETARIA', CURRENT_TIMESTAMP, 'INVENTADO')
        """, null, "chk_desafio_status");

    [Fact(DisplayName = "T02 - nivel de filtro fora de LEVE/MODERADO/PESADO e recusado")]
    public async Task T02()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "UPDATE grupo_amigos SET nivel_filtro = 'NENHUM' WHERE id_grupo = @g",
            new { g = cenario.IdGrupo }, "chk_grupo_nivel_filtro");
    }

    [Fact(DisplayName = "T03 - desafio sem custo em CP e recusado")]
    public async Task T03()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO desafio (id_grupo, id_criador, id_categoria, titulo,
                descricao, valor_cp, tipo_recompensa, data_limite)
            SELECT @g, @u, id_categoria, 't', 'd', 0, 'MONETARIA',
                   CURRENT_TIMESTAMP + INTERVAL '1 day'
              FROM categoria_desafio LIMIT 1
            """, new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_desafio_valor_cp");
    }

    [Fact(DisplayName = "T04 - segundo voto do mesmo jurado e recusado")]
    public async Task T04()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");

        await DeveRecusar(
            """
            UPDATE jurado_evidencia SET voto = 'INVALIDO', data_voto = CURRENT_TIMESTAMP
             WHERE id_evidencia = @e AND id_usuario = @u
            """,
            new { e = idEvidencia, u = cenario.IdsValidadores[0] }, "ja votou");
    }

    [Fact(DisplayName = "T05 - FK de grupo inexistente e recusada")]
    public async Task T05()
    {
        // Criador e categoria validos: so o grupo e invalido, para a FK
        // recusada ser exatamente a do grupo.
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO desafio (id_grupo, id_criador, id_categoria, titulo,
                descricao, valor_cp, tipo_recompensa, data_limite)
            SELECT 999999, @u, id_categoria, 't', 'd', 10, 'MONETARIA',
                   CURRENT_TIMESTAMP + INTERVAL '1 day'
              FROM categoria_desafio LIMIT 1
            """, new { u = cenario.IdDesafiado }, "fk_desafio_grupo");
    }

    [Fact(DisplayName = "T06 - segundo DESAFIADO no mesmo desafio e recusado")]
    public async Task T06()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO participante_desafio (id_desafio, id_usuario, papel_desafio, escolha)
            VALUES (@a, @u, 'DESAFIADO', 'VAI_CUMPRIR')
            """,
            new { a = cenario.IdDesafio, u = cenario.IdsValidadores[0] }, "unq_desafio_papel_unico");
    }

    [Fact(DisplayName = "T07 - parte do desafio nao entra no juri")]
    public async Task T07()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();

        // O desafiante nunca julga a propria disputa (RN14).
        await DeveRecusar(
            "INSERT INTO jurado_evidencia (id_evidencia, id_usuario) VALUES (@e, @u)",
            new { e = idEvidencia, u = cenario.IdDesafiante }, "parte do desafio");
    }

    [Fact(DisplayName = "T08 - saldo nao pode ficar negativo")]
    public async Task T08()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "CALL lancar(@g, @u, NULL, 'ESTORNO', -100000, 'estouro')",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_membro_saldo");
    }

    [Fact(DisplayName = "T09 - UPDATE no ledger e bloqueado")]
    public async Task T09()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "UPDATE transacao_cp SET valor = 1 WHERE id_grupo = @g",
            new { g = cenario.IdGrupo }, "append-only");
    }

    [Fact(DisplayName = "T10 - DELETE no ledger e bloqueado")]
    public async Task T10()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "DELETE FROM transacao_cp WHERE id_grupo = @g",
            new { g = cenario.IdGrupo }, "append-only");
    }

    [Fact(DisplayName = "T11 - voto em evidencia ja apurada e bloqueado pelo trigger")]
    public async Task T11()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[0], "VALIDO");
        await cenario.VotarAsync(idEvidencia, cenario.IdsValidadores[1], "VALIDO");

        await DeveRecusar(
            """
            UPDATE jurado_evidencia SET voto = 'VALIDO', data_voto = CURRENT_TIMESTAMP
             WHERE id_evidencia = @e AND id_usuario = @u
            """,
            new { e = idEvidencia, u = cenario.IdsValidadores[2] }, "nao esta em votacao");
    }

    [Fact(DisplayName = "T12 - voto sem data de voto e recusado")]
    public async Task T12()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        var idEvidencia = await cenario.EnviarEvidenciaAsync();
        await DeveRecusar(
            "UPDATE jurado_evidencia SET voto = 'VALIDO' WHERE id_evidencia = @e AND id_usuario = @u",
            new { e = idEvidencia, u = cenario.IdsValidadores[0] }, "chk_jurado_voto_data");
    }

    [Fact(DisplayName = "T13 - sexta evidencia no mesmo desafio e recusada")]
    public async Task T13()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO evidencia (id_desafio, id_usuario, ordem, tipo_midia,
                url_comprovante, data_limite_votacao)
            VALUES (@a, @u, 6, 'FOTO', 'x', CURRENT_TIMESTAMP + INTERVAL '7 days')
            """,
            new { a = cenario.IdDesafio, u = cenario.IdDesafiado }, "chk_evidencia_ordem");
    }

    [Fact(DisplayName = "T14 - usuario com menos de 16 anos e recusado pelo trigger")]
    public async Task T14() => await DeveRecusar(
        """
        INSERT INTO usuario (nome, email, apelido, data_nascimento)
        VALUES ('Menor', @email, 'menor', CURRENT_DATE - INTERVAL '15 years')
        """, new { email = $"{Guid.NewGuid():N}@teste.com" }, "Idade minima");

    [Fact(DisplayName = "T15 - desafio CANCELADA sem motivo e recusado")]
    public async Task T15()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            UPDATE desafio
               SET status = 'CANCELADA', data_encerramento = CURRENT_TIMESTAMP
             WHERE id_desafio = @a
            """, new { a = cenario.IdDesafio }, "chk_desafio_cancelamento");
    }

    [Fact(DisplayName = "T16 - moderacao reprovada sem motivo e recusada")]
    public async Task T16()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO moderacao_desafio (id_grupo, id_criador, nivel_filtro, titulo, descricao, aprovado)
            VALUES (@g, @u, 'MODERADO', 't', 'd', FALSE)
            """, new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "chk_moderacao_motivo");
    }

    [Fact(DisplayName = "T17 - proposta reprovada nao se liga a desafio")]
    public async Task T17()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            """
            INSERT INTO moderacao_desafio
                (id_grupo, id_criador, id_desafio, nivel_filtro, titulo, descricao, aprovado, motivo)
            VALUES (@g, @u, @a, 'PESADO', 't', 'd', FALSE, 'arriscado')
            """, new { g = cenario.IdGrupo, u = cenario.IdDesafiado, a = cenario.IdDesafio },
            "chk_moderacao_desafio");
    }

    [Fact(DisplayName = "T18 - membro com desafio em curso nao sai do grupo")]
    public async Task T18()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        await DeveRecusar(
            "CALL remover_membro(@g, @u)",
            new { g = cenario.IdGrupo, u = cenario.IdDesafiado }, "desafio em curso");
    }

    [Fact(DisplayName = "T19 - saida zera o saldo no ledger e a volta ao grupo reconcilia")]
    public async Task T19()
    {
        var cenario = await new CenarioDesafio(banco.ConnectionString).MontarAsync();
        var idAvulso = cenario.IdsValidadores[^1];
        await using var c = await AbrirAsync();

        await c.ExecuteAsync("CALL remover_membro(@g, @u)", new { g = cenario.IdGrupo, u = idAvulso });

        var saldoLedger = await c.QuerySingleAsync<long>(
            "SELECT COALESCE(SUM(valor), 0) FROM transacao_cp WHERE id_grupo = @g AND id_usuario = @u",
            new { g = cenario.IdGrupo, u = idAvulso });
        saldoLedger.Should().Be(0, "SAIDA_GRUPO zera a conta de quem sai");

        await c.ExecuteAsync(
            "INSERT INTO membro_grupo (id_grupo, id_usuario) VALUES (@g, @u)",
            new { g = cenario.IdGrupo, u = idAvulso });

        var divergencias = await c.QuerySingleAsync<int>(
            "SELECT count(*) FROM vw_reconciliacao_saldo WHERE id_grupo = @g",
            new { g = cenario.IdGrupo });
        divergencias.Should().Be(0, "quem volta recomeca com 100 CP sem divergir do ledger");
    }
}
