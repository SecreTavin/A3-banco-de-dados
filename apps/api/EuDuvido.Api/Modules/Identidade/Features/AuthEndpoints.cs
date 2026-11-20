using EuDuvido.Api.Modules.Identidade.Features.CompletarCadastro;
using EuDuvido.Api.Modules.Identidade.Features.EntrarComGoogle;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Results;
using FluentValidation;

namespace EuDuvido.Api.Modules.Identidade.Features;

// Acesso so pelo Google (RN05, ADR 0021): o login de desenvolvimento saiu.
public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/auth").WithTags("Auth");

        // O Client ID nao e segredo; o front le daqui em vez de embuti-lo no build.
        grupo.MapGet("/configuracao", (AuthOptions auth) =>
            Results.Ok(new { googleClientId = auth.GoogleClientId }))
        .WithSummary("Client ID do Google para o botao de login.");

        grupo.MapPost("/google", async (EntrarComGoogleRequest requisicao, AuthOptions auth,
            EntrarComGoogleHandler handler, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(auth.GoogleClientId))
                return Results.Problem("O login com Google não está configurado no servidor.", statusCode: 503);
            if (string.IsNullOrWhiteSpace(requisicao.Credential))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["credential"] = ["Credencial do Google ausente."]
                });

            var resultado = await handler.Handle(requisicao.Credential, ct);
            return resultado.ToHttp();
        })
        .WithSummary("Valida o ID token do Google: entra, ou pede para completar o cadastro.");

        // RN26: menor de 16 anos e recusado pelo dominio e, por baixo, pela trigger.
        grupo.MapPost("/cadastro", async (CompletarCadastroCommand comando,
            IValidator<CompletarCadastroCommand> validador, CompletarCadastroHandler handler,
            CancellationToken ct) =>
        {
            var validacao = await validador.ValidateAsync(comando, ct);
            if (!validacao.IsValid)
                return Results.ValidationProblem(validacao.ToDictionary());

            var resultado = await handler.Handle(comando, ct);
            return resultado.ToHttp(r => Results.Created($"/api/perfil", r));
        })
        .WithSummary("Completa o cadastro de quem entrou pelo Google pela primeira vez.");
    }
}
