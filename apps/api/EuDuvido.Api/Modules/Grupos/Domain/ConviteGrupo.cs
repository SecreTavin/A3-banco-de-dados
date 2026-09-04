using System.Security.Cryptography;

namespace EuDuvido.Api.Modules.Grupos.Domain;

public class ConviteGrupo
{
    // Sem 0/O e 1/I/L: o codigo e ditado em voz alta (RN20).
    private const string Alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    public int IdConvite { get; private set; }
    public int IdGrupo { get; private set; }
    public string Codigo { get; private set; } = null!;
    public int IdCriador { get; private set; }
    public DateTimeOffset DataCriacao { get; private set; }
    public DateTimeOffset DataExpiracao { get; private set; }
    public int? IdUsadoPor { get; private set; }
    public DateTimeOffset? DataUso { get; private set; }

    private ConviteGrupo() { }

    public static ConviteGrupo Gerar(int idGrupo, int idCriador, TimeSpan validade) => new()
    {
        IdGrupo = idGrupo,
        Codigo = GerarCodigo(),
        IdCriador = idCriador,
        DataCriacao = DateTimeOffset.UtcNow,
        DataExpiracao = DateTimeOffset.UtcNow.Add(validade)
    };

    public bool Expirado => DateTimeOffset.UtcNow > DataExpiracao;
    public bool Usado => IdUsadoPor is not null;

    public void Consumir(int idUsuario)
    {
        IdUsadoPor = idUsuario;
        DataUso = DateTimeOffset.UtcNow;
    }

    private static string GerarCodigo() =>
        string.Concat(Enumerable.Range(0, 6)
            .Select(_ => Alfabeto[RandomNumberGenerator.GetInt32(Alfabeto.Length)]));
}
