namespace EuDuvido.Api.Modules.Apostas.Features.CriarAposta;

public record CriarApostaCommand(
    int IdGrupo,
    int IdCategoria,
    string Titulo,
    string Descricao,
    int ValorCp,
    string TipoRecompensa,
    string? DescricaoRecompensa,
    DateTimeOffset DataLimite);
