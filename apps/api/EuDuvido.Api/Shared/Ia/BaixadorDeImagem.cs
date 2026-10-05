using System.Net;
using System.Net.Sockets;
using ErrorOr;

namespace EuDuvido.Api.Shared.Ia;

public interface IBaixadorDeImagem
{
    /// <summary>
    /// Baixa a foto de um link publico para mandar a IA. Falha do link (fora do
    /// ar, nao e imagem, grande demais) volta como erro: o link e do usuario.
    /// </summary>
    Task<ErrorOr<ImagemIa>> BaixarAsync(string url, CancellationToken ct);
}

// O servidor de IA local nao busca URL sozinho, entao a API baixa a imagem e a
// envia em base64. Baixar um link escolhido pelo usuario e vetor classico de
// SSRF: sem o filtro de rede, "http://169.254.169.254/" ou "http://db:5432"
// fariam a API sondar a propria infraestrutura.
public class BaixadorDeImagem(HttpClient http) : IBaixadorDeImagem
{
    public const int TamanhoMaximo = 5 * 1024 * 1024;

    private static readonly string[] TiposAceitos =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public async Task<ErrorOr<ImagemIa>> BaixarAsync(string url, CancellationToken ct)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("http" or "https"))
            return Falha("informe um link http:// ou https:// para a imagem.");

        try
        {
            using var resposta = await http.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!resposta.IsSuccessStatusCode)
                return Falha($"o link respondeu HTTP {(int)resposta.StatusCode}.");

            var tipo = resposta.Content.Headers.ContentType?.MediaType?.ToLowerInvariant();
            if (tipo is null || !TiposAceitos.Contains(tipo))
                return Falha("o link nao aponta para uma imagem JPEG, PNG, WebP ou GIF.");

            if (resposta.Content.Headers.ContentLength > TamanhoMaximo)
                return Falha("a imagem passa de 5 MB.");

            // Content-Length pode mentir ou faltar: o limite vale para o que chega.
            await using var fluxo = await resposta.Content.ReadAsStreamAsync(ct);
            using var memoria = new MemoryStream();
            var buffer = new byte[81920];
            int lidos;
            while ((lidos = await fluxo.ReadAsync(buffer, ct)) > 0)
            {
                if (memoria.Length + lidos > TamanhoMaximo)
                    return Falha("a imagem passa de 5 MB.");
                memoria.Write(buffer, 0, lidos);
            }

            return new ImagemIa(tipo, memoria.ToArray());
        }
        catch (HttpRequestException)
        {
            return Falha("o link nao pode ser acessado. Use um link publico da imagem.");
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            return Falha("o link demorou demais para responder.");
        }
    }

    private static Error Falha(string motivo) =>
        Error.Validation("Imagem.Inacessivel", motivo);

    /// <summary>
    /// Handler que so conecta em endereco publico. A checagem acontece na hora
    /// de abrir o socket, sobre o IP resolvido - vale tambem para redirect e nao
    /// cai em DNS rebinding (resolver um nome publico e conectar num privado).
    /// </summary>
    public static SocketsHttpHandler CriarHandler() => new()
    {
        AllowAutoRedirect = true,
        MaxAutomaticRedirections = 3,
        ConnectTimeout = TimeSpan.FromSeconds(10),
        // Proxy faria o socket abrir no proxy, e o filtro olharia o IP errado.
        UseProxy = false,
        ConnectCallback = async (contexto, ct) =>
        {
            var enderecos = await Dns.GetHostAddressesAsync(contexto.DnsEndPoint.Host, ct);
            if (enderecos.Length == 0 || !enderecos.All(EnderecoPublico.Eh))
                throw new HttpRequestException(
                    $"Destino {contexto.DnsEndPoint.Host} nao e um endereco publico.");

            var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
            try
            {
                await socket.ConnectAsync(new IPEndPoint(enderecos[0], contexto.DnsEndPoint.Port), ct);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }
    };
}

public static class EnderecoPublico
{
    public static bool Eh(IPAddress ip)
    {
        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();

        if (IPAddress.IsLoopback(ip))
            return false;

        var b = ip.GetAddressBytes();

        if (ip.AddressFamily == AddressFamily.InterNetwork)
            return !(b[0] == 0                                   // "esta rede"
                  || b[0] == 10                                  // privada
                  || b[0] == 127                                 // loopback
                  || (b[0] == 100 && b[1] >= 64 && b[1] <= 127)  // CGNAT
                  || (b[0] == 169 && b[1] == 254)                // link-local / metadata de nuvem
                  || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)   // privada
                  || (b[0] == 192 && b[1] == 0 && b[2] == 0)     // IETF
                  || (b[0] == 192 && b[1] == 168)                // privada
                  || (b[0] == 198 && b[1] is 18 or 19)           // benchmark
                  || b[0] >= 224);                               // multicast e reservada

        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
            return !(ip.Equals(IPAddress.IPv6Any)
                  || ip.IsIPv6LinkLocal
                  || ip.IsIPv6SiteLocal
                  || ip.IsIPv6Multicast
                  || (b[0] & 0xFE) == 0xFC);                     // fc00::/7, unique local

        return false;
    }
}
