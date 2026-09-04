namespace EuDuvido.Api.Modules.Validacao.Domain;

public static class StatusEvidencia
{
    public const string EmVotacao = "EM_VOTACAO";
    public const string Aceita = "ACEITA";
    public const string Recusada = "RECUSADA";
    public const string Expirada = "EXPIRADA";
}

public static class TipoMidia
{
    public const string Foto = "FOTO";
    public const string Video = "VIDEO";
    public const string Link = "LINK";
    public const string Texto = "TEXTO";

    public static readonly string[] Todos = [Foto, Video, Link, Texto];
}

public static class TipoVoto
{
    public const string Valido = "VALIDO";
    public const string Invalido = "INVALIDO";
}
