using ErrorOr;

namespace EuDuvido.Api.Modules.Desafios.Domain;

public class Desafio
{
    public int IdDesafio { get; private set; }
    public int IdGrupo { get; private set; }
    public int IdCriador { get; private set; }
    public int IdCategoria { get; private set; }
    public string Titulo { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public int ValorCp { get; private set; }
    public string TipoRecompensa { get; private set; } = null!;
    public string? DescricaoRecompensa { get; private set; }
    public DateTimeOffset DataCriacao { get; private set; }
    public DateTimeOffset DataLimite { get; private set; }
    public string Status { get; private set; } = null!;
    public string? MotivoCancelamento { get; private set; }
    public DateTimeOffset? DataEncerramento { get; private set; }

    private readonly List<ParticipanteDesafio> _participantes = [];
    public IReadOnlyCollection<ParticipanteDesafio> Participantes => _participantes;

    private Desafio() { }

    public static Desafio Criar(
        int idGrupo,
        int idCriador,
        int idCategoria,
        string titulo,
        string descricao,
        int valorCp,
        string tipoRecompensa,
        string? descricaoRecompensa,
        DateTimeOffset dataLimite) => new()
        {
            IdGrupo = idGrupo,
            IdCriador = idCriador,
            IdCategoria = idCategoria,
            Titulo = titulo,
            Descricao = descricao,
            ValorCp = valorCp,
            TipoRecompensa = tipoRecompensa,
            // Descritivo apenas: nenhum calculo le esta coluna (RN02, ADR 0006).
            DescricaoRecompensa = descricaoRecompensa,
            DataCriacao = DateTimeOffset.UtcNow,
            DataLimite = dataLimite,
            Status = StatusDesafio.Aberta
        };

    public ErrorOr<ParticipanteDesafio> Aceitar(int idUsuario, string papel, string escolha)
    {
        if (Status != StatusDesafio.Aberta)
            return DesafioErrors.NaoAceitaParticipante;

        if (_participantes.Any(p => p.IdUsuario == idUsuario))
            return DesafioErrors.JaParticipa;

        // RN09: 1 DESAFIANTE e 1 DESAFIADO. APOSTADOR e livre.
        if (papel != PapelDesafio.Apostador &&
            _participantes.Any(p => p.PapelDesafio == papel))
            return DesafioErrors.PapelJaOcupado(papel);

        var participante = ParticipanteDesafio.Novo(idUsuario, papel, escolha);
        _participantes.Add(participante);

        // RN21: com desafiante e desafiado definidos, o desafio esta valendo.
        if (TemDuelistas())
            Status = StatusDesafio.EmAndamento;

        return participante;
    }

    public ErrorOr<Success> Cancelar(int idSolicitante, string motivo)
    {
        if (StatusDesafio.EhTerminal(Status))
            return DesafioErrors.JaEncerrado;

        if (idSolicitante != IdCriador)
            return DesafioErrors.SomenteCriadorCancela;

        if (string.IsNullOrWhiteSpace(motivo))
            return DesafioErrors.MotivoObrigatorio;

        // O estorno do CP e a mudanca de status acontecem em
        // desafios.cancelar_desafio, para que dinheiro e estado commitem juntos.
        return Result.Success;
    }

    public void MarcarEmVotacao() => Status = StatusDesafio.EmVotacao;

    public bool PodeReceberEvidencia =>
        Status is StatusDesafio.EmAndamento or StatusDesafio.EmVotacao;

    private bool TemDuelistas() =>
        _participantes.Any(p => p.PapelDesafio == PapelDesafio.Desafiante) &&
        _participantes.Any(p => p.PapelDesafio == PapelDesafio.Desafiado);
}
