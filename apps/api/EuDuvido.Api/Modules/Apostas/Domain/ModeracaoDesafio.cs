namespace EuDuvido.Api.Modules.Apostas.Domain;

// Auditoria da moderacao por IA (RN28, ADR 0015): uma linha por avaliacao,
// aprovada ou nao. Desafio reprovado nao vira aposta, por isso a linha guarda o
// texto avaliado e id_aposta so e preenchido na aprovacao.
public class ModeracaoDesafio
{
    public const int TamanhoMaximoMotivo = 500;

    public int IdModeracao { get; private set; }
    public int IdGrupo { get; private set; }
    public int IdCriador { get; private set; }
    public int? IdAposta { get; private set; }
    public string NivelFiltro { get; private set; } = null!;
    public string Titulo { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public bool Aprovado { get; private set; }
    public string? Motivo { get; private set; }
    public DateTimeOffset DataAvaliacao { get; private set; }

    private ModeracaoDesafio() { }

    // nivelFiltro e copiado do grupo no momento da avaliacao: o admin pode mudar
    // o nivel depois, e sem a copia a taxa de bloqueio por nivel mentiria (RN27).
    public static ModeracaoDesafio Registrar(
        int idGrupo, int idCriador, string nivelFiltro,
        string titulo, string descricao, bool aprovado, string? motivo) => new()
        {
            IdGrupo = idGrupo,
            IdCriador = idCriador,
            NivelFiltro = nivelFiltro,
            Titulo = titulo,
            Descricao = descricao,
            Aprovado = aprovado,
            // chk_moderacao_motivo: reprovacao sempre tem motivo.
            Motivo = Truncar(motivo) ?? (aprovado ? null : "A IA recusou sem informar o motivo."),
            DataAvaliacao = DateTimeOffset.UtcNow
        };

    // chk_moderacao_aposta: so desafio aprovado se liga a uma aposta.
    public void VincularAposta(int idAposta)
    {
        if (!Aprovado)
            throw new InvalidOperationException("Desafio reprovado nao gera aposta.");

        IdAposta = idAposta;
    }

    private static string? Truncar(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? null
        : texto.Length <= TamanhoMaximoMotivo ? texto
        : texto[..TamanhoMaximoMotivo];
}
