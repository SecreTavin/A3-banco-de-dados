namespace EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;

public record CriarDesafioCommand(
    int IdGrupo,
    int IdCategoria,
    string Titulo,
    string Descricao,
    int ValorCp,
    string TipoRecompensa,
    string? DescricaoRecompensa,
    DateTimeOffset DataLimite);
