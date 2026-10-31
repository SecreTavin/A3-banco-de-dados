using EuDuvido.Api.Modules.Desafios.Domain;
using FluentValidation;

namespace EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;

// Entrada invalida para antes do handler - e antes de gastar uma chamada a IA.
public class CriarDesafioValidator : AbstractValidator<CriarDesafioCommand>
{
    public CriarDesafioValidator()
    {
        RuleFor(x => x.IdGrupo).GreaterThan(0);
        RuleFor(x => x.IdCategoria).GreaterThan(0);
        RuleFor(x => x.Titulo).NotEmpty().WithMessage("Título é obrigatório.")
            .MaximumLength(120);
        RuleFor(x => x.Descricao).NotEmpty().WithMessage("Descrição é obrigatória.")
            .MaximumLength(2000);
        RuleFor(x => x.ValorCp).GreaterThan(0)
            .WithMessage("O desafio precisa custar ao menos 1 CP.");
        RuleFor(x => x.TipoRecompensa).Must(t => TipoRecompensa.Todos.Contains(t))
            .WithMessage("Tipo de recompensa inválido.");
        RuleFor(x => x.DescricaoRecompensa).MaximumLength(255);
        RuleFor(x => x.DataLimite).GreaterThan(_ => DateTimeOffset.UtcNow)
            .WithMessage("O prazo precisa estar no futuro.");
    }
}
