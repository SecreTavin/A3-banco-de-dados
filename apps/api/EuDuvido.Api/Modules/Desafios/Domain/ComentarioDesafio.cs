namespace EuDuvido.Api.Modules.Desafios.Domain;

public class ComentarioDesafio
{
    public int IdComentario { get; private set; }
    public int IdDesafio { get; private set; }
    public int IdUsuario { get; private set; }
    public string Texto { get; private set; } = null!;
    public DateTimeOffset DataEnvio { get; private set; }

    private ComentarioDesafio() { }

    public static ComentarioDesafio Novo(int idDesafio, int idUsuario, string texto) => new()
    {
        IdDesafio = idDesafio,
        IdUsuario = idUsuario,
        Texto = texto.Trim(),
        DataEnvio = DateTimeOffset.UtcNow
    };
}
