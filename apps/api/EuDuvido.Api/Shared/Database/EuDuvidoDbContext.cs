using EuDuvido.Api.Modules.Desafios.Domain;
using EuDuvido.Api.Modules.Economia.Domain;
using EuDuvido.Api.Modules.Grupos.Domain;
using EuDuvido.Api.Modules.Identidade.Domain;
using EuDuvido.Api.Modules.Notificacoes.Domain;
using EuDuvido.Api.Modules.Validacao.Domain;
using Microsoft.EntityFrameworkCore;

namespace EuDuvido.Api.Shared.Database;

// Toda configuracao usa nomes de constraint explicitos e iguais aos do
// schema.sql documentado. Os documentos 11, 12 e 17 citam esses nomes; deixar
// o EF gerar CK_desafio_xxx faria tres entregaveis mentirem.
public class EuDuvidoDbContext(DbContextOptions<EuDuvidoDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<CredencialUsuario> Credenciais => Set<CredencialUsuario>();
    public DbSet<GrupoAmigos> Grupos => Set<GrupoAmigos>();
    public DbSet<MembroGrupo> Membros => Set<MembroGrupo>();
    public DbSet<ConviteGrupo> Convites => Set<ConviteGrupo>();
    public DbSet<CategoriaDesafio> Categorias => Set<CategoriaDesafio>();
    public DbSet<Desafio> Desafios => Set<Desafio>();
    public DbSet<ParticipanteDesafio> Participantes => Set<ParticipanteDesafio>();
    public DbSet<ComentarioDesafio> Comentarios => Set<ComentarioDesafio>();
    public DbSet<Evidencia> Evidencias => Set<Evidencia>();
    public DbSet<ValidadorEvidencia> Validadores => Set<ValidadorEvidencia>();
    public DbSet<VotoEvidencia> Votos => Set<VotoEvidencia>();
    public DbSet<TransacaoCp> Transacoes => Set<TransacaoCp>();
    public DbSet<Notificacao> Notificacoes => Set<Notificacao>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        ConfigurarIdentidade(b);
        ConfigurarGrupos(b);
        ConfigurarDesafios(b);
        ConfigurarValidacao(b);
        ConfigurarEconomia(b);
        ConfigurarNotificacoes(b);
    }

    private static void ConfigurarIdentidade(ModelBuilder b)
    {
        b.Entity<Usuario>(e =>
        {
            e.ToTable("usuario", "identidade");
            e.HasKey(x => x.IdUsuario).HasName("pk_usuario");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(120).IsRequired();
            e.Property(x => x.Apelido).HasColumnName("apelido").HasMaxLength(50).IsRequired();
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            e.Property(x => x.DataCadastro).HasColumnName("data_cadastro")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasIndex(x => x.Email).IsUnique().HasDatabaseName("unq_usuario_email");
            e.HasMany(x => x.Credenciais).WithOne()
                .HasForeignKey(c => c.IdUsuario)
                .HasConstraintName("fk_credencial_usuario")
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CredencialUsuario>(e =>
        {
            e.ToTable("credencial_usuario", "identidade", t =>
            {
                t.HasCheckConstraint("chk_credencial_provedor",
                     "provedor IN ('GOOGLE', 'SENHA')");
                t.HasCheckConstraint("chk_credencial_segredo",
                     "(provedor = 'GOOGLE' AND segredo_hash IS NULL) OR " +
                     "(provedor = 'SENHA' AND segredo_hash IS NOT NULL)");
            });
            e.HasKey(x => x.IdCredencial).HasName("pk_credencial_usuario");
            e.Property(x => x.IdCredencial).HasColumnName("id_credencial");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Provedor).HasColumnName("provedor").HasMaxLength(20).IsRequired();
            e.Property(x => x.IdExterno).HasColumnName("id_externo").HasMaxLength(255).IsRequired();
            e.Property(x => x.SegredoHash).HasColumnName("segredo_hash").HasMaxLength(255);
            e.Property(x => x.DataVinculo).HasColumnName("data_vinculo")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasIndex(x => new { x.Provedor, x.IdExterno }).IsUnique()
                .HasDatabaseName("unq_credencial_provedor");
            e.HasIndex(x => new { x.IdUsuario, x.Provedor }).IsUnique()
                .HasDatabaseName("unq_credencial_usuario_provedor");
            e.HasIndex(x => x.IdUsuario).HasDatabaseName("idx_credencial_usuario");
        });
    }

    private static void ConfigurarGrupos(ModelBuilder b)
    {
        b.Entity<GrupoAmigos>(e =>
        {
            e.ToTable("grupo_amigos", "grupos");
            e.HasKey(x => x.IdGrupo).HasName("pk_grupo_amigos");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(80).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(255);
            e.Property(x => x.IdCriador).HasColumnName("id_criador");
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
            e.ToTable("membro_grupo", "grupos", t =>
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

        b.Entity<ConviteGrupo>(e =>
        {
            e.ToTable("convite_grupo", "grupos", t =>
            {
                t.HasCheckConstraint("chk_convite_expiracao", "data_expiracao > data_criacao");
                t.HasCheckConstraint("chk_convite_uso",
                     "(id_usado_por IS NULL AND data_uso IS NULL) OR " +
                     "(id_usado_por IS NOT NULL AND data_uso IS NOT NULL)");
            });
            e.HasKey(x => x.IdConvite).HasName("pk_convite_grupo");
            e.Property(x => x.IdConvite).HasColumnName("id_convite");
            e.Property(x => x.IdGrupo).HasColumnName("id_grupo");
            e.Property(x => x.Codigo).HasColumnName("codigo").HasColumnType("char(6)").IsRequired();
            e.Property(x => x.IdCriador).HasColumnName("id_criador");
            e.Property(x => x.DataCriacao).HasColumnName("data_criacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.DataExpiracao).HasColumnName("data_expiracao");
            e.Property(x => x.IdUsadoPor).HasColumnName("id_usado_por");
            e.Property(x => x.DataUso).HasColumnName("data_uso");
            e.HasOne<GrupoAmigos>().WithMany().HasForeignKey(x => x.IdGrupo)
                .HasConstraintName("fk_convite_grupo").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdCriador)
                .HasConstraintName("fk_convite_criador").OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsadoPor)
                .HasConstraintName("fk_convite_usado_por").OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.Codigo).IsUnique().HasDatabaseName("unq_convite_codigo");
            e.HasIndex(x => x.IdGrupo).HasDatabaseName("idx_convite_grupo");
        });
    }

    private static void ConfigurarDesafios(ModelBuilder b)
    {
        b.Entity<CategoriaDesafio>(e =>
        {
            e.ToTable("categoria_desafio", "desafios");
            e.HasKey(x => x.IdCategoria).HasName("pk_categoria_desafio");
            e.Property(x => x.IdCategoria).HasColumnName("id_categoria");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(50).IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(200);
            e.HasIndex(x => x.Nome).IsUnique().HasDatabaseName("unq_categoria_nome");
        });

        b.Entity<Desafio>(e =>
        {
            e.ToTable("desafio", "desafios", t =>
            {
                t.HasCheckConstraint("chk_desafio_tipo",
                     "tipo_recompensa IN ('MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO')");
                t.HasCheckConstraint("chk_desafio_valor",
                     "valor_monetario IS NULL OR valor_monetario > 0");
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
            e.Property(x => x.ValorMonetario).HasColumnName("valor_monetario")
                .HasPrecision(10, 2);
            e.Property(x => x.DescricaoPrenda).HasColumnName("descricao_prenda").HasMaxLength(255);
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

        b.Entity<ParticipanteDesafio>(e =>
        {
            e.ToTable("participante_desafio", "desafios", t =>
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

        b.Entity<ComentarioDesafio>(e =>
        {
            e.ToTable("comentario_desafio", "desafios", t =>
            {
                t.HasCheckConstraint("chk_comentario_texto", "length(trim(texto)) > 0");
            });
            e.HasKey(x => x.IdComentario).HasName("pk_comentario_desafio");
            e.Property(x => x.IdComentario).HasColumnName("id_comentario");
            e.Property(x => x.IdDesafio).HasColumnName("id_desafio");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Texto).HasColumnName("texto").HasMaxLength(500).IsRequired();
            e.Property(x => x.DataEnvio).HasColumnName("data_envio")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<Desafio>().WithMany().HasForeignKey(x => x.IdDesafio)
                .HasConstraintName("fk_comentario_desafio").OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_comentario_usuario").OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.IdDesafio).HasDatabaseName("idx_comentario_desafio");
        });
    }

    private static void ConfigurarValidacao(ModelBuilder b)
    {
        b.Entity<Evidencia>(e =>
        {
            e.ToTable("evidencia", "validacao", t =>
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
            e.HasMany(x => x.Validadores).WithOne()
                .HasForeignKey(v => v.IdEvidencia)
                .HasConstraintName("fk_validador_evidencia")
                .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Votos).WithOne()
                .HasForeignKey(v => v.IdEvidencia)
                .HasConstraintName("fk_voto_evidencia")
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.IdDesafio, x.Ordem }).IsUnique()
                .HasDatabaseName("unq_evidencia_ordem");
            e.HasIndex(x => x.IdDesafio).HasDatabaseName("idx_evidencia_desafio");
            e.HasIndex(x => x.DataLimiteVotacao).HasDatabaseName("idx_evidencia_pendente")
                .HasFilter("status = 'EM_VOTACAO'");
        });

        b.Entity<ValidadorEvidencia>(e =>
        {
            e.ToTable("validador_evidencia", "validacao");
            e.HasKey(x => new { x.IdEvidencia, x.IdUsuario })
                .HasName("pk_validador_evidencia");
            e.Property(x => x.IdEvidencia).HasColumnName("id_evidencia");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_validador_usuario").OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<VotoEvidencia>(e =>
        {
            e.ToTable("voto_evidencia", "validacao", t =>
            {
                t.HasCheckConstraint("chk_voto_tipo", "voto IN ('VALIDO', 'INVALIDO')");
            });
            e.HasKey(x => x.IdVoto).HasName("pk_voto_evidencia");
            e.Property(x => x.IdVoto).HasColumnName("id_voto");
            e.Property(x => x.IdEvidencia).HasColumnName("id_evidencia");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Voto).HasColumnName("voto").HasMaxLength(20).IsRequired();
            e.Property(x => x.Justificativa).HasColumnName("justificativa").HasMaxLength(255);
            e.Property(x => x.DataVoto).HasColumnName("data_voto")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_voto_usuario").OnDelete(DeleteBehavior.Restrict);
            // RN14: FK composta - so vota quem esta no snapshot de validadores.
            e.HasOne<ValidadorEvidencia>().WithMany()
                .HasForeignKey(x => new { x.IdEvidencia, x.IdUsuario })
                .HasConstraintName("fk_voto_validador")
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.IdEvidencia, x.IdUsuario }).IsUnique()
                .HasDatabaseName("unq_voto_usuario");
            e.HasIndex(x => x.IdEvidencia).HasDatabaseName("idx_voto_evidencia");
        });
    }

    private static void ConfigurarEconomia(ModelBuilder b)
    {
        b.Entity<TransacaoCp>(e =>
        {
            // APOSTA_ESCROW e o nome antigo de DESAFIO_ESCROW. O ledger e append-only
            // (ADR 0007): lancamentos antigos nao sao reescritos, entao o valor legado
            // continua aceito, mas nenhum codigo novo o grava.
            e.ToTable("transacao_cp", "economia", t =>
            {
                t.HasCheckConstraint("chk_transacao_tipo",
                     "tipo IN ('CREDITO_INICIAL', 'DESAFIO_ESCROW', 'APOSTA_ESCROW', 'PREMIO', " +
                     "'ESTORNO', 'RECOMPENSA_VOTO')");
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

    private static void ConfigurarNotificacoes(ModelBuilder b)
    {
        b.Entity<Notificacao>(e =>
        {
            e.ToTable("notificacao", "notificacoes", t =>
            {
                t.HasCheckConstraint("chk_notificacao_tipo",
                    "tipo IN ('PRAZO_VENCENDO', 'EVIDENCIA_ENVIADA', 'VOTACAO_ABERTA', " +
                    "'DESAFIO_ENCERRADO', 'CONVITE_ACEITO')");
            });
            e.HasKey(x => x.IdNotificacao).HasName("pk_notificacao");
            e.Property(x => x.IdNotificacao).HasColumnName("id_notificacao");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Tipo).HasColumnName("tipo").HasMaxLength(30).IsRequired();
            e.Property(x => x.Titulo).HasColumnName("titulo").HasMaxLength(120).IsRequired();
            e.Property(x => x.Corpo).HasColumnName("corpo").HasMaxLength(255).IsRequired();
            e.Property(x => x.UrlDestino).HasColumnName("url_destino").HasMaxLength(255);
            e.Property(x => x.DataCriacao).HasColumnName("data_criacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.DataLeitura).HasColumnName("data_leitura");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_notificacao_usuario").OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.IdUsuario).HasDatabaseName("idx_notificacao_nao_lida")
                .HasFilter("data_leitura IS NULL");
        });

        b.Entity<PushSubscription>(e =>
        {
            e.ToTable("push_subscription", "notificacoes");
            e.HasKey(x => x.IdSubscription).HasName("pk_push_subscription");
            e.Property(x => x.IdSubscription).HasColumnName("id_subscription");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Endpoint).HasColumnName("endpoint").HasMaxLength(500).IsRequired();
            e.Property(x => x.ChaveP256dh).HasColumnName("chave_p256dh")
                .HasMaxLength(255).IsRequired();
            e.Property(x => x.ChaveAuth).HasColumnName("chave_auth")
                .HasMaxLength(255).IsRequired();
            e.Property(x => x.DataCriacao).HasColumnName("data_criacao")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.DataUltimoUso).HasColumnName("data_ultimo_uso");
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.IdUsuario)
                .HasConstraintName("fk_push_usuario").OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.Endpoint).IsUnique().HasDatabaseName("unq_push_endpoint");
        });
    }
}
