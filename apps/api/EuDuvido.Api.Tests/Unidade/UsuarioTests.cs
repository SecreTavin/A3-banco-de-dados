using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Shared.Results;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// RN26 do lado da aplicacao. O trigger trg_usuario_idade_minima repete a regra
// no banco (ConstraintTests T14); aqui ela vira erro legivel.
public class UsuarioTests
{
    private static DateOnly Hoje => DateOnly.FromDateTime(DateTime.UtcNow);

    [Fact(DisplayName = "Quem faz 16 anos hoje pode se cadastrar (RN26)")]
    public void DezesseisAnosExatos()
    {
        var usuario = Usuario.Criar("Ana", "ana@email.com", "Ana", null, Hoje.AddYears(-16));

        usuario.IsError.Should().BeFalse();
        usuario.Value.DataNascimento.Should().Be(Hoje.AddYears(-16));
    }

    [Fact(DisplayName = "Um dia antes dos 16 anos o cadastro e recusado com HTTP 422 (RN26)")]
    public void UmDiaAntes()
    {
        var usuario = Usuario.Criar("Ana", "ana@email.com", "Ana", null, Hoje.AddYears(-16).AddDays(1));

        usuario.IsError.Should().BeTrue();
        usuario.FirstError.Code.Should().Be("Usuario.IdadeMinima");
        usuario.FirstError.NumericType.Should().Be(TipoErro.Recusado);
    }
}
