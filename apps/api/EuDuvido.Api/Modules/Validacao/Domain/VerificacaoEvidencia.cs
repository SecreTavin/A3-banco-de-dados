namespace EuDuvido.Api.Modules.Validacao.Domain;

// Auditoria da verificacao de prova por IA (ADR 0017): uma linha por analise,
// aprovada ou nao. Prova que a IA nao reconhece nao vira evidencia - nao vai ao
// juri nem consome uma das 5 tentativas (RN10) -, por isso a linha guarda o que
// foi analisado e id_evidencia so e preenchido na aprovacao. O parecer da
// aprovada e mostrado ao juri como opiniao consultiva: quem decide e o juri.
public class VerificacaoEvidencia
{
    public const int TamanhoMaximoParecer = 500;

    public int IdVerificacao { get; private set; }
    public int IdAposta { get; private set; }
    public int IdUsuario { get; private set; }
    public int? IdEvidencia { get; private set; }
    public string TipoMidia { get; private set; } = null!;
    public string UrlComprovante { get; private set; } = null!;
    public string? Comentario { get; private set; }
    public bool Aprovado { get; private set; }
    public string Parecer { get; private set; } = null!;
    public DateTimeOffset DataAvaliacao { get; private set; }

    private VerificacaoEvidencia() { }

    public static VerificacaoEvidencia Registrar(
        int idAposta, int idUsuario, string tipoMidia, string urlComprovante,
        string? comentario, bool aprovado, string? parecer) => new()
        {
            IdAposta = idAposta,
            IdUsuario = idUsuario,
            TipoMidia = tipoMidia,
            UrlComprovante = urlComprovante,
            Comentario = comentario,
            Aprovado = aprovado,
            Parecer = Normalizar(parecer),
            DataAvaliacao = DateTimeOffset.UtcNow
        };

    // chk_verificacao_evidencia: so prova aprovada se liga a uma evidencia.
    public void VincularEvidencia(int idEvidencia)
    {
        if (!Aprovado)
            throw new InvalidOperationException("Prova recusada pela IA nao gera evidencia.");

        IdEvidencia = idEvidencia;
    }

    private static string Normalizar(string? parecer)
    {
        if (string.IsNullOrWhiteSpace(parecer))
            return "A IA nao detalhou a analise.";

        var texto = parecer.Trim();
        return texto.Length <= TamanhoMaximoParecer ? texto : texto[..TamanhoMaximoParecer];
    }
}
