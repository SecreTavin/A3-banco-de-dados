using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;

namespace EuDuvido.Api.Shared.Midia;

public class StorageOptions
{
    public const string Secao = "Storage";

    public string Endpoint { get; set; } = "http://localhost:9000";
    public string Bucket { get; set; } = "evidencias";
    public string AccessKey { get; set; } = null!;
    public string SecretKey { get; set; } = null!;
}

public record ArquivoMidia(byte[] Conteudo, string Tipo);

// Onde a foto da prova mora (ADR 0022). O banco guarda so a URL, em
// evidencia.url_comprovante; o arquivo fica no MinIO e sai pela API.
public interface IArmazenamentoMidia
{
    Task SalvarAsync(string nome, Stream conteudo, long tamanho, string tipo, CancellationToken ct);

    // Null quando o objeto nao existe.
    Task<ArquivoMidia?> LerAsync(string nome, CancellationToken ct);
}

// MinIO fora do ar e falha de infraestrutura: sobe como excecao, nunca como
// Result (CLAUDE.md).
public class ArmazenamentoMinio(StorageOptions opcoes) : IArmazenamentoMidia
{
    private readonly IMinioClient cliente = Criar(opcoes);

    private static IMinioClient Criar(StorageOptions opcoes)
    {
        var endpoint = new Uri(opcoes.Endpoint);
        return new MinioClient()
            .WithEndpoint(endpoint.Host, endpoint.Port)
            .WithCredentials(opcoes.AccessKey, opcoes.SecretKey)
            .WithSSL(endpoint.Scheme == Uri.UriSchemeHttps)
            .Build();
    }

    public async Task SalvarAsync(string nome, Stream conteudo, long tamanho, string tipo, CancellationToken ct) =>
        await cliente.PutObjectAsync(new PutObjectArgs()
            .WithBucket(opcoes.Bucket)
            .WithObject(nome)
            .WithStreamData(conteudo)
            .WithObjectSize(tamanho)
            .WithContentType(tipo), ct);

    public async Task<ArquivoMidia?> LerAsync(string nome, CancellationToken ct)
    {
        try
        {
            var memoria = new MemoryStream();
            var info = await cliente.GetObjectAsync(new GetObjectArgs()
                .WithBucket(opcoes.Bucket)
                .WithObject(nome)
                .WithCallbackStream((origem, c) => origem.CopyToAsync(memoria, c)), ct);
            return new ArquivoMidia(memoria.ToArray(), info.ContentType);
        }
        catch (ObjectNotFoundException)
        {
            return null;
        }
    }
}
