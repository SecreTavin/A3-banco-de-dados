using System.Net;
using System.Text;
using System.Text.Json;
using EuDuvido.Api.Shared.Ia;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EuDuvido.Api.Tests.Unidade;

// Cliente da Groq contra um HttpMessageHandler falso: o formato da chamada e o
// tratamento de falha sem rede de verdade. Provedor fora do ar e excecao (503
// na borda), nunca Result - e nunca aprovacao silenciosa (ADR 0015).
public class ChatIaTests
{
    private const string BaseUrl = "https://api.groq.com/openai/v1";
    private const string Modelo = "openai/gpt-oss-120b";

    private sealed class HandlerFalso(Func<HttpRequestMessage, HttpResponseMessage> responder)
        : HttpMessageHandler
    {
        public HttpRequestMessage? Requisicao { get; private set; }
        public string? Corpo { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            Requisicao = request;
            Corpo = request.Content is null ? null : await request.Content.ReadAsStringAsync(ct);
            return responder(request);
        }
    }

    private static HttpResponseMessage RespostaChat(string conteudo) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(
            JsonSerializer.Serialize(new { choices = new[] { new { message = new { content = conteudo } } } }),
            Encoding.UTF8, "application/json")
    };

    private static ChatIa Criar(HandlerFalso handler, string? baseUrl = BaseUrl, string? modelo = Modelo)
    {
        var opcoes = new IaOptions { BaseUrl = baseUrl, Modelo = modelo, ApiKey = "chave" };
        return new ChatIa(new HttpClient(handler), opcoes, NullLogger<ChatIa>.Instance);
    }

    [Fact(DisplayName = "Chama /chat/completions com o modelo configurado e devolve o JSON")]
    public async Task ChamadaBemSucedida()
    {
        var handler = new HandlerFalso(_ => RespostaChat("""{"aprovado": true, "motivo": "ok"}"""));

        var json = await Criar(handler).PerguntarAsync("instrucoes", "conteudo", default);

        json.GetProperty("aprovado").GetBoolean().Should().BeTrue();
        handler.Requisicao!.RequestUri.Should().Be(new Uri($"{BaseUrl}/chat/completions"));
        handler.Requisicao.Method.Should().Be(HttpMethod.Post);

        using var corpo = JsonDocument.Parse(handler.Corpo!);
        corpo.RootElement.GetProperty("model").GetString().Should().Be(Modelo);
        corpo.RootElement.GetProperty("temperature").GetInt32().Should().Be(0);
        var mensagens = corpo.RootElement.GetProperty("messages");
        mensagens[0].GetProperty("role").GetString().Should().Be("system");
        mensagens[1].GetProperty("content").GetString().Should().Be("conteudo");
    }

    [Fact(DisplayName = "BaseUrl com barra no fim nao perde o /v1")]
    public async Task BarraNoFim()
    {
        var handler = new HandlerFalso(_ => RespostaChat("""{"aprovado": true}"""));

        await Criar(handler, baseUrl: BaseUrl + "/").PerguntarAsync("i", "c", default);

        handler.Requisicao!.RequestUri!.AbsolutePath.Should().Be("/openai/v1/chat/completions");
    }

    [Theory(DisplayName = "Sem BaseUrl ou sem modelo a IA esta indisponivel")]
    [InlineData(null, Modelo)]
    [InlineData("", Modelo)]
    [InlineData("nao-e-url", Modelo)]
    [InlineData(BaseUrl, null)]
    [InlineData(BaseUrl, " ")]
    public async Task NaoConfigurada(string? baseUrl, string? modelo)
    {
        var handler = new HandlerFalso(_ => RespostaChat("{}"));

        var perguntar = () => Criar(handler, baseUrl, modelo).PerguntarAsync("i", "c", default);

        await perguntar.Should().ThrowAsync<IaIndisponivelException>();
        handler.Requisicao.Should().BeNull("nada e enviado sem configuracao");
    }

    [Theory(DisplayName = "Erro HTTP do provedor e falha de infraestrutura")]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task ErroHttp(HttpStatusCode status)
    {
        var handler = new HandlerFalso(_ => new HttpResponseMessage(status)
            { Content = new StringContent("{\"error\":\"model_decommissioned\"}") });

        var perguntar = () => Criar(handler).PerguntarAsync("i", "c", default);

        (await perguntar.Should().ThrowAsync<IaIndisponivelException>())
            .WithMessage($"*HTTP {(int)status}*");
    }

    [Fact(DisplayName = "Provedor inalcancavel e falha de infraestrutura")]
    public async Task SemRede()
    {
        var handler = new HandlerFalso(_ => throw new HttpRequestException("DNS"));

        var perguntar = () => Criar(handler).PerguntarAsync("i", "c", default);

        await perguntar.Should().ThrowAsync<IaIndisponivelException>();
    }

    [Theory(DisplayName = "Resposta fora do formato combinado e falha, nunca aprovacao")]
    [InlineData("Aprovado!")]
    [InlineData("")]
    public async Task ForaDoFormato(string conteudo)
    {
        var handler = new HandlerFalso(_ => RespostaChat(conteudo));

        var perguntar = () => Criar(handler).PerguntarAsync("i", "c", default);

        await perguntar.Should().ThrowAsync<IaIndisponivelException>();
    }

    [Fact(DisplayName = "Corpo que nao e da API de chat e falha de infraestrutura")]
    public async Task CorpoInvalido()
    {
        var handler = new HandlerFalso(_ => new HttpResponseMessage(HttpStatusCode.OK)
            { Content = new StringContent("<html>gateway</html>", Encoding.UTF8, "application/json") });

        var perguntar = () => Criar(handler).PerguntarAsync("i", "c", default);

        await perguntar.Should().ThrowAsync<IaIndisponivelException>();
    }
}
