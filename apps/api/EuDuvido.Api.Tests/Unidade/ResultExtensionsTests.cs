using ErrorOr;
using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Grupos.Domain;
using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Shared.Results;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace EuDuvido.Api.Tests.Unidade;

// Mapeamento unico de erro de dominio para HTTP: a regra de negocio violada
// chega ao cliente com o status certo e com o codigo do erro no titulo.
public class ResultExtensionsTests
{
    private static ProblemHttpResult Problema(Error erro) =>
        ((ErrorOr<Success>)erro).ToHttp().Should().BeOfType<ProblemHttpResult>().Subject;

    public static TheoryData<Error, int> Erros() => new()
    {
        { DesafioErrors.NaoEncontrado, 404 },
        { DesafioErrors.MotivoObrigatorio, 400 },
        { DesafioErrors.JaEncerrado, 409 },
        { GrupoErrors.MembroComPendencias, 409 },
        { GrupoErrors.SomenteAdmin, 403 },
        { DesafioErrors.DesafioRecusado("arriscado"), 422 },
        { UsuarioErrors.IdadeMinima, 422 },
    };

    [Theory(DisplayName = "Cada tipo de erro vira o status HTTP certo")]
    [MemberData(nameof(Erros))]
    public void StatusPorTipo(Error erro, int status)
    {
        var problema = Problema(erro);

        problema.StatusCode.Should().Be(status);
        problema.ProblemDetails.Title.Should().Be(erro.Code);
    }

    [Fact(DisplayName = "Recusa da moderacao devolve o motivo da IA (RN28)")]
    public void MotivoDaModeracao() =>
        Problema(DesafioErrors.DesafioRecusado("Risco de queda."))
            .ProblemDetails.Detail.Should().Contain("Risco de queda.");

    [Fact(DisplayName = "Sucesso usa o resultado informado")]
    public void Sucesso() =>
        ((ErrorOr<int>)7).ToHttp(id => TypedResults.Created($"/api/desafios/{id}", id))
            .Should().BeOfType<Created<int>>();
}
