using System.Net.Http.Json;
using System.Text.Json;

namespace EuDuvido.Api.Shared.Ia;

public interface IChatIa
{
    /// <summary>
    /// Pede ao modelo uma resposta e devolve o objeto JSON que ele produziu.
    /// Lanca IaIndisponivelException em qualquer falha do provedor - nunca
    /// devolve uma aprovacao inventada (ADR 0015).
    /// </summary>
    Task<JsonElement> PerguntarAsync(string instrucoes, string conteudo, CancellationToken ct);
}

// Cliente da API de chat compativel com a OpenAI (POST {BaseUrl}/chat/completions),
// protocolo que a Groq implementa (ADR 0015). Nao usa response_format: o formato
// JSON e pedido no prompt e extraido com tolerancia (RespostaIa), o que mantem o
// cliente independente do modelo escolhido.
public class ChatIa(HttpClient http, IaOptions opcoes, ILogger<ChatIa> log) : IChatIa
{
    public async Task<JsonElement> PerguntarAsync(
        string instrucoes, string conteudo, CancellationToken ct)
    {
        if (!opcoes.Configurada)
            throw new IaIndisponivelException(
                "O servico de IA nao esta configurado (Ia:BaseUrl e Ia:Modelo).");

        var requisicao = new
        {
            model = opcoes.Modelo,
            temperature = 0,
            stream = false,
            messages = new object[]
            {
                new { role = "system", content = instrucoes },
                new { role = "user", content = conteudo }
            }
        };

        string? texto;
        try
        {
            using var resposta = await http.PostAsJsonAsync(Endpoint(), requisicao, ct);

            if (!resposta.IsSuccessStatusCode)
            {
                var detalhe = await resposta.Content.ReadAsStringAsync(ct);
                log.LogWarning("Provedor de IA respondeu HTTP {Status}: {Detalhe}",
                    (int)resposta.StatusCode, detalhe.Length > 300 ? detalhe[..300] : detalhe);
                throw new IaIndisponivelException(
                    $"O provedor de IA respondeu HTTP {(int)resposta.StatusCode}.");
            }

            var corpo = await resposta.Content.ReadFromJsonAsync<RespostaChat>(ct);
            texto = corpo?.Choices?.FirstOrDefault()?.Message?.Content;
        }
        catch (HttpRequestException e)
        {
            throw new IaIndisponivelException("Não foi possível falar com o provedor de IA.", e);
        }
        catch (TaskCanceledException e) when (!ct.IsCancellationRequested)
        {
            throw new IaIndisponivelException("O provedor de IA não respondeu a tempo.", e);
        }
        catch (JsonException e)
        {
            throw new IaIndisponivelException(
                "O provedor de IA respondeu fora do formato da API de chat.", e);
        }

        if (RespostaIa.ExtrairJson(texto) is not { } json)
        {
            log.LogWarning("IA respondeu sem o JSON combinado: {Texto}", texto);
            throw new IaIndisponivelException("A IA respondeu fora do formato combinado.");
        }

        return json;
    }

    // Concatena em vez de usar BaseAddress + caminho relativo: Uri descartaria
    // o /v1 de uma BaseUrl sem barra no fim.
    private Uri Endpoint() => new($"{opcoes.BaseUrl!.TrimEnd('/')}/chat/completions");

    private record RespostaChat(List<Escolha>? Choices);
    private record Escolha(Mensagem? Message);
    private record Mensagem(string? Content);
}
