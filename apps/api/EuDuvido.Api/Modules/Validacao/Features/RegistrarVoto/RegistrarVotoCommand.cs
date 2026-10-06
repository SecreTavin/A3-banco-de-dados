namespace EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;

public record RegistrarVotoCommand(int IdEvidencia, string Voto, string? Justificativa);

public record VotoRegistradoResponse(
    int IdEvidencia,
    string StatusEvidencia,
    int TotalVotos,
    int VotosFavoraveis,
    int VotosContra,
    int Quorum,
    int VotosFaltantes,
    string? StatusDesafio);
