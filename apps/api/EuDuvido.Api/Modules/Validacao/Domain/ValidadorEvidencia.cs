namespace EuDuvido.Api.Modules.Validacao.Domain;

// Snapshot de quem podia votar quando a evidencia entrou em votacao.
// Congelar impede que alguem entrando no grupo mude o quorum retroativamente
// e faca o resultado do desafio mudar sozinho (ADR 0008).
public class ValidadorEvidencia
{
    public int IdEvidencia { get; private set; }
    public int IdUsuario { get; private set; }

    private ValidadorEvidencia() { }

    internal static ValidadorEvidencia De(int idUsuario) => new() { IdUsuario = idUsuario };
}
