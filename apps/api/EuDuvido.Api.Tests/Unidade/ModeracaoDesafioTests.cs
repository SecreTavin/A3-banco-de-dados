using EuDuvido.Api.Modules.Desafios.Domain;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// Auditoria da moderacao (RN28): o registro sempre satisfaz chk_moderacao_motivo
// e chk_moderacao_desafio antes de chegar ao banco.
public class ModeracaoDesafioTests
{
    private static ModeracaoDesafio Registrar(bool aprovado, string? motivo) =>
        ModeracaoDesafio.Registrar(1, 2, "PESADO", "Titulo", "Descricao", aprovado, motivo);

    [Fact(DisplayName = "Copia o nivel do grupo no momento da avaliacao (RN27)")]
    public void CopiaNivel() =>
        Registrar(true, null).NivelFiltro.Should().Be("PESADO");

    [Fact(DisplayName = "Reprovacao sem motivo da IA ganha um motivo padrao (chk_moderacao_motivo)")]
    public void ReprovacaoSempreTemMotivo()
    {
        Registrar(false, null).Motivo.Should().NotBeNullOrWhiteSpace();
        Registrar(false, "   ").Motivo.Should().NotBeNullOrWhiteSpace();
    }

    [Fact(DisplayName = "Aprovacao sem motivo fica sem motivo")]
    public void AprovacaoSemMotivo() =>
        Registrar(true, " ").Motivo.Should().BeNull();

    [Fact(DisplayName = "Motivo longo e cortado no tamanho da coluna (VARCHAR 500)")]
    public void MotivoTruncado() =>
        Registrar(false, new string('x', 800)).Motivo.Should().HaveLength(ModeracaoDesafio.TamanhoMaximoMotivo);

    [Fact(DisplayName = "So avaliacao aprovada se liga a um desafio (chk_moderacao_desafio)")]
    public void SoAprovadaVinculaDesafio()
    {
        var aprovada = Registrar(true, null);
        aprovada.VincularDesafio(10);
        aprovada.IdDesafio.Should().Be(10);

        var reprovada = Registrar(false, "arriscado");
        var vincular = () => reprovada.VincularDesafio(10);
        vincular.Should().Throw<InvalidOperationException>();
        reprovada.IdDesafio.Should().BeNull();
    }
}
