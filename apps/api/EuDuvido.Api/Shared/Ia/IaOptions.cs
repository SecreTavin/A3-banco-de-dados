namespace EuDuvido.Api.Shared.Ia;

// Provedor da moderacao de desafios: Groq (ADR 0015). O cliente fala o
// protocolo de chat da OpenAI, que a Groq implementa; trocar de modelo e
// configuracao, nao codigo.
public class IaOptions
{
    public const string Secao = "Ia";

    // URL base ate o /v1, sem barra no fim: https://api.groq.com/openai/v1.
    public string? BaseUrl { get; set; }

    // Chave da Groq. Vem de variavel de ambiente (Ia__ApiKey), nunca do
    // appsettings commitado.
    public string? ApiKey { get; set; }

    // Modelo aberto servido pela Groq, usado na moderacao de desafios. O padrao
    // e openai/gpt-oss-120b porque a Groq aposentou os modelos Llama (o
    // llama-3.3-70b-versatile saiu em 16/08/2026) e indica este como substituto.
    public string? Modelo { get; set; }

    public int TimeoutSegundos { get; set; } = 30;

    public bool Configurada =>
        Uri.TryCreate(BaseUrl, UriKind.Absolute, out _) && !string.IsNullOrWhiteSpace(Modelo);
}
