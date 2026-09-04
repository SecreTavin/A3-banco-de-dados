namespace EuDuvido.Api.Modules.Apostas.Domain;

public class ComentarioAposta
{
    public int IdComentario { get; private set; }
    public int IdAposta { get; private set; }
    public int IdUsuario { get; private set; }
    public string Texto { get; private set; } = null!;
    public DateTimeOffset DataEnvio { get; private set; }

    private ComentarioAposta() { }

    public static ComentarioAposta Novo(int idAposta, int idUsuario, string texto) => new()
    {
        IdAposta = idAposta,
        IdUsuario = idUsuario,
        Texto = texto.Trim(),
        DataEnvio = DateTimeOffset.UtcNow
    };
}
