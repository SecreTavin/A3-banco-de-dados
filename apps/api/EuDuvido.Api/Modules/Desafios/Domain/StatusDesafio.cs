namespace EuDuvido.Api.Modules.Desafios.Domain;

public static class StatusDesafio
{
    public const string Aberta = "ABERTA";
    public const string EmAndamento = "EM_ANDAMENTO";
    public const string EmVotacao = "EM_VOTACAO";
    public const string FinalizadaCumpriu = "FINALIZADA_CUMPRIU";
    public const string FinalizadaPerdeu = "FINALIZADA_PERDEU";
    public const string Cancelada = "CANCELADA";

    public static readonly string[] Terminais =
        [FinalizadaCumpriu, FinalizadaPerdeu, Cancelada];

    public static bool EhTerminal(string status) => Terminais.Contains(status);
}

public static class PapelDesafio
{
    public const string Desafiante = "DESAFIANTE";
    public const string Desafiado = "DESAFIADO";
    public const string Apostador = "APOSTADOR";
}

public static class Escolha
{
    public const string VaiCumprir = "VAI_CUMPRIR";
    public const string NaoVaiCumprir = "NAO_VAI_CUMPRIR";
}

public static class TipoRecompensa
{
    public const string Monetaria = "MONETARIA";
    public const string PrendaAcao = "PRENDA_ACAO";
    public const string ItemMaterial = "ITEM_MATERIAL";
    public const string Outro = "OUTRO";
}
