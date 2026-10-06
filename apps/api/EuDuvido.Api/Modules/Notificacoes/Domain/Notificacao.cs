namespace EuDuvido.Api.Modules.Notificacoes.Domain;

public class Notificacao
{
    public int IdNotificacao { get; private set; }
    public int IdUsuario { get; private set; }
    public string Tipo { get; private set; } = null!;
    public string Titulo { get; private set; } = null!;
    public string Corpo { get; private set; } = null!;
    public string? UrlDestino { get; private set; }
    public DateTimeOffset DataCriacao { get; private set; }
    public DateTimeOffset? DataLeitura { get; private set; }

    private Notificacao() { }

    public static Notificacao Nova(int idUsuario, string tipo, string titulo,
        string corpo, string? urlDestino = null) => new()
    {
        IdUsuario = idUsuario,
        Tipo = tipo,
        Titulo = titulo,
        Corpo = corpo,
        UrlDestino = urlDestino,
        DataCriacao = DateTimeOffset.UtcNow
    };

    public void MarcarLida() => DataLeitura = DateTimeOffset.UtcNow;
}

public static class TipoNotificacao
{
    public const string PrazoVencendo = "PRAZO_VENCENDO";
    public const string EvidenciaEnviada = "EVIDENCIA_ENVIADA";
    public const string VotacaoAberta = "VOTACAO_ABERTA";
    public const string DesafioEncerrado = "DESAFIO_ENCERRADO";
    public const string ConviteAceito = "CONVITE_ACEITO";
}
