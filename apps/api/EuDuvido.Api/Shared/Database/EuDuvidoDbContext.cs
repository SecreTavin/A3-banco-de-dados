using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Economia.Domain;
using EuDuvido.Api.Modules.Grupos.Domain;
using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Shared.Database;

// Toda configuracao usa nomes de constraint explicitos e iguais aos do modelo
// logico (doc 11). Os documentos 11, 12 e 17 citam esses nomes; deixar o EF
// gerar CK_desafio_xxx faria tres entregaveis mentirem.
//
// Schema unico (public) desde o ADR 0016: os modulos continuam separados no
// codigo, mas no banco a separacao so obrigava a qualificar cada nome.
public class EuDuvidoDbContext(DbContextOptions<EuDuvidoDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<GrupoAmigos> Grupos => Set<GrupoAmigos>();
    public DbSet<MembroGrupo> Membros => Set<MembroGrupo>();
    public DbSet<CategoriaDesafio> Categorias => Set<CategoriaDesafio>();
    public DbSet<Desafio> Desafios => Set<Desafio>();
    public DbSet<ModeracaoDesafio> Moderacoes => Set<ModeracaoDesafio>();
    public DbSet<ParticipanteDesafio> Participantes => Set<ParticipanteDesafio>();
    public DbSet<Evidencia> Evidencias => Set<Evidencia>();
    public DbSet<JuradoEvidencia> Jurados => Set<JuradoEvidencia>();
    public DbSet<TransacaoCp> Transacoes => Set<TransacaoCp>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        ConfigurarIdentidade(b);
        ConfigurarGrupos(b);
        ConfigurarDesafios(b);
        ConfigurarValidacao(b);
        ConfigurarEconomia(b);
    }

    private static void ConfigurarIdentidade(ModelBuilder b)
    {
        b.Entity<Usuario>(e =>
        {
            e.ToTable("usuario");
            e.HasKey(x => x.IdUsuario).HasName("pk_usuario");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(120).IsRequired();
            e.Property(x => x.Apelido).HasColumnName("apelido").HasMaxLength(50).IsRequired();
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            // RN26: idade minima garantida pelo trigger trg_usuario_idade_minima.
            e.Property(x => x.DataNascimento).HasColumnName("data_nascimento");
            e.Property(x => x.DataCadastro).HasColumnName("data_cadastro")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasIndex(x => x.Email).IsUnique().HasDatabaseName("unq_usuario_email");
        });
    }

    private static void ConfigurarGrupos(ModelBuilder b)
    {
        b.Entity<GrupoAmigos>(e =>
        {
            e.ToTable("grupo_amigos", t =>
            {
                t.HasCheckConstraint("chk_grupo_nivel_filtro",
                     "nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO')");
            });
            e.HasKey(x => x.IdGrupo).HasName("pk_grupo_amigos");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(80).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(255);
            e.Property(x => x.IdCriador).HasColumnName("id_criador");
            e.Property(x => x.NivelFiltro).HasColumnName("nivel_filtro").HasMaxLength(10)
                .HasDefaultValue(NiveisFiltro.Padrao).IsRequired();
            e.Property(x => x.DataCriacao).HasColumnName("data_criacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdCriador)
                .HasConstraintName("fk_grupo_criador").OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Membros).WithOne()
                .HasForeignKey(m => m.IdGrupo)
                .HasConstraintName("fk_membro_grupo")
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MembroGrupo>(e =>
        {
            e.ToTable("membro_grupo", t =>
            {
                t.HasCheckConstraint("chk_membro_papel", "papel IN ('ADMIN', 'MEMBRO')");
                t.HasCheckConstraint("chk_membro_saldo", "saldo_cp >= 0");
            });
            e.HasKey(x => x.IdMembro).HasName("pk_membro_grupo");
            e.Property(x => x.IdMembro).HasColumnName("id_membro");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Papel).HasColumnName("papel").HasMaxLength(20)
                .HasDefaultValue("MEMBRO").IsRequired();
            e.Property(x => x.SaldoCp).HasColumnName("saldo_cp").HasDefaultValue(100);
            e.Property(x => x.DataEntrada).HasColumnName("data_entrada")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_membro_usuario").OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.IdGrupo, x.IdUsuario }).IsUnique()
                .HasDatabaseName("unq_membro_grupo");
            e.HasIndex(x => x.IdUsuario).HasDatabaseName("idx_membro_usuario");
        });
    }

    private static void ConfigurarDesafios(ModelBuilder b)
    {
        b.Entity<CategoriaDesafio>(e =>
        {
            e.ToTable("categoria_desafio");
            e.HasKey(x => x.IdCategoria).HasName("pk_categoria_desafio");
            e.Property(x => x.IdCategoria).HasColumnName("id_categoria");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(50).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(200);
            e.HasIndex(x => x.Nome).IsUnique().HasDatabaseName("unq_categoria_nome");
        });

        b.Entity<Desafio>(e =>
        {
            e.ToTable("desafio", t =>
            {
                t.HasCheckConstraint("chk_desafio_tipo",
                     "tipo_recompensa IN ('MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO')");
                t.HasCheckConstraint("chk_desafio_valor_cp", "valor_cp > 0");
                t.HasCheckConstraint("chk_desafio_status",
                     "status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO', " +
                     "'FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')");
                t.HasCheckConstraint("chk_desafio_cancelamento",
                     "status <> 'CANCELADA' OR motivo_cancelamento IS NOT NULL");
                t.HasCheckConstraint("chk_desafio_encerramento",
                     "status NOT IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') " +
                     "OR data_encerramento IS NOT NULL");
            });
            e.HasKey(x => x.IdDesafio).HasName("pk_desafio");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.IdCriador).HasColumnName("id_criador");
            e.Property(x => x.IdCategoria).HasColumnName("id_categoria");
            e.Property(x => x.Titulo).HasColumnName("titulo").HasMaxLength(120).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").IsRequired();
            e.Property(x => x.ValorCp).HasColumnName("valor_cp");
            e.Property(x => x.TipoRecompensa).HasColumnName("tipo_recompensa")
                .HasMaxLength(20).IsRequired();
            e.Property(x => x.DescricaoRecompensa).HasColumnName("descricao_recompensa")
                .HasMaxLength(255);
            e.Property(x => x.DataCriacao).HasColumnName("data_criacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.DataLimite).HasColumnName("data_limite");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(30)
                .HasDefaultValue("ABERTA").IsRequired();
            e.Property(x => x.MotivoCancelamento)
                .HasColumnName("motivo_cancelamento").HasMaxLength(255);
            e.Property(x => x.DataEncerramento).HasColumnName("data_encerramento");
            e.HasOne<GrupoAmigos>().WithMany().HasForeignKey(x => x.IdGrupo)
                .HasConstraintName("fk_desafio_grupo").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdCriador)
                .HasConstraintName("fk_desafio_criador").OnDelete(DeleteBehavior.Restrict);
            e.HasOne<CategoriaDesafio>().WithMany().HasForeignKey(x => x.IdCategoria)
                .HasConstraintName("fk_desafio_categoria").OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Participantes).WithOne()
                .HasForeignKey(p => p.IdDesafio)
                .HasConstraintName("fk_participante_desafio")
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.IdGrupo).HasDatabaseName("idx_desafio_grupo");
            e.HasIndex(x => x.Status).HasDatabaseName("idx_desafio_status");
            e.HasIndex(x => x.DataLimite).HasDatabaseName("idx_desafio_data_limite")
                .HasFilter("status IN ('ABERTA', 'EM_ANDAMENTO')");
        });

        b.Entity<ModeracaoDesafio>(e =>
        {
            e.ToTable("moderacao_desafio", t =>
            {
                t.HasCheckConstraint("chk_moderacao_nivel",
                     "nivel_filtro IN ('LEVE', 'MODERADO', 'PESADO')");
                // RN28: reprovacao sempre explica o motivo.
                t.HasCheckConstraint("chk_moderacao_motivo", "aprovado OR motivo IS NOT NULL");
                // Proposta reprovada nao vira desafio.
                t.HasCheckConstraint("chk_moderacao_desafio", "id_desafio IS NULL OR aprovado");
            });
            e.HasKey(x => x.IdModeracao).HasName("pk_moderacao_desafio");
            e.Property(x => x.IdModeracao).HasColumnName("id_moderacao");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.IdCriador).HasColumnName("id_criador");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.NivelFiltro).HasColumnName("nivel_filtro")
                .HasMaxLength(10).IsRequired();
            e.Property(x => x.Titulo).HasColumnName("titulo").HasMaxLength(120).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").IsRequired();
            e.Property(x => x.Aprovado).HasColumnName("aprovado");
            e.Property(x => x.Motivo).HasColumnName("motivo").HasMaxLength(500);
            e.Property(x => x.DataAvaliacao).HasColumnName("data_avaliacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<GrupoAmigos>().WithMany().HasForeignKey(x => x.IdGrupo)
                .HasConstraintName("fk_moderacao_grupo").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdCriador)
                .HasConstraintName("fk_moderacao_criador").OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Desafio>().WithMany().HasForeignKey(x => x.IdDesafio)
                .HasConstraintName("fk_moderacao_desafio").OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.IdGrupo).HasDatabaseName("idx_moderacao_grupo");
            e.HasIndex(x => x.IdCriador).HasDatabaseName("idx_moderacao_criador");
            e.HasIndex(x => x.IdDesafio).IsUnique().HasDatabaseName("unq_moderacao_desafio");
        });

        b.Entity<ParticipanteDesafio>(e =>
        {
            e.ToTable("participante_desafio", t =>
            {
                t.HasCheckConstraint("chk_participante_papel",
                     "papel_desafio IN ('DESAFIANTE', 'DESAFIADO', 'APOSTADOR')");
                t.HasCheckConstraint("chk_participante_escolha",
                     "escolha IN ('VAI_CUMPRIR', 'NAO_VAI_CUMPRIR')");
            });
            e.HasKey(x => x.IdParticipante).HasName("pk_participante_desafio");
            e.Property(x => x.IdParticipante).HasColumnName("id_participante");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.PapelDesafio).HasColumnName("papel_desafio")
                .HasMaxLength(20).IsRequired();
            e.Property(x => x.Escolha).HasColumnName("escolha").HasMaxLength(20).IsRequired();
            e.Property(x => x.DataAceite).HasColumnName("data_aceite")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_participante_usuario").OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.IdDesafio, x.IdUsuario }).IsUnique()
                .HasDatabaseName("unq_participante_desafio");
            e.HasIndex(x => x.IdUsuario).HasDatabaseName("idx_participante_usuario");
            // RN09: no maximo 1 DESAFIANTE e 1 DESAFIADO. APOSTADOR fica livre.
            e.HasIndex(x => new { x.IdDesafio, x.PapelDesafio }).IsUnique()
                .HasDatabaseName("unq_desafio_papel_unico")
                .HasFilter("papel_desafio IN ('DESAFIANTE', 'DESAFIADO')");
        });
    }

    private static void ConfigurarValidacao(ModelBuilder b)
    {
        b.Entity<Evidencia>(e =>
        {
            e.ToTable("evidencia", t =>
            {
                t.HasCheckConstraint("chk_evidencia_midia",
                     "tipo_midia IN ('FOTO', 'VIDEO', 'LINK', 'TEXTO')");
                t.HasCheckConstraint("chk_evidencia_status",
                     "status IN ('EM_VOTACAO', 'ACEITA', 'RECUSADA', 'EXPIRADA')");
                t.HasCheckConstraint("chk_evidencia_ordem", "ordem BETWEEN 1 AND 5");
                t.HasCheckConstraint("chk_evidencia_votacao",
                     "data_limite_votacao > data_envio");
                t.HasCheckConstraint("chk_evidencia_apuracao",
                     "status = 'EM_VOTACAO' OR data_apuracao IS NOT NULL");
            });
            e.HasKey(x => x.IdEvidencia).HasName("pk_evidencia");
            e.Property(x => x.IdEvidencia).HasColumnName("id_evidencia");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Ordem).HasColumnName("ordem");
            e.Property(x => x.TipoMidia).HasColumnName("tipo_midia").HasMaxLength(20).IsRequired();
            e.Property(x => x.UrlComprovante).HasColumnName("url_comprovante")
                .HasMaxLength(500).IsRequired();
            e.Property(x => x.Comentario).HasColumnName("comentario");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20)
                .HasDefaultValue("EM_VOTACAO").IsRequired();
            e.Property(x => x.DataEnvio).HasColumnName("data_envio")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.DataLimiteVotacao).HasColumnName("data_limite_votacao");
            e.Property(x => x.DataApuracao).HasColumnName("data_apuracao");
            e.HasOne<Desafio>().WithMany().HasForeignKey(x => x.IdDesafio)
                .HasConstraintName("fk_evidencia_desafio").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_evidencia_usuario").OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Jurados).WithOne()
                .HasForeignKey(j => j.IdEvidencia)
                .HasConstraintName("fk_jurado_evidencia")
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.IdDesafio, x.Ordem }).IsUnique()
                .HasDatabaseName("unq_evidencia_ordem");
            e.HasIndex(x => x.IdDesafio).HasDatabaseName("idx_evidencia_desafio");
            e.HasIndex(x => x.DataLimiteVotacao).HasDatabaseName("idx_evidencia_pendente")
                .HasFilter("status = 'EM_VOTACAO'");
        });

        b.Entity<JuradoEvidencia>(e =>
        {
            e.ToTable("jurado_evidencia", t =>
            {
                // Voto nulo = ainda nao votou; IN com NULL nao reprova o CHECK.
                t.HasCheckConstraint("chk_jurado_voto", "voto IN ('VALIDO', 'INVALIDO')");
                t.HasCheckConstraint("chk_jurado_voto_data", "(voto IS NULL) = (data_voto IS NULL)");
            });
            // RN04 + RN14: a PK e a garantia de voto unico e de voto so do juri.
            e.HasKey(x => new { x.IdEvidencia, x.IdUsuario }).HasName("pk_jurado_evidencia");
            e.Property(x => x.IdEvidencia).HasColumnName("id_evidencia");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Voto).HasColumnName("voto").HasMaxLength(20);
            e.Property(x => x.Justificativa).HasColumnName("justificativa").HasMaxLength(255);
            e.Property(x => x.DataVoto).HasColumnName("data_voto");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_jurado_usuario").OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.IdUsuario).HasDatabaseName("idx_jurado_usuario");
        });

    }

    private static void ConfigurarEconomia(ModelBuilder b)
    {
        b.Entity<TransacaoCp>(e =>
        {
            // APOSTA_ESCROW e o nome antigo de DESAFIO_ESCROW. O ledger e append-only
            // (ADR 0007): lancamentos antigos nao sao reescritos, entao o valor legado
            // continua aceito, mas nenhum codigo novo o grava (ADR 0017).
            // SAIDA_GRUPO zera o saldo de quem sai do grupo (RN24, RN25).
            e.ToTable("transacao_cp", t =>
            {
                t.HasCheckConstraint("chk_transacao_tipo",
                     "tipo IN ('CREDITO_INICIAL', 'DESAFIO_ESCROW', 'APOSTA_ESCROW', 'PREMIO', " +
                     "'ESTORNO', 'RECOMPENSA_VOTO', 'SAIDA_GRUPO')");
                t.HasCheckConstraint("chk_transacao_valor", "valor <> 0");
                t.HasCheckConstraint("chk_transacao_conta",
                     "id_usuario IS NOT NULL OR id_desafio IS NOT NULL");
                t.HasCheckConstraint("chk_transacao_escrow",
                     "tipo NOT IN ('DESAFIO_ESCROW', 'APOSTA_ESCROW') OR id_desafio IS NOT NULL");
            });
            e.HasKey(x => x.IdTransacao).HasName("pk_transacao_cp");
            e.Property(x => x.IdTransacao).HasColumnName("id_transacao");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.Tipo).HasColumnName("tipo").HasMaxLength(20).IsRequired();
            e.Property(x => x.Valor).HasColumnName("valor");
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(255).IsRequired();
            e.Property(x => x.DataLancamento).HasColumnName("data_lancamento")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<GrupoAmigos>().WithMany().HasForeignKey(x => x.IdGrupo)
                .HasConstraintName("fk_transacao_grupo").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_transacao_usuario").OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Desafio>().WithMany().HasForeignKey(x => x.IdDesafio)
                .HasConstraintName("fk_transacao_desafio").OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.IdGrupo, x.IdUsuario }).HasDatabaseName("idx_transacao_conta");
            e.HasIndex(x => x.IdDesafio).HasDatabaseName("idx_transacao_desafio");
        });
    }
}
