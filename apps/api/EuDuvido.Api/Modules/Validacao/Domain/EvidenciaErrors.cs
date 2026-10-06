using ErrorOr;

namespace EuDuvido.Api.Modules.Validacao.Domain;

public static class EvidenciaErrors
{
    public static Error NaoEncontrada =>
        Error.NotFound("Evidencia.NaoEncontrada", "Evidencia nao encontrada.");

    public static Error NaoEstaEmVotacao =>
        Error.Conflict("Evidencia.NaoEstaEmVotacao",
            "Esta evidencia ja foi apurada.");

    public static Error PrazoExpirado =>
        Error.Conflict("Evidencia.PrazoExpirado",
            "O prazo de votacao desta evidencia expirou.");

    public static Error NaoEhValidador =>
        Error.Forbidden("Evidencia.NaoEhValidador",
            "Voce nao faz parte do juri desta evidencia.");

    public static Error JaVotou =>
        Error.Conflict("Evidencia.JaVotou", "Voce ja votou nesta evidencia.");

    public static Error LimiteAtingido =>
        Error.Conflict("Evidencia.LimiteAtingido",
            "Este desafio ja atingiu o limite de 5 evidencias.");

    public static Error AnteriorEmVotacao =>
        Error.Conflict("Evidencia.AnteriorEmVotacao",
            "Ha uma evidencia aguardando votacao neste desafio.");

    public static Error DesafioNaoAceitaEvidencia =>
        Error.Conflict("Evidencia.DesafioNaoAceitaEvidencia",
            "O desafio nao esta em andamento.");

    public static Error SomenteDesafiadoEnvia =>
        Error.Forbidden("Evidencia.SomenteDesafiadoEnvia",
            "Apenas o desafiado envia evidencia.");
}
