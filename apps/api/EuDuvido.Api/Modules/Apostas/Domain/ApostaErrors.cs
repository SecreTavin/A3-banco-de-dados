using ErrorOr;
using EuDuvido.Api.Shared.Results;

namespace EuDuvido.Api.Modules.Apostas.Domain;

public static class ApostaErrors
{
    public static Error NaoEncontrada =>
        Error.NotFound("Aposta.NaoEncontrada", "Aposta nao encontrada.");

    public static Error JaEncerrada =>
        Error.Conflict("Aposta.JaEncerrada", "Esta aposta ja foi encerrada.");

    public static Error NaoAceitaParticipante =>
        Error.Conflict("Aposta.NaoAceitaParticipante",
            "So e possivel entrar em aposta ABERTA.");

    public static Error PapelJaOcupado(string papel) =>
        Error.Conflict("Aposta.PapelJaOcupado",
            $"Ja existe um {papel} nesta aposta.");

    public static Error JaParticipa =>
        Error.Conflict("Aposta.JaParticipa", "Voce ja participa desta aposta.");

    public static Error SaldoInsuficiente(int saldo, int necessario) =>
        Error.Conflict("Aposta.SaldoInsuficiente",
            $"Saldo de {saldo} CP e insuficiente: a aposta custa {necessario} CP.");

    public static Error MotivoObrigatorio =>
        Error.Validation("Aposta.MotivoObrigatorio",
            "Cancelamento exige motivo.");

    public static Error SomenteCriadorCancela =>
        Error.Forbidden("Aposta.SomenteCriadorCancela",
            "Apenas quem criou a aposta pode cancela-la.");

    public static Error NaoMembroDoGrupo =>
        Error.Forbidden("Aposta.NaoMembroDoGrupo",
            "So membros do grupo podem criar apostas nele.");

    public static Error CategoriaInexistente =>
        Error.Validation("Aposta.CategoriaInexistente", "Categoria de desafio inexistente.");

    // RN28: a IA de moderacao barrou o desafio no nivel de filtro do grupo.
    public static Error DesafioRecusado(string motivo) =>
        Error.Custom(TipoErro.Recusado, "Aposta.DesafioRecusado",
            $"A IA de moderacao recusou o desafio: {motivo}");
}
