using EuDuvido.Api.Modules.Validacao.Domain;
using FluentValidation;

namespace EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;

public class EnviarEvidenciaValidator : AbstractValidator<EnviarEvidenciaCommand>
{
    public EnviarEvidenciaValidator()
    {
        RuleFor(x => x.IdDesafio).GreaterThan(0);
        RuleFor(x => x.TipoMidia).Must(t => TipoMidia.Todos.Contains(t))
            .WithMessage("Tipo de mídia deve ser FOTO, VIDEO, LINK ou TEXTO.");
        RuleFor(x => x.UrlComprovante).NotEmpty()
            .WithMessage("Informe o link do comprovante ou o relato.")
            .MaximumLength(500);
        // Texto tem o relato no proprio campo; os demais precisam ser um link.
        RuleFor(x => x.UrlComprovante)
            .Must(url => Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) &&
                         uri.Scheme is "http" or "https")
            .When(x => x.TipoMidia != TipoMidia.Texto)
            .WithMessage("O comprovante precisa ser um link http:// ou https://.");
        RuleFor(x => x.Comentario).MaximumLength(1000);
    }
}
