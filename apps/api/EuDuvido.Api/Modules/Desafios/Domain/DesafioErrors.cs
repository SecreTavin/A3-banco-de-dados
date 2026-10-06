using ErrorOr;

namespace EuDuvido.Api.Modules.Desafios.Domain;

public static class DesafioErrors
{
    public static Error NaoEncontrado =>
        Error.NotFound("Desafio.NaoEncontrado", "Desafio nao encontrado.");

    public static Error JaEncerrado =>
        Error.Conflict("Desafio.JaEncerrado", "Este desafio ja foi encerrado.");

    public static Error NaoAceitaParticipante =>
        Error.Conflict("Desafio.NaoAceitaParticipante",
            "So e possivel entrar em desafio ABERTO.");

    public static Error PapelJaOcupado(string papel) =>
        Error.Conflict("Desafio.PapelJaOcupado",
            $"Ja existe um {papel} neste desafio.");

    public static Error JaParticipa =>
        Error.Conflict("Desafio.JaParticipa", "Voce ja participa deste desafio.");

    public static Error SaldoInsuficiente(int saldo, int necessario) =>
        Error.Conflict("Desafio.SaldoInsuficiente",
            $"Saldo de {saldo} CP e insuficiente: o desafio custa {necessario} CP.");

    public static Error MotivoObrigatorio =>
        Error.Validation("Desafio.MotivoObrigatorio",
            "Cancelamento exige motivo.");

    public static Error SomenteCriadorCancela =>
        Error.Forbidden("Desafio.SomenteCriadorCancela",
            "Apenas quem criou o desafio pode cancela-lo.");
}
