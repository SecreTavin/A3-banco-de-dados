using EuDuvido.Api.Modules.Desafios.Domain;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// Maquina de estados do desafio, sem banco: o que o dominio recusa antes de
// qualquer SQL rodar.
public class DesafioTests
{
    private const int Criador = 1;

    private static Desafio NovoDesafio() => Desafio.Criar(
        idGrupo: 10, idCriador: Criador, idCategoria: 1, titulo: "Correr 5km",
        descricao: "Abaixo de 25 minutos", valorCp: 20, tipoRecompensa: TipoRecompensa.Monetaria,
        descricaoRecompensa: "R$ 50,00", dataLimite: DateTimeOffset.UtcNow.AddDays(7));

    [Fact(DisplayName = "Desafio nasce ABERTA, com a recompensa so descritiva (RN02)")]
    public void NasceAberto()
    {
        var desafio = NovoDesafio();

        desafio.Status.Should().Be(StatusDesafio.Aberta);
        desafio.DescricaoRecompensa.Should().Be("R$ 50,00");
        desafio.Participantes.Should().BeEmpty();
    }

    [Fact(DisplayName = "Com DESAFIANTE e DESAFIADO o desafio passa a EM_ANDAMENTO (RN21)")]
    public void DuelistasIniciamODesafio()
    {
        var desafio = NovoDesafio();

        desafio.Aceitar(2, PapelDesafio.Desafiante, Escolha.NaoVaiCumprir).IsError.Should().BeFalse();
        desafio.Status.Should().Be(StatusDesafio.Aberta, "falta o desafiado");

        desafio.Aceitar(3, PapelDesafio.Desafiado, Escolha.VaiCumprir).IsError.Should().BeFalse();
        desafio.Status.Should().Be(StatusDesafio.EmAndamento);
    }

    [Fact(DisplayName = "APOSTADOR nao inicia o desafio e nao tem limite de quantidade (RN09)")]
    public void ApostadoresSaoLivres()
    {
        var desafio = NovoDesafio();

        foreach (var id in new[] { 2, 3, 4 })
            desafio.Aceitar(id, PapelDesafio.Apostador, Escolha.VaiCumprir).IsError.Should().BeFalse();

        desafio.Participantes.Should().HaveCount(3);
        desafio.Status.Should().Be(StatusDesafio.Aberta);
    }

    [Theory(DisplayName = "Segundo DESAFIANTE ou DESAFIADO e recusado (RN09)")]
    [InlineData(PapelDesafio.Desafiante)]
    [InlineData(PapelDesafio.Desafiado)]
    public void PapelUnicoOcupado(string papel)
    {
        var desafio = NovoDesafio();
        desafio.Aceitar(2, papel, Escolha.VaiCumprir);

        var resultado = desafio.Aceitar(3, papel, Escolha.VaiCumprir);

        resultado.IsError.Should().BeTrue();
        resultado.FirstError.Code.Should().Be("Desafio.PapelJaOcupado");
    }

    [Fact(DisplayName = "Usuario tem um unico papel por desafio (RN09)")]
    public void UmPapelPorUsuario()
    {
        var desafio = NovoDesafio();
        desafio.Aceitar(2, PapelDesafio.Apostador, Escolha.VaiCumprir);

        var resultado = desafio.Aceitar(2, PapelDesafio.Desafiado, Escolha.VaiCumprir);

        resultado.FirstError.Code.Should().Be("Desafio.JaParticipa");
    }

    [Fact(DisplayName = "So se entra em desafio ABERTA")]
    public void SoEntraEmAberto()
    {
        var desafio = NovoDesafio();
        desafio.Aceitar(2, PapelDesafio.Desafiante, Escolha.NaoVaiCumprir);
        desafio.Aceitar(3, PapelDesafio.Desafiado, Escolha.VaiCumprir);

        var resultado = desafio.Aceitar(4, PapelDesafio.Apostador, Escolha.VaiCumprir);

        resultado.FirstError.Code.Should().Be("Desafio.NaoAceitaParticipante");
    }

    [Fact(DisplayName = "So o criador cancela, e com motivo (RN12)")]
    public void CancelamentoExigeCriadorEMotivo()
    {
        var desafio = NovoDesafio();

        desafio.Cancelar(99, "nao quero").FirstError.Code.Should().Be("Desafio.SomenteCriadorCancela");
        desafio.Cancelar(Criador, "   ").FirstError.Code.Should().Be("Desafio.MotivoObrigatorio");
        desafio.Cancelar(Criador, "Choveu no dia").IsError.Should().BeFalse();
    }

    [Fact(DisplayName = "Evidencia so entra com o desafio valendo")]
    public void EvidenciaSoComDesafioEmCurso()
    {
        var desafio = NovoDesafio();
        desafio.PodeReceberEvidencia.Should().BeFalse("ainda esta ABERTA");

        desafio.Aceitar(2, PapelDesafio.Desafiante, Escolha.NaoVaiCumprir);
        desafio.Aceitar(3, PapelDesafio.Desafiado, Escolha.VaiCumprir);
        desafio.PodeReceberEvidencia.Should().BeTrue();

        desafio.MarcarEmVotacao();
        desafio.PodeReceberEvidencia.Should().BeTrue("nova evidencia apos uma recusada");
    }

    [Theory(DisplayName = "Status terminais sao exatamente os tres finais (RN03)")]
    [InlineData(StatusDesafio.FinalizadaCumpriu, true)]
    [InlineData(StatusDesafio.FinalizadaPerdeu, true)]
    [InlineData(StatusDesafio.Cancelada, true)]
    [InlineData(StatusDesafio.Aberta, false)]
    [InlineData(StatusDesafio.EmAndamento, false)]
    [InlineData(StatusDesafio.EmVotacao, false)]
    public void Terminais(string status, bool terminal) =>
        StatusDesafio.EhTerminal(status).Should().Be(terminal);
}
