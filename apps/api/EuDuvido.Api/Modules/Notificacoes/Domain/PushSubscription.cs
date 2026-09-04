namespace EuDuvido.Api.Modules.Notificacoes.Domain;

// Modelada, nao implementada: Web Push esta fora do escopo do MVP (doc 19).
// A tabela existe porque faz parte do modelo entregavel (doc 11).
public class PushSubscription
{
    public int IdSubscription { get; private set; }
    public int IdUsuario { get; private set; }
    public string Endpoint { get; private set; } = null!;
    public string ChaveP256dh { get; private set; } = null!;
    public string ChaveAuth { get; private set; } = null!;
    public DateTimeOffset DataCriacao { get; private set; }
    public DateTimeOffset? DataUltimoUso { get; private set; }

    private PushSubscription() { }
}
