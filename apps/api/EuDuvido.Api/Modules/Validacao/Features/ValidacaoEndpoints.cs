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
                       EXISTS (SELECT 1 FROM validacao.voto_evidencia x
                                WHERE x.id_evidencia = v.id_evidencia
                                  AND x.id_usuario = @id) AS "jaVotei"
                  FROM validacao.vw_status_votacao v
                  JOIN validacao.evidencia e ON e.id_evidencia = v.id_evidencia
                  JOIN validacao.validador_evidencia val
                    ON val.id_evidencia = v.id_evidencia AND val.id_usuario = @id
                 WHERE v.status = 'EM_VOTACAO'
                 ORDER BY e.data_limite_votacao
                """, new { id = usuario.Id }));
        })
        .WithSummary("Evidencias que este usuario pode validar.");

        app.MapPost("/api/desafios/{idDesafio:int}/evidencias", async (
            int idDesafio,
            EnviarEvidenciaRequest requisicao,
            EnviarEvidenciaHandler handler,
            IUsuarioAtual usuario,
            CancellationToken ct) =>
        {
            var comando = new EnviarEvidenciaCommand(
                idDesafio, requisicao.TipoMidia, requisicao.UrlComprovante, requisicao.Comentario);

            var resultado = await handler.Handle(comando, usuario.Id, ct);
            return resultado.ToHttp(id => Results.Created($"/api/evidencias/{id}",
                new { idEvidencia = id }));
        })
        .RequireAuthorization()
        .WithTags("Validacao")
        .WithSummary("Envia evidencia e congela o juri.");
    }
}

public record EnviarEvidenciaRequest(string TipoMidia, string UrlComprovante, string? Comentario);

public record RegistrarVotoRequest(string Voto, string? Justificativa);
