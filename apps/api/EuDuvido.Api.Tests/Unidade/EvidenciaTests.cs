using EuDuvido.Api.Modules.Validacao.Domain;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// Juri congelado e voto na mesma linha (jurado_evidencia): o dominio espelha o
// que a PK e o trigger garantem no banco.
public class EvidenciaTests
{
    private static Evidencia Enviar(int ordem = 1, params int[] juri) =>
        Evidencia.Enviar(idDesafio: 7, idAutor: 1, ordem, TipoMidia.Foto,
            "https://exemplo/prova.png", null, juri.Length > 0 ? juri : [3, 4, 5]).Value;

    [Fact(DisplayName = "Envio congela o juri sem voto e abre 7 dias de votacao (RN11, RN14)")]
    public void EnvioCongelaJuri()
    {
        var evidencia = Enviar();

        evidencia.Status.Should().Be(StatusEvidencia.EmVotacao);
        evidencia.Jurados.Select(j => j.IdUsuario).Should().BeEquivalentTo([3, 4, 5]);
        evidencia.Jurados.Should().OnlyContain(j => !j.JaVotou);
        (evidencia.DataLimiteVotacao - evidencia.DataEnvio).Should().Be(Evidencia.PrazoVotacao);
    }

    [Fact(DisplayName = "Jurado repetido na lista entra uma vez so (RN04)")]
    public void JuriSemRepeticao() =>
        Enviar(1, 3, 3, 4).Jurados.Should().HaveCount(2);

    [Fact(DisplayName = "Sexta evidencia e recusada (RN10)")]
    public void LimiteDeCinco()
    {
        var resultado = Evidencia.Enviar(7, 1, Evidencia.MaximoPorDesafio + 1, TipoMidia.Foto,
            "https://exemplo/prova.png", null, [3]);

        resultado.FirstError.Code.Should().Be("Evidencia.LimiteAtingido");
    }

    [Theory(DisplayName = "Quorum e floor(n/2)+1 sobre o juri congelado (RN15)")]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    [InlineData(3, 2)]
    [InlineData(4, 3)]
    [InlineData(5, 3)]
    public void Quorum(int jurados, int quorum) =>
        Enviar(1, [.. Enumerable.Range(100, jurados)]).Quorum.Should().Be(quorum);

    [Fact(DisplayName = "Votar preenche a linha do jurado com data (chk_jurado_voto_data)")]
    public void VotoPreencheLinha()
    {
        var evidencia = Enviar();

        var jurado = evidencia.Votar(4, TipoVoto.Valido, "  bateu com o GPS  ");

        jurado.IsError.Should().BeFalse();
        jurado.Value.Voto.Should().Be(TipoVoto.Valido);
        jurado.Value.Justificativa.Should().Be("bateu com o GPS");
        jurado.Value.DataVoto.Should().NotBeNull();
    }

    [Fact(DisplayName = "Quem nao esta no juri nao vota (RN14)")]
    public void ForaDoJuri() =>
        Enviar().Votar(1, TipoVoto.Valido, null).FirstError.Code.Should().Be("Evidencia.NaoEhValidador");

    [Fact(DisplayName = "Voto e unico e definitivo (RN04)")]
    public void VotoUnico()
    {
        var evidencia = Enviar();
        evidencia.Votar(4, TipoVoto.Valido, null);

        evidencia.Votar(4, TipoVoto.Invalido, null).FirstError.Code.Should().Be("Evidencia.JaVotou");
    }

    [Fact(DisplayName = "Justificativa em branco vira nula")]
    public void JustificativaEmBranco() =>
        Enviar().Votar(3, TipoVoto.Invalido, "   ").Value.Justificativa.Should().BeNull();
}
