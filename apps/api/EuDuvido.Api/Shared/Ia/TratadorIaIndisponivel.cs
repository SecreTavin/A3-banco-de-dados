using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace EuDuvido.Api.Shared.Ia;

// IA fora do ar e falha de infraestrutura: sobe como excecao (nao Result) e
// so aqui, na borda, vira 503 com mensagem legivel. Qualquer outra excecao
// segue para o tratamento padrao.
public class TratadorIaIndisponivel(
    IProblemDetailsService problemas, ILogger<TratadorIaIndisponivel> log) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext contexto, Exception excecao, CancellationToken ct)
    {
        if (excecao is not IaIndisponivelException ia)
            return false;

        log.LogError(excecao, "Servico de IA indisponivel.");

        contexto.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        return await problemas.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = contexto,
            Exception = excecao,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Ia.Indisponivel",
                Detail = $"{ia.Message} Nada foi criado: tente de novo em instantes."
            }
        });
    }
}
