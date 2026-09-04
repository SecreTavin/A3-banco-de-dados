using ErrorOr;

namespace EuDuvido.Api.Shared.Results;

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
        var status = first.Type switch
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
