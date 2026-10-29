namespace EuDuvido.Api.Modules.Economia.Domain;

// Ledger append-only. Trigger no banco bloqueia UPDATE e DELETE - estorno e
// lancamento novo. O saldo materializado de cada membro sempre bate com a soma
// dos lancamentos dele (vw_reconciliacao_saldo vazia - ADR 0007).
public class TransacaoCp
{
    public int IdTransacao { get; private set; }
    public int IdGrupo { get; private set; }
    public int? IdUsuario { get; private set; }
    public int? IdDesafio { get; private set; }
    public string Tipo { get; private set; } = null!;
    public int Valor { get; private set; }
    public string Descricao { get; private set; } = null!;
    public DateTimeOffset DataLancamento { get; private set; }

    private TransacaoCp() { }
}

public static class TipoTransacao
{
    public const string CreditoInicial = "CREDITO_INICIAL";
    public const string DesafioEscrow = "DESAFIO_ESCROW";
    public const string Premio = "PREMIO";
    public const string Estorno = "ESTORNO";
    public const string RecompensaVoto = "RECOMPENSA_VOTO";
    public const string SaidaGrupo = "SAIDA_GRUPO";
}
