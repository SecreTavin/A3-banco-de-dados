using Microsoft.AspNetCore.SignalR;

namespace EuDuvido.Api.Shared.Realtime;

// O hub NOTIFICA que a transacao commitou; nunca decide resultado.
// Quem decide e validacao.apurar_votacao (ADR 0011).
public class VotacaoHub : Hub
{
    public Task EntrarNoGrupo(int idGrupo) =>
        Groups.AddToGroupAsync(Context.ConnectionId, Canal(idGrupo));

    public Task SairDoGrupo(int idGrupo) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, Canal(idGrupo));

    public static string Canal(int idGrupo) => $"grupo-{idGrupo}";
}

public interface INotificadorVotacao
{
    Task VotacaoAtualizada(int idGrupo, int idEvidencia, object estado);
    Task DesafioEncerrado(int idGrupo, int idDesafio, string status);
}

public class NotificadorVotacao(IHubContext<VotacaoHub> hub) : INotificadorVotacao
{
    public Task VotacaoAtualizada(int idGrupo, int idEvidencia, object estado) =>
        hub.Clients.Group(VotacaoHub.Canal(idGrupo))
            .SendAsync("votacaoAtualizada", new { idEvidencia, estado });

    public Task DesafioEncerrado(int idGrupo, int idDesafio, string status) =>
        hub.Clients.Group(VotacaoHub.Canal(idGrupo))
            .SendAsync("desafioEncerrado", new { idDesafio, status });
}
