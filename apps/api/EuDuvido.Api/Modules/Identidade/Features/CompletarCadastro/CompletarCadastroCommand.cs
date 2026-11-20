using FluentValidation;

namespace EuDuvido.Api.Modules.Identidade.Features.CompletarCadastro;

// Nome, e-mail e foto vem do token de cadastro (o Google), nunca do corpo.
public record CompletarCadastroCommand(string TokenCadastro, string Apelido, DateOnly DataNascimento);

public class CompletarCadastroValidator : AbstractValidator<CompletarCadastroCommand>
{
    public CompletarCadastroValidator()
    {
        RuleFor(x => x.TokenCadastro).NotEmpty();
        RuleFor(x => x.Apelido).NotEmpty().WithMessage("Informe o apelido.")
            .MaximumLength(50).WithMessage("O apelido tem até 50 caracteres.");
        RuleFor(x => x.DataNascimento).GreaterThanOrEqualTo(new DateOnly(1900, 1, 1))
            .WithMessage("Informe a data de nascimento.");
    }
}
