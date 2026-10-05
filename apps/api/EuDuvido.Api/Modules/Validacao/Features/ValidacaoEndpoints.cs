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
                SELECT v.id_evidencia AS "idEvidencia", v.id_aposta AS "idAposta",
                       v.desafio, v.id_grupo AS "idGrupo", v.status,
                       e.tipo_midia AS "tipoMidia", e.url_comprovante AS "urlComprovante",
                       e.comentario, e.data_limite_votacao AS "dataLimiteVotacao",
                       v.total_validadores AS "totalValidadores", v.quorum,
                       v.total_votos AS "totalVotos", v.votos_favoraveis AS "votosFavoraveis",
                       v.votos_contra AS "votosContra", v.votos_faltantes AS "votosFaltantes",
                       (j.voto IS NOT NULL) AS "jaVotei",
                       ve.parecer AS "parecerIa"
                  FROM vw_status_votacao v
                  JOIN evidencia e ON e.id_evidencia = v.id_evidencia
                  -- So aparece para quem esta no juri congelado desta evidencia.
                  JOIN jurado_evidencia j
                    ON j.id_evidencia = v.id_evidencia AND j.id_usuario = @id
                  LEFT JOIN verificacao_evidencia ve ON ve.id_evidencia = e.id_evidencia
                 WHERE v.status = 'EM_VOTACAO'
                 ORDER BY e.data_limite_votacao
                """, new { id = usuario.Id }));
        })
        .WithSummary("Evidencias que este usuario pode validar.");

        app.MapPost("/api/apostas/{idAposta:int}/evidencias", async (
            int idAposta,
            EnviarEvidenciaRequest requisicao,
            IValidator<EnviarEvidenciaCommand> validador,
            EnviarEvidenciaHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var comando = new EnviarEvidenciaCommand(
                idAposta, requisicao.TipoMidia, requisicao.UrlComprovante, requisicao.Comentario);

            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp(enviada => Results.Created(
                $"/api/apostas/{idAposta}", enviada));
        })
        .RequireAuthorization()
        .WithTags("Validacao")
        .WithSummary("A IA confere a prova; se reconhecer, vira evidencia e o juri e congelado.");
    }
}

public record EnviarEvidenciaRequest(string TipoMidia, string UrlComprovante, string? Comentario);

public record RegistrarVotoRequest(string Voto, string? Justificativa);
