namespace EuDuvido.Api.Modules.Validacao.Domain;

// Juri congelado E voto, na mesma linha (ADR 0016). A linha nasce no envio da
// evidencia com voto nulo; votar e preencher a linha. A PK (id_evidencia,
// id_usuario) garante voto unico (RN04) e voto so de quem esta no juri (RN14).
// Congelar impede que alguem entrando no grupo mude o quorum retroativamente
// e faca o resultado da aposta mudar sozinho (ADR 0008).
public class JuradoEvidencia
{
    public int IdEvidencia { get; private set; }
    public int IdUsuario { get; private set; }
    public string? Voto { get; private set; }
    public string? Justificativa { get; private set; }
    public DateTimeOffset? DataVoto { get; private set; }

    private JuradoEvidencia() { }

    internal static JuradoEvidencia Congelar(int idUsuario) => new() { IdUsuario = idUsuario };

    public bool JaVotou => Voto is not null;

    // chk_jurado_voto_data: voto e data_voto andam juntos.
    internal void Votar(string voto, string? justificativa)
    {
        Voto = voto;
        Justificativa = string.IsNullOrWhiteSpace(justificativa) ? null : justificativa.Trim();
        DataVoto = DateTimeOffset.UtcNow;
    }
}
