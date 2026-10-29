using ErrorOr;
using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Desafios.Infrastructure;
using EuDuvido.Api.Shared.Database;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;

public class CriarDesafioHandler(EuDuvidoDbContext db, IModeradorDesafio moderador)
{
    public async Task<ErrorOr<int>> Handle(
        CriarDesafioCommand comando, int idUsuario, CancellationToken ct)
    {
        var ehMembro = await db.Membros.AnyAsync(
            m => m.IdGrupo == comando.IdGrupo && m.IdUsuario == idUsuario, ct);
        if (!ehMembro)
            return DesafioErrors.NaoMembroDoGrupo;

        if (!await db.Categorias.AnyAsync(c => c.IdCategoria == comando.IdCategoria, ct))
            return DesafioErrors.CategoriaInexistente;

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
            // Proposta reprovada nao vira desafio, mas a avaliacao fica para auditoria.
            db.Moderacoes.Add(moderacao);
            await db.SaveChangesAsync(ct);
            return DesafioErrors.DesafioRecusado(moderacao.Motivo!);
        }

        var desafio = Desafio.Criar(
            comando.IdGrupo, idUsuario, comando.IdCategoria, titulo, descricao,
            comando.ValorCp, comando.TipoRecompensa,
            string.IsNullOrWhiteSpace(comando.DescricaoRecompensa)
                ? null : comando.DescricaoRecompensa.Trim(),
            comando.DataLimite);

        // Desafio e avaliacao aprovada commitam juntas: nao existe desafio sem
        // moderacao registrada (chk_moderacao_desafio exige a aprovacao).
        var estrategia = db.Database.CreateExecutionStrategy();
        await estrategia.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            db.Desafios.Add(desafio);
            await db.SaveChangesAsync(ct);

            moderacao.VincularDesafio(desafio.IdDesafio);
            db.Moderacoes.Add(moderacao);
            await db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);
        });

        return desafio.IdDesafio;
    }
}
