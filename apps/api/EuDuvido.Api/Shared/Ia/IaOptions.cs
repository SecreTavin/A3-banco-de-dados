namespace EuDuvido.Api.Shared.Ia;

// Qualquer servidor que fale a API de chat da OpenAI serve (ADR 0017): Ollama
// ou LM Studio rodando numa maquina do time e exposto pelo ngrok, Groq, etc.
// Trocar de provedor e configuracao, nao codigo.
public class IaOptions
{
    public const string Secao = "Ia";

    // URL base ate o /v1, sem barra no fim. Ex.: https://abcd.ngrok-free.app/v1
    // (Ollama) ou https://api.groq.com/openai/v1.
    public string? BaseUrl { get; set; }

    // Opcional: Ollama e LM Studio nao pedem chave; Groq e OpenAI pedem.
    // Vem de variavel de ambiente (Ia__ApiKey), nunca do appsettings commitado.
    public string? ApiKey { get; set; }

    // Modelo de texto, usado na moderacao de desafios.
    public string? Modelo { get; set; }

    // Modelo com visao, usado para olhar a foto da evidencia. Sem ele, usa
    // Modelo - que entao precisa aceitar imagem.
    public string? ModeloVisao { get; set; }

    // Modelo local analisando foto pode levar dezenas de segundos.
    public int TimeoutSegundos { get; set; } = 120;

    public bool Configurada =>
        Uri.TryCreate(BaseUrl, UriKind.Absolute, out _) && !string.IsNullOrWhiteSpace(Modelo);

    public string ModeloParaVisao => string.IsNullOrWhiteSpace(ModeloVisao) ? Modelo! : ModeloVisao;
}
