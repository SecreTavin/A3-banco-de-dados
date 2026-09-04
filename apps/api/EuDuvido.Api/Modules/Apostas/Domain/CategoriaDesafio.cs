namespace EuDuvido.Api.Modules.Apostas.Domain;

public class CategoriaDesafio
{
    public int IdCategoria { get; private set; }
    public string Nome { get; private set; } = null!;
    public string? Descricao { get; private set; }

    private CategoriaDesafio() { }
}
