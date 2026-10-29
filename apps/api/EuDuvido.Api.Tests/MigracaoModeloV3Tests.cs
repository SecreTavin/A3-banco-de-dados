using Dapper;
using EuDuvido.Api.Shared.Database;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Testcontainers.PostgreSql;

namespace EuDuvido.Api.Tests;

// A migration AlinhamentoModeloV3 converte um banco que ja estava no ar. O
// teste monta o banco no estado de RenomeiaApostaParaDesafio, povoa com dados
// no modelo anterior (schemas por modulo, validador + voto, valor monetario,
// convite, comentario, credencial) e so entao aplica a migration nova.
public class MigracaoModeloV3Tests : IAsyncLifetime
{
    private const string MigrationAnterior = "20261003005803_RenomeiaApostaParaDesafio";

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    // Mesmo roteiro do seed de demonstracao, nos nomes do modelo anterior.
    private const string SeedModeloAnterior =
        """
        INSERT INTO identidade.usuario (nome, email, apelido, data_cadastro) VALUES
        ('Octavio', 'octavio@email.com', 'Tavin', '2026-09-01 10:00:00-03'),
        ('Gabriel', 'gabriel@email.com', 'Biel',  '2026-09-01 10:00:00-03'),
        ('Matheus', 'matheus@email.com', 'Theus', '2026-09-01 10:00:00-03'),
        ('Larissa', 'larissa@email.com', 'Lari',  '2026-09-01 10:00:00-03'),
        ('Felipe',  'felipe@email.com',  'Lipe',  '2026-09-01 10:00:00-03');

        INSERT INTO identidade.credencial_usuario (id_usuario, provedor, id_externo) VALUES
        (1, 'GOOGLE', 'sub-1');

        INSERT INTO grupos.grupo_amigos (nome, id_criador) VALUES ('Os Inimigos do Fim', 1);
        INSERT INTO grupos.membro_grupo (id_grupo, id_usuario, papel) VALUES
        (1, 1, 'ADMIN'), (1, 2, 'MEMBRO'), (1, 3, 'MEMBRO'), (1, 4, 'MEMBRO'), (1, 5, 'MEMBRO');
        INSERT INTO grupos.convite_grupo (id_grupo, codigo, id_criador, data_expiracao) VALUES
        (1, 'K7RM94', 1, CURRENT_TIMESTAMP + INTERVAL '7 days');

        INSERT INTO desafios.categoria_desafio (nome) VALUES ('Esportes'), ('Prendas');

        INSERT INTO desafios.desafio
            (id_grupo, id_criador, id_categoria, titulo, descricao, valor_cp, tipo_recompensa,
             valor_monetario, descricao_prenda, data_limite, status) VALUES
        (1, 1, 1, 'Correr 5km', 'Abaixo de 25 minutos', 20, 'MONETARIA', 50.00, NULL,
            CURRENT_TIMESTAMP + INTERVAL '10 days', 'EM_VOTACAO'),
        (1, 2, 2, 'Fantasia de dinossauro', 'Na aula', 15, 'PRENDA_ACAO', NULL,
            'Pagar 1 rodada de acai', CURRENT_TIMESTAMP + INTERVAL '10 days', 'ABERTA'),
        (1, 3, 2, 'Sem recompensa descrita', 'x', 10, 'OUTRO', NULL, NULL,
            CURRENT_TIMESTAMP + INTERVAL '10 days', 'ABERTA');

        INSERT INTO desafios.participante_desafio (id_desafio, id_usuario, papel_desafio, escolha) VALUES
        (1, 1, 'DESAFIADO', 'VAI_CUMPRIR'),
        (1, 2, 'DESAFIANTE', 'NAO_VAI_CUMPRIR'),
        (1, 3, 'APOSTADOR', 'VAI_CUMPRIR');

        CALL economia.debitar_escrow(1, 1);
        CALL economia.debitar_escrow(1, 2);
        CALL economia.debitar_escrow(1, 3);

        INSERT INTO desafios.comentario_desafio (id_desafio, id_usuario, texto) VALUES
        (1, 2, 'Quero ver o GPS.');

        INSERT INTO validacao.evidencia
            (id_desafio, id_usuario, ordem, tipo_midia, url_comprovante, status, data_limite_votacao)
        VALUES (1, 1, 1, 'FOTO', 'https://exemplo/strava.png', 'EM_VOTACAO',
                CURRENT_TIMESTAMP + INTERVAL '7 days');

        INSERT INTO validacao.validador_evidencia (id_evidencia, id_usuario) VALUES (1, 3), (1, 4), (1, 5);
        INSERT INTO validacao.voto_evidencia (id_evidencia, id_usuario, voto, justificativa) VALUES
        (1, 3, 'VALIDO', 'Bateu com o GPS.');
        """;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using (var db = CriarContexto())
            await db.GetService<IMigrator>().MigrateAsync(MigrationAnterior);

        await using var c = await AbrirAsync();
        await c.ExecuteAsync(SeedModeloAnterior);

        await using (var db = CriarContexto())
            await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    private EuDuvidoDbContext CriarContexto() => new(
        new DbContextOptionsBuilder<EuDuvidoDbContext>().UseNpgsql(_container.GetConnectionString()).Options);

    private async Task<NpgsqlConnection> AbrirAsync()
    {
        var c = new NpgsqlConnection(_container.GetConnectionString());
        await c.OpenAsync();
        return c;
    }

    [Fact(DisplayName = "Sobra so o schema public, com as dez tabelas do modelo 11")]
    public async Task DezTabelasNoPublic()
    {
        await using var c = await AbrirAsync();

        var schemas = await c.QueryAsync<string>(
            """
            SELECT nspname FROM pg_namespace
             WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'
            """);
        schemas.Should().BeEquivalentTo(["public"]);

        var tabelas = await c.QueryAsync<string>(
            """
            SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
               AND table_name <> '__EFMigrationsHistory'
            """);
        tabelas.Should().BeEquivalentTo(
        [
            "usuario", "grupo_amigos", "membro_grupo", "categoria_desafio", "desafio",
            "moderacao_desafio", "participante_desafio", "evidencia", "jurado_evidencia",
            "transacao_cp"
        ]);
    }

    [Fact(DisplayName = "Linhas preservadas e contabilidade fechando depois da conversao")]
    public async Task DadosPreservados()
    {
        await using var c = await AbrirAsync();

        (await c.QuerySingleAsync<int>("SELECT count(*) FROM usuario")).Should().Be(5);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM membro_grupo")).Should().Be(5);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM desafio")).Should().Be(3);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM participante_desafio")).Should().Be(3);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM transacao_cp")).Should().Be(11);
        (await c.QuerySingleAsync<int>("SELECT sum(saldo_cp) FROM membro_grupo")).Should().Be(440);

        (await c.QuerySingleAsync<int>("SELECT count(*) FROM vw_reconciliacao_saldo")).Should().Be(0);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM vw_escrow_orfao")).Should().Be(0);
    }

    [Fact(DisplayName = "Validador e voto viram jurado_evidencia, com o voto na mesma linha")]
    public async Task JuriConvertido()
    {
        await using var c = await AbrirAsync();

        var juri = (await c.QueryAsync<(int IdUsuario, string? Voto, string? Justificativa, bool TemData)>(
            """
            SELECT id_usuario, voto, justificativa, data_voto IS NOT NULL
              FROM jurado_evidencia WHERE id_evidencia = 1 ORDER BY id_usuario
            """)).ToList();

        juri.Should().Equal(
            (3, "VALIDO", "Bateu com o GPS.", true),
            (4, null, null, false),
            (5, null, null, false));

        var status = await c.QuerySingleAsync(
            "SELECT total_validadores, quorum, total_votos, votos_faltantes FROM vw_status_votacao WHERE id_evidencia = 1");
        ((long)status.total_validadores).Should().Be(3);
        ((decimal)status.quorum).Should().Be(2);
        ((long)status.total_votos).Should().Be(1);
        ((decimal)status.votos_faltantes).Should().Be(1);
    }

    [Fact(DisplayName = "Valor monetario e prenda viram descricao_recompensa (RN02)")]
    public async Task RecompensaDescritiva()
    {
        await using var c = await AbrirAsync();

        var recompensas = await c.QueryAsync<string?>(
            "SELECT descricao_recompensa FROM desafio ORDER BY id_desafio");

        recompensas.Should().Equal("R$ 50,00", "Pagar 1 rodada de acai", null);
    }

    [Fact(DisplayName = "Quem ja existia ganha data de nascimento valida para o trigger (RN26)")]
    public async Task DataNascimentoPreenchida()
    {
        await using var c = await AbrirAsync();

        // 18 anos antes do cadastro (01/09/2026): estimativa que passa no trigger.
        var datas = await c.QueryAsync<string>("SELECT data_nascimento::text FROM usuario");

        datas.Should().HaveCount(5).And.OnlyContain(d => d == "2008-09-01");
        (await c.QuerySingleAsync<string>(
            "SELECT nivel_filtro FROM grupo_amigos WHERE id_grupo = 1")).Should().Be("MODERADO");
    }

    [Fact(DisplayName = "O voto que faltava fecha o desafio no banco convertido")]
    public async Task VotoFechaDesafio()
    {
        await using var c = await AbrirAsync();

        await c.ExecuteAsync(
            """
            UPDATE jurado_evidencia SET voto = 'VALIDO', data_voto = CURRENT_TIMESTAMP
             WHERE id_evidencia = 1 AND id_usuario = 4
            """);
        await c.ExecuteAsync("CALL apurar_votacao(1)");

        (await c.QuerySingleAsync<string>("SELECT status FROM desafio WHERE id_desafio = 1"))
            .Should().Be("FINALIZADA_CUMPRIU");
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM vw_reconciliacao_saldo")).Should().Be(0);
        (await c.QuerySingleAsync<int>("SELECT count(*) FROM vw_escrow_orfao")).Should().Be(0);
    }

    [Fact(DisplayName = "Lancamento legado APOSTA_ESCROW continua aceito no ledger (ADR 0017)")]
    public async Task EscrowLegado()
    {
        await using var c = await AbrirAsync();

        var acao = () => c.ExecuteAsync(
            """
            INSERT INTO transacao_cp (id_grupo, id_usuario, id_desafio, tipo, valor, descricao)
            VALUES (1, NULL, 2, 'APOSTA_ESCROW', 1, 'legado'),
                   (1, NULL, 2, 'APOSTA_ESCROW', -1, 'legado')
            """);

        await acao.Should().NotThrowAsync();
    }
}
