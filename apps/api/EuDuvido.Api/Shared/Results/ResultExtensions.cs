using ErrorOr;

namespace EuDuvido.Api.Shared.Results;

// Tipos de erro proprios, alem dos que o ErrorOr ja traz.
public static class TipoErro
{
    // Entrada bem formada, mas recusada pelo que ela diz: idade abaixo da minima,
    // desafio barrado pela moderacao, prova que a IA nao reconheceu. HTTP 422.
    public const int Recusado = StatusCodes.Status422UnprocessableEntity;
}

public static class ResultExtensions
{
    // Mapeamento unico de erro de dominio para HTTP. Falha de infraestrutura
    // nao passa por aqui - sobe como excecao (CLAUDE.md).
    public static IResult ToHttp<T>(this ErrorOr<T> result, Func<T, IResult>? onSuccess = null) =>
        result.IsError
            ? Problem(result.Errors)
            : onSuccess?.Invoke(result.Value) ?? TypedResults.Ok(result.Value);

    private static IResult Problem(List<Error> errors)
    {
        var first = errors[0];
        var status = first.NumericType == TipoErro.Recusado
            ? TipoErro.Recusado
            : first.Type switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError
            };

        return TypedResults.Problem(
            title: first.Code,
            detail: first.Description,
            statusCode: status,
            extensions: errors.Count > 1
                ? new Dictionary<string, object?>
                  {
                      ["errors"] = errors.Select(e => new { e.Code, e.Description })
                  }
                : null);
    }
}
