using Dapper;
using Npgsql;

namespace EuDuvido.Api.Tests;

// Monta um grupo com N membros e uma aposta pronta para receber evidencia.
// Usa SQL direto porque precisa criar estados intermediarios que o dominio
// so alcancaria simulando o fluxo inteiro.
public class CenarioAposta(string connectionString)
{
    public int IdGrupo { get; private set; }
    public int IdAposta { get; private set; }
    public int[] IdsUsuarios { get; private set; } = [];
    public int IdDesafiado => IdsUsuarios[0];
    public int IdDesafiante => IdsUsuarios[1];
    public int[] IdsValidadores => IdsUsuarios[2..];

    public async Task<CenarioAposta> MontarAsync(int membros = 5, int valorCp = 20)
    {
        await using var c = new NpgsqlConnection(connectionString);
        await c.OpenAsync();

        var ids = new List<int>();
        for (var i = 0; i < membros; i++)
        {
            var sufixo = Guid.NewGuid().ToString("N")[..8];
            ids.Add(await c.QuerySingleAsync<int>(
                """
                INSERT INTO identidade.usuario (nome, email, apelido)
                VALUES (@nome, @email, @apelido) RETURNING id_usuario
                """,
                new { nome = $"Teste {sufixo}", email = $"{sufixo}@teste.com", apelido = sufixo }));
        }
        IdsUsuarios = [.. ids];

        IdGrupo = await c.QuerySingleAsync<int>(
            "INSERT INTO grupos.grupo_amigos (nome, id_criador) VALUES ('Grupo Teste', @id) RETURNING id_grupo",
            new { id = ids[0] });

        foreach (var id in ids)
            await c.ExecuteAsync(
                "INSERT INTO grupos.membro_grupo (id_grupo, id_usuario, papel) VALUES (@g, @u, 'MEMBRO')",
                new { g = IdGrupo, u = id });

        var idCategoria = await c.QuerySingleAsync<int>(
            "INSERT INTO apostas.categoria_desafio (nome) VALUES (@n) RETURNING id_categoria",
            new { n = $"Cat {Guid.NewGuid():N}" });

        IdAposta = await c.QuerySingleAsync<int>(
            """
            INSERT INTO apostas.aposta
                (id_grupo, id_criador, id_categoria, titulo, descricao, valor_cp,
                 tipo_recompensa, data_limite, status)
            VALUES (@g, @u, @c, 'Desafio de teste', 'Descricao', @v,
                    'MONETARIA', CURRENT_TIMESTAMP + INTERVAL '30 days', 'EM_ANDAMENTO')
            RETURNING id_aposta
            """,
            new { g = IdGrupo, u = ids[0], c = idCategoria, v = valorCp });

        await c.ExecuteAsync(
            """
            INSERT INTO apostas.participante_aposta (id_aposta, id_usuario, papel_aposta, escolha)
            VALUES (@a, @desafiado, 'DESAFIADO', 'VAI_CUMPRIR'),
                   (@a, @desafiante, 'DESAFIANTE', 'NAO_VAI_CUMPRIR')
            """,
            new { a = IdAposta, desafiado = IdDesafiado, desafiante = IdDesafiante });

        await c.ExecuteAsync("CALL economia.debitar_escrow(@a, @u)",
            new { a = IdAposta, u = IdDesafiado });
        await c.ExecuteAsync("CALL economia.debitar_escrow(@a, @u)",
            new { a = IdAposta, u = IdDesafiante });

        return this;
    }

    public async Task<int> EnviarEvidenciaAsync(int ordem = 1)
    {
        await using var c = new NpgsqlConnection(connectionString);
        await c.OpenAsync();

        var idEvidencia = await c.QuerySingleAsync<int>(
            """
            INSERT INTO validacao.evidencia
                (id_aposta, id_usuario, ordem, tipo_midia, url_comprovante,
                 status, data_limite_votacao)
            VALUES (@a, @u, @o, 'FOTO', 'https://exemplo/prova.png',
                    'EM_VOTACAO', CURRENT_TIMESTAMP + INTERVAL '7 days')
            RETURNING id_evidencia
            """,
            new { a = IdAposta, u = IdDesafiado, o = ordem });

        foreach (var id in IdsValidadores)
            await c.ExecuteAsync(
                "INSERT INTO validacao.validador_evidencia (id_evidencia, id_usuario) VALUES (@e, @u)",
                new { e = idEvidencia, u = id });

        await c.ExecuteAsync(
            "UPDATE apostas.aposta SET status = 'EM_VOTACAO' WHERE id_aposta = @a",
            new { a = IdAposta });

        return idEvidencia;
    }

    public async Task VotarAsync(int idEvidencia, int idUsuario, string voto)
    {
        await using var c = new NpgsqlConnection(connectionString);
        await c.OpenAsync();
        await c.ExecuteAsync(
            """
            INSERT INTO validacao.voto_evidencia (id_evidencia, id_usuario, voto)
            VALUES (@e, @u, @v)
            """,
            new { e = idEvidencia, u = idUsuario, v = voto });
        await c.ExecuteAsync("CALL validacao.apurar_votacao(@e)", new { e = idEvidencia });
    }
}
