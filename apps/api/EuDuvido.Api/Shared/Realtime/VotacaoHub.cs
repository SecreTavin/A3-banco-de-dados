using System.Security.Claims;
using Dapper;
using EuDuvido.Api.Shared.Database;
using Microsoft.AspNetCore.SignalR;

namespace EuDuvido.Api.Shared.Realtime;

// O hub NOTIFICA que a transacao commitou; nunca decide resultado.
// Quem decide e a procedure apurar_votacao (ADR 0011).
//
// So quem esta logado conecta (RequireAuthorization no Program.cs), e so entra no
// canal de um grupo quem e membro dele: o placar e da conta do grupo, como o
// detalhe do desafio (roteiro completo, cenarios H01 e H02).
public class VotacaoHub(IConexaoLeitura leitura) : Hub
{
    public async Task EntrarNoGrupo(int idGrupo)
    {
        var id = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id is null || !int.TryParse(id, out var idUsuario) || !await EhMembro(idGrupo, idUsuario))
            throw new HubException("Você não participa deste grupo.");

        await Groups.AddToGroupAsync(Context.ConnectionId, Canal(idGrupo));
    }

    private async Task<bool> EhMembro(int idGrupo, int idUsuario)
    {
        using var conexao = await leitura.AbrirAsync(Context.ConnectionAborted);
        return await conexao.ExecuteScalarAsync<bool>(
            "SELECT EXISTS (SELECT 1 FROM membro_grupo WHERE id_grupo = @idGrupo AND id_usuario = @idUsuario)",
            new { idGrupo, idUsuario });
    }

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
