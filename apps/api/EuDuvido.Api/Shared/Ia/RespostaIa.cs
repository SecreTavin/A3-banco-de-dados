using System.Text.Json;
using System.Text.RegularExpressions;

namespace EuDuvido.Api.Shared.Ia;

// Modelos abertos nem sempre obedecem "responda so o JSON": alguns embrulham em
// ```json, outros pensam em voz alta dentro de <think>. Aqui se aceita o primeiro
// objeto JSON valido do texto e nada mais.
public static partial class RespostaIa
{
    public static JsonElement? ExtrairJson(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return null;

        var limpo = Raciocinio().Replace(texto, string.Empty);
        var inicio = limpo.IndexOf('{');
        var fim = limpo.LastIndexOf('}');
        if (inicio < 0 || fim <= inicio)
            return null;

        try
        {
            using var documento = JsonDocument.Parse(limpo[inicio..(fim + 1)]);
            return documento.RootElement.ValueKind == JsonValueKind.Object
                ? documento.RootElement.Clone()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// Le um booleano obrigatorio. Aceita true/false e as strings "true"/"false"
    /// que alguns modelos devolvem; qualquer outra coisa e resposta invalida.
    /// </summary>
    public static bool LerBooleano(JsonElement json, string campo)
    {
        if (json.TryGetProperty(campo, out var valor))
        {
            if (valor.ValueKind is JsonValueKind.True or JsonValueKind.False)
                return valor.GetBoolean();

            if (valor.ValueKind == JsonValueKind.String &&
                bool.TryParse(valor.GetString(), out var convertido))
                return convertido;
        }

        throw new IaIndisponivelException($"A IA respondeu sem o campo '{campo}'.");
    }

    public static string? LerTexto(JsonElement json, string campo) =>
        json.TryGetProperty(campo, out var valor) && valor.ValueKind == JsonValueKind.String
            ? valor.GetString()?.Trim()
            : null;

    [GeneratedRegex("<think>.*?</think>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex Raciocinio();
}
