using ErrorOr;

namespace EuDuvido.Api.Modules.Apostas.Domain;

public class Aposta
{
    public int IdAposta { get; private set; }
    public int IdGrupo { get; private set; }
    public int IdCriador { get; private set; }
    public int IdCategoria { get; private set; }
    public string Titulo { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public int ValorCp { get; private set; }
    public string TipoRecompensa { get; private set; } = null!;
    public decimal? ValorMonetario { get; private set; }
    public string? DescricaoPrenda { get; private set; }
    public DateTimeOffset DataCriacao { get; private set; }
    public DateTimeOffset DataLimite { get; private set; }
    public string Status { get; private set; } = null!;
    public string? MotivoCancelamento { get; private set; }
    public DateTimeOffset? DataEncerramento { get; private set; }

    private readonly List<ParticipanteAposta> _participantes = [];
    public IReadOnlyCollection<ParticipanteAposta> Participantes => _participantes;

    private Aposta() { }

    public static Aposta Criar(
        int idGrupo,
        int idCriador,
        int idCategoria,
        string titulo,
        string descricao,
        int valorCp,
        string tipoRecompensa,
        decimal? valorMonetario,
        string? descricaoPrenda,
        DateTimeOffset dataLimite) => new()
        {
            IdGrupo = idGrupo,
            IdCriador = idCriador,
            IdCategoria = idCategoria,
            Titulo = titulo,
            Descricao = descricao,
            ValorCp = valorCp,
            TipoRecompensa = tipoRecompensa,
            // Descritivo apenas: nenhum calculo le esta coluna (ADR 0006).
            ValorMonetario = valorMonetario,
            DescricaoPrenda = descricaoPrenda,
            DataCriacao = DateTimeOffset.UtcNow,
            DataLimite = dataLimite,
            Status = StatusAposta.Aberta
        };

    public ErrorOr<ParticipanteAposta> Aceitar(int idUsuario, string papel, string escolha)
    {
        if (Status != StatusAposta.Aberta)
            return ApostaErrors.NaoAceitaParticipante;

        if (_participantes.Any(p => p.IdUsuario == idUsuario))
            return ApostaErrors.JaParticipa;

        // RN09: 1 DESAFIANTE e 1 DESAFIADO. APOSTADOR e livre.
        if (papel != PapelAposta.Apostador &&
            _participantes.Any(p => p.PapelAposta == papel))
            return ApostaErrors.PapelJaOcupado(papel);

        var participante = ParticipanteAposta.Novo(idUsuario, papel, escolha);
        _participantes.Add(participante);

        // RN21: com desafiante e desafiado definidos, o desafio esta valendo.
        if (TemDuelistas())
            Status = StatusAposta.EmAndamento;

        return participante;
    }

    public ErrorOr<Success> Cancelar(int idSolicitante, string motivo)
    {
        if (StatusAposta.EhTerminal(Status))
            return ApostaErrors.JaEncerrada;

        if (idSolicitante != IdCriador)
            return ApostaErrors.SomenteCriadorCancela;

        if (string.IsNullOrWhiteSpace(motivo))
            return ApostaErrors.MotivoObrigatorio;

        // O estorno do CP e a mudanca de status acontecem em
        // apostas.cancelar_aposta, para que dinheiro e estado commitem juntos.
        return Result.Success;
    }

    public void MarcarEmVotacao() => Status = StatusAposta.EmVotacao;

    public bool PodeReceberEvidencia =>
        Status is StatusAposta.EmAndamento or StatusAposta.EmVotacao;

    private bool TemDuelistas() =>
        _participantes.Any(p => p.PapelAposta == PapelAposta.Desafiante) &&
        _participantes.Any(p => p.PapelAposta == PapelAposta.Desafiado);
}
