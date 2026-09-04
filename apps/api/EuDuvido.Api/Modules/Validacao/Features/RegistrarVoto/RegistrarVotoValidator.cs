using EuDuvido.Api.Modules.Validacao.Domain;
using FluentValidation;

namespace EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;

public class RegistrarVotoValidator : AbstractValidator<RegistrarVotoCommand>
{
    public RegistrarVotoValidator()
    {
        RuleFor(x => x.IdEvidencia).GreaterThan(0);
        RuleFor(x => x.Voto).Must(v => v is TipoVoto.Valido or TipoVoto.Invalido)
            .WithMessage("Voto deve ser VALIDO ou INVALIDO.");
        RuleFor(x => x.Justificativa).MaximumLength(255);
    }
}
