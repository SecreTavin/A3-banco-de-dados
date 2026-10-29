using EuDuvido.Api.Modules.Grupos.Domain;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// RN25 e RN27 sao garantidas pela aplicacao: o banco nao sabe quem executa o
// comando. Estes testes sao a garantia delas.
public class GrupoAmigosTests
{
    private const int Admin = 1;

    private static GrupoAmigos GrupoCom(params int[] membros)
    {
        var grupo = GrupoAmigos.Criar("Os Inimigos do Fim", null, Admin);
        foreach (var id in membros)
            grupo.Admitir(Admin, id);
        return grupo;
    }

    [Fact(DisplayName = "Quem cria o grupo e ADMIN e o filtro padrao e MODERADO (RN25, RN27)")]
    public void CriadorEAdmin()
    {
        var grupo = GrupoAmigos.Criar("Grupo", "desc", Admin);

        grupo.EhAdmin(Admin).Should().BeTrue();
        grupo.NivelFiltro.Should().Be(NiveisFiltro.Moderado);
        grupo.Membros.Single().SaldoCp.Should().Be(MembroGrupo.SaldoInicial);
    }

    [Fact(DisplayName = "So ADMIN adiciona membro (RN25)")]
    public void SoAdminAdiciona()
    {
        var grupo = GrupoCom(2);

        grupo.Admitir(2, 3).FirstError.Code.Should().Be("Grupo.SomenteAdmin");
        grupo.Admitir(Admin, 3).IsError.Should().BeFalse();
        grupo.Membros.Should().Contain(m => m.IdUsuario == 3 && !m.EhAdmin);
    }

    [Fact(DisplayName = "Membro nao entra duas vezes")]
    public void SemEntradaDuplicada() =>
        GrupoCom(2).Admitir(Admin, 2).FirstError.Code.Should().Be("Grupo.JaMembro");

    [Fact(DisplayName = "So ADMIN altera o nivel de filtro (RN27)")]
    public void SoAdminAlteraNivel()
    {
        var grupo = GrupoCom(2);

        grupo.AlterarNivelFiltro(2, NiveisFiltro.Leve).FirstError.Code.Should().Be("Grupo.SomenteAdmin");
        grupo.NivelFiltro.Should().Be(NiveisFiltro.Moderado);

        grupo.AlterarNivelFiltro(Admin, NiveisFiltro.Pesado).IsError.Should().BeFalse();
        grupo.NivelFiltro.Should().Be(NiveisFiltro.Pesado);
    }

    [Fact(DisplayName = "ADMIN remove qualquer membro; membro comum so sai por conta propria (RN25)")]
    public void QuemPodeRemover()
    {
        var grupo = GrupoCom(2, 3);

        grupo.PodeRemover(Admin, 2).IsError.Should().BeFalse();
        grupo.PodeRemover(3, 3).IsError.Should().BeFalse("qualquer um pode sair");
        grupo.PodeRemover(3, 2).FirstError.Code.Should().Be("Grupo.SomenteAdmin");
    }

    [Fact(DisplayName = "Remover quem nao e do grupo e erro")]
    public void RemoverNaoMembro() =>
        GrupoCom(2).PodeRemover(Admin, 42).FirstError.Code.Should().Be("Grupo.NaoMembro");

    [Fact(DisplayName = "Unico ADMIN nao sai enquanto houver outros membros")]
    public void UltimoAdmin()
    {
        GrupoCom(2).PodeRemover(Admin, Admin).FirstError.Code.Should().Be("Grupo.UltimoAdmin");
        GrupoCom().PodeRemover(Admin, Admin).IsError.Should().BeFalse("sozinho no grupo, pode sair");
    }

    [Theory(DisplayName = "Niveis de filtro sao exatamente LEVE, MODERADO e PESADO (RN27)")]
    [InlineData("LEVE", true)]
    [InlineData("MODERADO", true)]
    [InlineData("PESADO", true)]
    [InlineData("leve", false)]
    [InlineData("NENHUM", false)]
    public void NiveisValidos(string nivel, bool valido) =>
        NiveisFiltro.Todos.Contains(nivel).Should().Be(valido);
}
