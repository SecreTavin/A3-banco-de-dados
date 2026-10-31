using ErrorOr;

namespace EuDuvido.Api.Modules.Validacao.Domain;

public static class EvidenciaErrors
{
    public static Error NaoEncontrada =>
        Error.NotFound("Evidencia.NaoEncontrada", "Evidência não encontrada.");

    public static Error NaoEstaEmVotacao =>
        Error.Conflict("Evidencia.NaoEstaEmVotacao",
            "Esta evidência já foi apurada.");

    public static Error PrazoExpirado =>
        Error.Conflict("Evidencia.PrazoExpirado",
            "O prazo de votação desta evidência expirou.");

    public static Error NaoEhValidador =>
        Error.Forbidden("Evidencia.NaoEhValidador",
            "Você não faz parte do júri desta evidência.");

    public static Error JaVotou =>
        Error.Conflict("Evidencia.JaVotou", "Você já votou nesta evidência.");

    public static Error LimiteAtingido =>
        Error.Conflict("Evidencia.LimiteAtingido",
            "Este desafio já atingiu o limite de 5 evidências.");

    public static Error AnteriorEmVotacao =>
        Error.Conflict("Evidencia.AnteriorEmVotacao",
            "Há uma evidência aguardando votação neste desafio.");

    public static Error DesafioNaoAceitaEvidencia =>
        Error.Conflict("Evidencia.DesafioNaoAceitaEvidencia",
            "O desafio não está em andamento.");

    public static Error SomenteDesafiadoEnvia =>
        Error.Forbidden("Evidencia.SomenteDesafiadoEnvia",
            "Apenas o desafiado envia evidência.");
}
