using ErrorOr;
using EuDuvido.Api.Modules.Apostas.Domain;
using EuDuvido.Api.Modules.Apostas.Infrastructure;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Apostas.Features.CriarAposta;

public class CriarApostaHandler(EuDuvidoDbContext db, IModeradorDesafio moderador)
{
    public async Task<ErrorOr<int>> Handle(
        CriarApostaCommand comando, int idUsuario, CancellationToken ct)
    {
        var ehMembro = await db.Membros.AnyAsync(
            m => m.IdGrupo == comando.IdGrupo && m.IdUsuario == idUsuario, ct);
        if (!ehMembro)
            return ApostaErrors.NaoMembroDoGrupo;

        if (!await db.Categorias.AnyAsync(c => c.IdCategoria == comando.IdCategoria, ct))
            return ApostaErrors.CategoriaInexistente;

        // RN27: a regua e a do grupo no momento da criacao.
        var nivelFiltro = await db.Grupos
            .Where(g => g.IdGrupo == comando.IdGrupo)
            .Select(g => g.NivelFiltro)
            .SingleAsync(ct);

        var titulo = comando.Titulo.Trim();
        var descricao = comando.Descricao.Trim();

        // RN28: a IA avalia antes de qualquer gravacao, e fora de transacao -
        // a chamada pode levar segundos e nao deve segurar conexao do pool.
        // Provedor fora do ar sobe como excecao: nada e criado sem avaliacao.
        var avaliacao = await moderador.AvaliarAsync(titulo, descricao, nivelFiltro, ct);

        var moderacao = ModeracaoDesafio.Registrar(
            comando.IdGrupo, idUsuario, nivelFiltro, titulo, descricao,
            avaliacao.Aprovado, avaliacao.Motivo);

        if (!moderacao.Aprovado)
        {
            // Reprovado nao vira aposta, mas a avaliacao fica para auditoria.
            db.Moderacoes.Add(moderacao);
            await db.SaveChangesAsync(ct);
            return ApostaErrors.DesafioRecusado(moderacao.Motivo!);
        }

        var aposta = Aposta.Criar(
            comando.IdGrupo, idUsuario, comando.IdCategoria, titulo, descricao,
            comando.ValorCp, comando.TipoRecompensa,
            string.IsNullOrWhiteSpace(comando.DescricaoRecompensa)
                ? null : comando.DescricaoRecompensa.Trim(),
            comando.DataLimite);

        // Aposta e avaliacao aprovada commitam juntas: nao existe aposta sem
        // moderacao registrada (chk_moderacao_aposta exige a aprovacao).
        var estrategia = db.Database.CreateExecutionStrategy();
        await estrategia.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            db.Apostas.Add(aposta);
            await db.SaveChangesAsync(ct);

            moderacao.VincularAposta(aposta.IdAposta);
            db.Moderacoes.Add(moderacao);
            await db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);
        });

        return aposta.IdAposta;
    }
}
