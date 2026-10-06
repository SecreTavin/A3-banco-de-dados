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

    private readonly List<ValidadorEvidencia> _validadores = [];
    public IReadOnlyCollection<ValidadorEvidencia> Validadores => _validadores;

    private readonly List<VotoEvidencia> _votos = [];
    public IReadOnlyCollection<VotoEvidencia> Votos => _votos;

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

        var evidencia = new Evidencia
        {
            IdDesafio = idDesafio,
            IdUsuario = idAutor,
            Ordem = ordem,
            TipoMidia = tipoMidia,
            UrlComprovante = urlComprovante,
            Comentario = comentario,
            Status = StatusEvidencia.EmVotacao,
            DataEnvio = DateTimeOffset.UtcNow,
            DataLimiteVotacao = DateTimeOffset.UtcNow.Add(PrazoVotacao)
        };

        foreach (var idUsuario in elegiveis.Distinct())
            evidencia._validadores.Add(ValidadorEvidencia.De(idUsuario));

        return evidencia;
    }

    public ErrorOr<VotoEvidencia> Votar(int idUsuario, string voto, string? justificativa)
    {
        if (Status != StatusEvidencia.EmVotacao)
            return EvidenciaErrors.NaoEstaEmVotacao;

        if (DateTimeOffset.UtcNow > DataLimiteVotacao)
            return EvidenciaErrors.PrazoExpirado;

        if (_validadores.All(v => v.IdUsuario != idUsuario))
            return EvidenciaErrors.NaoEhValidador;

        if (_votos.Any(v => v.IdUsuario == idUsuario))
            return EvidenciaErrors.JaVotou;

        var novo = VotoEvidencia.Novo(idUsuario, voto, justificativa);
        _votos.Add(novo);
        return novo;
    }

    // RN15: maioria simples sobre o snapshot, nao sobre o grupo atual.
    public int Quorum => (int)Math.Floor(_validadores.Count / 2.0) + 1;
}
