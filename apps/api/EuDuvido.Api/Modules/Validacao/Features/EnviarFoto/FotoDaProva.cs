using System.Text.RegularExpressions;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarFoto;

// Regras da foto enviada como prova (ADR 0022). O tipo vem dos primeiros bytes
// do arquivo, nao do nome nem do Content-Type que o navegador declara.
public static partial class FotoDaProva
{
    // Foto de celular fica entre 2 e 5 MB; o front ainda reduz antes de enviar.
    public const long LimiteBytes = 8 * 1024 * 1024;

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public static (string Extensao, string Tipo)? Identificar(ReadOnlySpan<byte> inicio)
    {
        if (inicio.StartsWith(Jpeg)) return ("jpg", "image/jpeg");
        if (inicio.StartsWith(Png)) return ("png", "image/png");
        if (inicio.Length >= 12 && inicio[..4].SequenceEqual("RIFF"u8) && inicio[8..12].SequenceEqual("WEBP"u8))
            return ("webp", "image/webp");
        return null;
    }

    // 32 hex de um Guid e a extensao: impede caminho, barra e nome escolhido.
    public static bool NomeValido(string nome) => Nome().IsMatch(nome);

    public static string NovoNome(string extensao) => $"{Guid.NewGuid():N}.{extensao}";

    [GeneratedRegex(@"^[0-9a-f]{32}\.(jpg|png|webp)$")]
    private static partial Regex Nome();
}
