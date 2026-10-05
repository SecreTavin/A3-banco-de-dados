using System.Net.Http.Json;
using System.Text.Json;

namespace EuDuvido.Api.Shared.Ia;

public record ImagemIa(string TipoMime, byte[] Conteudo)
{
    public string ComoDataUrl() => $"data:{TipoMime};base64,{Convert.ToBase64String(Conteudo)}";
}

public interface IChatIa
{
    /// <summary>
    /// Pede ao modelo uma resposta e devolve o objeto JSON que ele produziu.
    /// Com imagem, usa o modelo de visao. Lanca IaIndisponivelException em
    /// qualquer falha do provedor - nunca devolve uma aprovacao inventada.
    /// </summary>
    Task<JsonElement> PerguntarAsync(
        string instrucoes, string conteudo, ImagemIa? imagem, CancellationToken ct);
}

// Cliente da API de chat compativel com a OpenAI (POST {BaseUrl}/chat/completions).
// Nao usa response_format: nem todo servidor local aceita o mesmo dialeto, entao
// o formato JSON e pedido no prompt e extraido com tolerancia (RespostaIa).
public class ChatIa(HttpClient http, IaOptions opcoes, ILogger<ChatIa> log) : IChatIa
{
    public async Task<JsonElement> PerguntarAsync(
        string instrucoes, string conteudo, ImagemIa? imagem, CancellationToken ct)
    {
        if (!opcoes.Configurada)
            throw new IaIndisponivelException(
                "O servico de IA nao esta configurado (Ia:BaseUrl e Ia:Modelo).");

        var requisicao = new
        {
            model = imagem is null ? opcoes.Modelo : opcoes.ModeloParaVisao,
            temperature = 0,
            stream = false,
            messages = new object[]
            {
                new { role = "system", content = instrucoes },
                new { role = "user", content = MontarConteudo(conteudo, imagem) }
            }
        };

        string? texto;
        try
        {
            using var resposta = await http.PostAsJsonAsync(Endpoint(), requisicao, ct);

            if (!resposta.IsSuccessStatusCode)
            {
                var detalhe = await resposta.Content.ReadAsStringAsync(ct);
                log.LogWarning("Servidor de IA respondeu HTTP {Status}: {Detalhe}",
                    (int)resposta.StatusCode, detalhe.Length > 300 ? detalhe[..300] : detalhe);
                throw new IaIndisponivelException(
                    $"O servidor de IA respondeu HTTP {(int)resposta.StatusCode}.");
            }

            var corpo = await resposta.Content.ReadFromJsonAsync<RespostaChat>(ct);
            texto = corpo?.Choices?.FirstOrDefault()?.Message?.Content;
        }
        catch (HttpRequestException e)
        {
            throw new IaIndisponivelException("Nao foi possivel falar com o servidor de IA.", e);
        }
        catch (TaskCanceledException e) when (!ct.IsCancellationRequested)
        {
            throw new IaIndisponivelException("O servidor de IA nao respondeu a tempo.", e);
        }
        catch (JsonException e)
        {
            throw new IaIndisponivelException(
                "O servidor de IA respondeu fora do formato da API de chat.", e);
        }

        if (RespostaIa.ExtrairJson(texto) is not { } json)
        {
            log.LogWarning("IA respondeu sem o JSON combinado: {Texto}", texto);
            throw new IaIndisponivelException("A IA respondeu fora do formato combinado.");
        }

        return json;
    }

    // Texto puro quando nao ha imagem: modelos so de texto recusam conteudo em partes.
    private static object MontarConteudo(string conteudo, ImagemIa? imagem) =>
        imagem is null
            ? conteudo
            : new object[]
            {
                new { type = "text", text = conteudo },
                new { type = "image_url", image_url = new { url = imagem.ComoDataUrl() } }
            };

    // Concatena em vez de usar BaseAddress + caminho relativo: Uri descartaria
    // o /v1 de uma BaseUrl sem barra no fim.
    private Uri Endpoint() => new($"{opcoes.BaseUrl!.TrimEnd('/')}/chat/completions");

    private record RespostaChat(List<Escolha>? Choices);
    private record Escolha(Mensagem? Message);
    private record Mensagem(string? Content);
}
