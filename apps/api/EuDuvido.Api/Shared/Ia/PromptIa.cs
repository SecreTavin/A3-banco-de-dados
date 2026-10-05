namespace EuDuvido.Api.Shared.Ia;

public static class PromptIa
{
    /// <summary>
    /// Envolve texto do usuario em marcas que o prompt manda tratar como dado.
    /// Os sinais de menor/maior viram aspas angulares para que ninguem feche a
    /// marca de dentro do proprio texto e escreva instrucoes para a IA.
    /// </summary>
    public static string Delimitar(string marca, string texto) =>
        $"<{marca}>\n{texto.Replace('<', '‹').Replace('>', '›').Trim()}\n</{marca}>";
}
