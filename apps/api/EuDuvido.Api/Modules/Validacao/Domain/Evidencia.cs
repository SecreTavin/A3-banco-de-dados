using ErrorOr;

namespace EuDuvido.Api.Modules.Validacao.Domain;

public class Evidencia
{
    public const int MaximoPorDesafio = 5;
    public static readonly TimeSpan PrazoVotacao = TimeSpan.FromDays(7);

    public int IdEvidencia { get; private set; }
    public int IdDesafio { get; private set; }
    public int IdUsuario { get; private set; }
    public int Ordem { get; private set; }
    public string TipoMidia { get; private set; } = null!;
    public string UrlComprovante { get; private set; } = null!;
    public string? Comentario { get; private set; }
    public string Status { get; private set; } = null!;
    public DateTimeOffset DataEnvio { get; private set; }
    public DateTimeOffset DataLimiteVotacao { get; private set; }
    public DateTimeOffset? DataApuracao { get; private set; }

    private readonly List<JuradoEvidencia> _jurados = [];
    public IReadOnlyCollection<JuradoEvidencia> Jurados => _jurados;

    private Evidencia() { }

    /// <param name="elegiveis">
    /// Membros do grupo menos DESAFIANTE e DESAFIADO. Fica congelado aqui.
    /// </param>
    public static ErrorOr<Evidencia> Enviar(
        int idDesafio,
        int idAutor,
        int ordem,
        string tipoMidia,
        string urlComprovante,
        string? comentario,
        IEnumerable<int> elegiveis)
    {
        if (ordem > MaximoPorDesafio)
            return EvidenciaErrors.LimiteAtingido;

        var agora = DateTimeOffset.UtcNow;
        var evidencia = new Evidencia
        {
            IdDesafio = idDesafio,
            IdUsuario = idAutor,
            Ordem = ordem,
            TipoMidia = tipoMidia,
            UrlComprovante = urlComprovante,
            Comentario = comentario,
            Status = StatusEvidencia.EmVotacao,
            DataEnvio = agora,
            DataLimiteVotacao = agora.Add(PrazoVotacao)
        };

        foreach (var idUsuario in elegiveis.Distinct())
            evidencia._jurados.Add(JuradoEvidencia.Congelar(idUsuario));

        return evidencia;
    }

    public ErrorOr<JuradoEvidencia> Votar(int idUsuario, string voto, string? justificativa)
    {
        if (Status != StatusEvidencia.EmVotacao)
            return EvidenciaErrors.NaoEstaEmVotacao;

        if (DateTimeOffset.UtcNow > DataLimiteVotacao)
            return EvidenciaErrors.PrazoExpirado;

        var jurado = _jurados.FirstOrDefault(j => j.IdUsuario == idUsuario);
        if (jurado is null)
            return EvidenciaErrors.NaoEhValidador;

        if (jurado.JaVotou)
            return EvidenciaErrors.JaVotou;

        jurado.Votar(voto, justificativa);
        return jurado;
    }

    // RN15: maioria simples sobre o juri congelado, nao sobre o grupo atual.
    public int Quorum => (int)Math.Floor(_jurados.Count / 2.0) + 1;
}
