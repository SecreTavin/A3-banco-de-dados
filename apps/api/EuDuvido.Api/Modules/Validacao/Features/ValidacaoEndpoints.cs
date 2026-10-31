using Dapper;
using EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;
using EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Results;
using FluentValidation;

namespace EuDuvido.Api.Modules.Validacao.Features;

public static class ValidacaoEndpoints
{
    public static void MapValidacaoEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/validacao").RequireAuthorization().WithTags("Validacao");

        grupo.MapPost("/evidencias/{id:int}/votos", async (
            int id,
            RegistrarVotoRequest requisicao,
            IValidator<RegistrarVotoCommand> validador,
            RegistrarVotoHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var comando = new RegistrarVotoCommand(id, requisicao.Voto, requisicao.Justificativa);

            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp();
        })
        .WithName("RegistrarVoto")
        .WithSummary("Registra o voto e dispara a apuracao de quorum.");

        grupo.MapGet("/pendentes", async (
            IUsuarioAtual usuario, IConexaoLeitura leitura, CancellationToken ct) =>
        {
            using var conexao = await leitura.AbrirAsync(ct);
            return Results.Ok(await conexao.QueryAsync(
                """
                SELECT v.id_evidencia AS "idEvidencia", v.id_desafio AS "idDesafio",
                       v.desafio, v.id_grupo AS "idGrupo", v.status,
                       e.tipo_midia AS "tipoMidia", e.url_comprovante AS "urlComprovante",
                       e.comentario, e.data_limite_votacao AS "dataLimiteVotacao",
                       v.total_validadores AS "totalValidadores", v.quorum,
                       v.total_votos AS "totalVotos", v.votos_favoraveis AS "votosFavoraveis",
                       v.votos_contra AS "votosContra", v.votos_faltantes AS "votosFaltantes",
                       (j.voto IS NOT NULL) AS "jaVotei",
                       -- A regra do desafio e quem diz ter cumprido: o juri le antes da prova.
                       d.descricao AS "descricaoDesafio", ud.apelido AS desafiado
                  FROM vw_status_votacao v
                  JOIN evidencia e ON e.id_evidencia = v.id_evidencia
                  JOIN desafio d ON d.id_desafio = v.id_desafio
                  JOIN usuario ud ON ud.id_usuario = e.id_usuario
                  -- So aparece para quem esta no juri congelado desta evidencia.
                  JOIN jurado_evidencia j
                    ON j.id_evidencia = v.id_evidencia AND j.id_usuario = @id
                 WHERE v.status = 'EM_VOTACAO'
                 ORDER BY e.data_limite_votacao
                """, new { id = usuario.Id }));
        })
        .WithSummary("Evidencias que este usuario pode validar.");

        app.MapPost("/api/desafios/{idDesafio:int}/evidencias", async (
            int idDesafio,
            EnviarEvidenciaRequest requisicao,
            IValidator<EnviarEvidenciaCommand> validador,
            EnviarEvidenciaHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var comando = new EnviarEvidenciaCommand(
                idDesafio, requisicao.TipoMidia, requisicao.UrlComprovante, requisicao.Comentario);

            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp(id => Results.Created($"/api/desafios/{idDesafio}",
                new { idEvidencia = id }));
        })
        .RequireAuthorization()
        .WithTags("Validacao")
        .WithSummary("Envia evidencia e congela o juri.");
    }
}

public record EnviarEvidenciaRequest(string TipoMidia, string UrlComprovante, string? Comentario);

public record RegistrarVotoRequest(string Voto, string? Justificativa);
