using ErrorOr;
using EuDuvido.Api.Shared.Results;

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
            "Esta aposta ja atingiu o limite de 5 evidencias.");

    public static Error AnteriorEmVotacao =>
        Error.Conflict("Evidencia.AnteriorEmVotacao",
            "Ha uma evidencia aguardando votacao nesta aposta.");

    public static Error ApostaNaoAceitaEvidencia =>
        Error.Conflict("Evidencia.ApostaNaoAceitaEvidencia",
            "A aposta nao esta em andamento.");

    public static Error SomenteDesafiadoEnvia =>
        Error.Forbidden("Evidencia.SomenteDesafiadoEnvia",
            "Apenas o desafiado envia evidencia.");

    // Prova que a IA nao reconheceu: nao vira evidencia e o desafiado pode
    // reenviar sem gastar uma das 5 tentativas (ADR 0017).
    public static Error ProvaRecusada(string parecer) =>
        Error.Custom(TipoErro.Recusado, "Evidencia.ProvaRecusada",
            $"A IA nao reconheceu a prova: {parecer}");

    // O link e do usuario, entao falhar ao baixa-lo e erro de entrada, nao de
    // infraestrutura.
    public static Error ComprovanteInacessivel(string motivo) =>
        Error.Validation("Evidencia.ComprovanteInacessivel",
            $"Nao foi possivel usar a foto do comprovante: {motivo}");
}
