using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EuDuvido.Api.Shared.Database.Migrations
{
    /// <inheritdoc />
    public partial class InicialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "apostas");

            migrationBuilder.EnsureSchema(
                name: "grupos");

            migrationBuilder.EnsureSchema(
                name: "identidade");

            migrationBuilder.EnsureSchema(
                name: "validacao");

            migrationBuilder.EnsureSchema(
                name: "notificacoes");

            migrationBuilder.EnsureSchema(
                name: "economia");

            migrationBuilder.CreateTable(
                name: "categoria_desafio",
                schema: "apostas",
                columns: table => new
                {
                    id_categoria = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categoria_desafio", x => x.id_categoria);
                });

            migrationBuilder.CreateTable(
                name: "usuario",
                schema: "identidade",
                columns: table => new
                {
                    id_usuario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    apelido = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    avatar_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    data_cadastro = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuario", x => x.id_usuario);
                });

            migrationBuilder.CreateTable(
                name: "credencial_usuario",
                schema: "identidade",
                columns: table => new
                {
                    id_credencial = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    provedor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    id_externo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    segredo_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_vinculo = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_credencial_usuario", x => x.id_credencial);
                    table.CheckConstraint("chk_credencial_provedor", "provedor IN ('GOOGLE', 'SENHA')");
                    table.CheckConstraint("chk_credencial_segredo", "(provedor = 'GOOGLE' AND segredo_hash IS NULL) OR (provedor = 'SENHA' AND segredo_hash IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_credencial_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grupo_amigos",
                schema: "grupos",
                columns: table => new
                {
                    id_grupo = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    descricao = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    id_criador = table.Column<int>(type: "integer", nullable: false),
                    data_criacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grupo_amigos", x => x.id_grupo);
                    table.ForeignKey(
                        name: "fk_grupo_criador",
                        column: x => x.id_criador,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notificacao",
                schema: "notificacoes",
                columns: table => new
                {
                    id_notificacao = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    titulo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    corpo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    url_destino = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_criacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_leitura = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notificacao", x => x.id_notificacao);
                    table.CheckConstraint("chk_notificacao_tipo", "tipo IN ('PRAZO_VENCENDO', 'EVIDENCIA_ENVIADA', 'VOTACAO_ABERTA', 'APOSTA_ENCERRADA', 'CONVITE_ACEITO')");
                    table.ForeignKey(
                        name: "fk_notificacao_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "push_subscription",
                schema: "notificacoes",
                columns: table => new
                {
                    id_subscription = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    chave_p256dh = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    chave_auth = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    data_criacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_ultimo_uso = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_push_subscription", x => x.id_subscription);
                    table.ForeignKey(
                        name: "fk_push_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aposta",
                schema: "apostas",
                columns: table => new
                {
                    id_aposta = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_grupo = table.Column<int>(type: "integer", nullable: false),
                    id_criador = table.Column<int>(type: "integer", nullable: false),
                    id_categoria = table.Column<int>(type: "integer", nullable: false),
                    titulo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    descricao = table.Column<string>(type: "text", nullable: false),
                    valor_cp = table.Column<int>(type: "integer", nullable: false),
                    tipo_recompensa = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    valor_monetario = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    descricao_prenda = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_criacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_limite = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "ABERTA"),
                    motivo_cancelamento = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_encerramento = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aposta", x => x.id_aposta);
                    table.CheckConstraint("chk_aposta_cancelamento", "status <> 'CANCELADA' OR motivo_cancelamento IS NOT NULL");
                    table.CheckConstraint("chk_aposta_encerramento", "status NOT IN ('FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA') OR data_encerramento IS NOT NULL");
                    table.CheckConstraint("chk_aposta_status", "status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO', 'FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA')");
                    table.CheckConstraint("chk_aposta_tipo", "tipo_recompensa IN ('MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO')");
                    table.CheckConstraint("chk_aposta_valor", "valor_monetario IS NULL OR valor_monetario > 0");
                    table.CheckConstraint("chk_aposta_valor_cp", "valor_cp > 0");
                    table.ForeignKey(
                        name: "fk_aposta_categoria",
                        column: x => x.id_categoria,
                        principalSchema: "apostas",
                        principalTable: "categoria_desafio",
                        principalColumn: "id_categoria",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_aposta_criador",
                        column: x => x.id_criador,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_aposta_grupo",
                        column: x => x.id_grupo,
                        principalSchema: "grupos",
                        principalTable: "grupo_amigos",
                        principalColumn: "id_grupo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "convite_grupo",
                schema: "grupos",
                columns: table => new
                {
                    id_convite = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_grupo = table.Column<int>(type: "integer", nullable: false),
                    codigo = table.Column<string>(type: "char(6)", nullable: false),
                    id_criador = table.Column<int>(type: "integer", nullable: false),
                    data_criacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_expiracao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    id_usado_por = table.Column<int>(type: "integer", nullable: true),
                    data_uso = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_convite_grupo", x => x.id_convite);
                    table.CheckConstraint("chk_convite_expiracao", "data_expiracao > data_criacao");
                    table.CheckConstraint("chk_convite_uso", "(id_usado_por IS NULL AND data_uso IS NULL) OR (id_usado_por IS NOT NULL AND data_uso IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_convite_criador",
                        column: x => x.id_criador,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_convite_grupo",
                        column: x => x.id_grupo,
                        principalSchema: "grupos",
                        principalTable: "grupo_amigos",
                        principalColumn: "id_grupo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_convite_usado_por",
                        column: x => x.id_usado_por,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "membro_grupo",
                schema: "grupos",
                columns: table => new
                {
                    id_membro = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_grupo = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    papel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "MEMBRO"),
                    saldo_cp = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    data_entrada = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_membro_grupo", x => x.id_membro);
                    table.CheckConstraint("chk_membro_papel", "papel IN ('ADMIN', 'MEMBRO')");
                    table.CheckConstraint("chk_membro_saldo", "saldo_cp >= 0");
                    table.ForeignKey(
                        name: "fk_membro_grupo",
                        column: x => x.id_grupo,
                        principalSchema: "grupos",
                        principalTable: "grupo_amigos",
                        principalColumn: "id_grupo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_membro_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "comentario_aposta",
                schema: "apostas",
                columns: table => new
                {
                    id_comentario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_aposta = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    texto = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    data_envio = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_comentario_aposta", x => x.id_comentario);
                    table.CheckConstraint("chk_comentario_texto", "length(trim(texto)) > 0");
                    table.ForeignKey(
                        name: "fk_comentario_aposta",
                        column: x => x.id_aposta,
                        principalSchema: "apostas",
                        principalTable: "aposta",
                        principalColumn: "id_aposta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_comentario_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "evidencia",
                schema: "validacao",
                columns: table => new
                {
                    id_evidencia = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_aposta = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    ordem = table.Column<int>(type: "integer", nullable: false),
                    tipo_midia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    url_comprovante = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    comentario = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "EM_VOTACAO"),
                    data_envio = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    data_limite_votacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    data_apuracao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_evidencia", x => x.id_evidencia);
                    table.CheckConstraint("chk_evidencia_apuracao", "status = 'EM_VOTACAO' OR data_apuracao IS NOT NULL");
                    table.CheckConstraint("chk_evidencia_midia", "tipo_midia IN ('FOTO', 'VIDEO', 'LINK', 'TEXTO')");
                    table.CheckConstraint("chk_evidencia_ordem", "ordem BETWEEN 1 AND 5");
                    table.CheckConstraint("chk_evidencia_status", "status IN ('EM_VOTACAO', 'ACEITA', 'RECUSADA', 'EXPIRADA')");
                    table.CheckConstraint("chk_evidencia_votacao", "data_limite_votacao > data_envio");
                    table.ForeignKey(
                        name: "fk_evidencia_aposta",
                        column: x => x.id_aposta,
                        principalSchema: "apostas",
                        principalTable: "aposta",
                        principalColumn: "id_aposta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_evidencia_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "participante_aposta",
                schema: "apostas",
                columns: table => new
                {
                    id_participante = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_aposta = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    papel_aposta = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    escolha = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    data_aceite = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_participante_aposta", x => x.id_participante);
                    table.CheckConstraint("chk_participante_escolha", "escolha IN ('VAI_CUMPRIR', 'NAO_VAI_CUMPRIR')");
                    table.CheckConstraint("chk_participante_papel", "papel_aposta IN ('DESAFIANTE', 'DESAFIADO', 'APOSTADOR')");
                    table.ForeignKey(
                        name: "fk_participante_aposta",
                        column: x => x.id_aposta,
                        principalSchema: "apostas",
                        principalTable: "aposta",
                        principalColumn: "id_aposta",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_participante_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "transacao_cp",
                schema: "economia",
                columns: table => new
                {
                    id_transacao = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_grupo = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: true),
                    id_aposta = table.Column<int>(type: "integer", nullable: true),
                    tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    valor = table.Column<int>(type: "integer", nullable: false),
                    descricao = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    data_lancamento = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_transacao_cp", x => x.id_transacao);
                    table.CheckConstraint("chk_transacao_conta", "id_usuario IS NOT NULL OR id_aposta IS NOT NULL");
                    table.CheckConstraint("chk_transacao_escrow", "tipo <> 'APOSTA_ESCROW' OR id_aposta IS NOT NULL");
                    table.CheckConstraint("chk_transacao_tipo", "tipo IN ('CREDITO_INICIAL', 'APOSTA_ESCROW', 'PREMIO', 'ESTORNO', 'RECOMPENSA_VOTO')");
                    table.CheckConstraint("chk_transacao_valor", "valor <> 0");
                    table.ForeignKey(
                        name: "fk_transacao_aposta",
                        column: x => x.id_aposta,
                        principalSchema: "apostas",
                        principalTable: "aposta",
                        principalColumn: "id_aposta",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_transacao_grupo",
                        column: x => x.id_grupo,
                        principalSchema: "grupos",
                        principalTable: "grupo_amigos",
                        principalColumn: "id_grupo",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_transacao_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "validador_evidencia",
                schema: "validacao",
                columns: table => new
                {
                    id_evidencia = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_validador_evidencia", x => new { x.id_evidencia, x.id_usuario });
                    table.ForeignKey(
                        name: "fk_validador_evidencia",
                        column: x => x.id_evidencia,
                        principalSchema: "validacao",
                        principalTable: "evidencia",
                        principalColumn: "id_evidencia",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_validador_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "voto_evidencia",
                schema: "validacao",
                columns: table => new
                {
                    id_voto = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_evidencia = table.Column<int>(type: "integer", nullable: false),
                    id_usuario = table.Column<int>(type: "integer", nullable: false),
                    voto = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    justificativa = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_voto = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_voto_evidencia", x => x.id_voto);
                    table.CheckConstraint("chk_voto_tipo", "voto IN ('VALIDO', 'INVALIDO')");
                    table.ForeignKey(
                        name: "fk_voto_evidencia",
                        column: x => x.id_evidencia,
                        principalSchema: "validacao",
                        principalTable: "evidencia",
                        principalColumn: "id_evidencia",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_voto_usuario",
                        column: x => x.id_usuario,
                        principalSchema: "identidade",
                        principalTable: "usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_voto_validador",
                        columns: x => new { x.id_evidencia, x.id_usuario },
                        principalSchema: "validacao",
                        principalTable: "validador_evidencia",
                        principalColumns: new[] { "id_evidencia", "id_usuario" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_aposta_data_limite",
                schema: "apostas",
                table: "aposta",
                column: "data_limite",
                filter: "status IN ('ABERTA', 'EM_ANDAMENTO')");

            migrationBuilder.CreateIndex(
                name: "idx_aposta_grupo",
                schema: "apostas",
                table: "aposta",
                column: "id_grupo");

            migrationBuilder.CreateIndex(
                name: "idx_aposta_status",
                schema: "apostas",
                table: "aposta",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_aposta_id_categoria",
                schema: "apostas",
                table: "aposta",
                column: "id_categoria");

            migrationBuilder.CreateIndex(
                name: "IX_aposta_id_criador",
                schema: "apostas",
                table: "aposta",
                column: "id_criador");

            migrationBuilder.CreateIndex(
                name: "unq_categoria_nome",
                schema: "apostas",
                table: "categoria_desafio",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_comentario_aposta",
                schema: "apostas",
                table: "comentario_aposta",
                column: "id_aposta");

            migrationBuilder.CreateIndex(
                name: "IX_comentario_aposta_id_usuario",
                schema: "apostas",
                table: "comentario_aposta",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "idx_convite_grupo",
                schema: "grupos",
                table: "convite_grupo",
                column: "id_grupo");

            migrationBuilder.CreateIndex(
                name: "IX_convite_grupo_id_criador",
                schema: "grupos",
                table: "convite_grupo",
                column: "id_criador");

            migrationBuilder.CreateIndex(
                name: "IX_convite_grupo_id_usado_por",
                schema: "grupos",
                table: "convite_grupo",
                column: "id_usado_por");

            migrationBuilder.CreateIndex(
                name: "unq_convite_codigo",
                schema: "grupos",
                table: "convite_grupo",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_credencial_usuario",
                schema: "identidade",
                table: "credencial_usuario",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_credencial_provedor",
                schema: "identidade",
                table: "credencial_usuario",
                columns: new[] { "provedor", "id_externo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "unq_credencial_usuario_provedor",
                schema: "identidade",
                table: "credencial_usuario",
                columns: new[] { "id_usuario", "provedor" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_evidencia_aposta",
                schema: "validacao",
                table: "evidencia",
                column: "id_aposta");

            migrationBuilder.CreateIndex(
                name: "idx_evidencia_pendente",
                schema: "validacao",
                table: "evidencia",
                column: "data_limite_votacao",
                filter: "status = 'EM_VOTACAO'");

            migrationBuilder.CreateIndex(
                name: "IX_evidencia_id_usuario",
                schema: "validacao",
                table: "evidencia",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_evidencia_ordem",
                schema: "validacao",
                table: "evidencia",
                columns: new[] { "id_aposta", "ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_grupo_amigos_id_criador",
                schema: "grupos",
                table: "grupo_amigos",
                column: "id_criador");

            migrationBuilder.CreateIndex(
                name: "idx_membro_usuario",
                schema: "grupos",
                table: "membro_grupo",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_membro_grupo",
                schema: "grupos",
                table: "membro_grupo",
                columns: new[] { "id_grupo", "id_usuario" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_notificacao_nao_lida",
                schema: "notificacoes",
                table: "notificacao",
                column: "id_usuario",
                filter: "data_leitura IS NULL");

            migrationBuilder.CreateIndex(
                name: "idx_participante_usuario",
                schema: "apostas",
                table: "participante_aposta",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_aposta_papel_unico",
                schema: "apostas",
                table: "participante_aposta",
                columns: new[] { "id_aposta", "papel_aposta" },
                unique: true,
                filter: "papel_aposta IN ('DESAFIANTE', 'DESAFIADO')");

            migrationBuilder.CreateIndex(
                name: "unq_participante_aposta",
                schema: "apostas",
                table: "participante_aposta",
                columns: new[] { "id_aposta", "id_usuario" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_push_subscription_id_usuario",
                schema: "notificacoes",
                table: "push_subscription",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_push_endpoint",
                schema: "notificacoes",
                table: "push_subscription",
                column: "endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_transacao_aposta",
                schema: "economia",
                table: "transacao_cp",
                column: "id_aposta");

            migrationBuilder.CreateIndex(
                name: "idx_transacao_conta",
                schema: "economia",
                table: "transacao_cp",
                columns: new[] { "id_grupo", "id_usuario" });

            migrationBuilder.CreateIndex(
                name: "IX_transacao_cp_id_usuario",
                schema: "economia",
                table: "transacao_cp",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_usuario_email",
                schema: "identidade",
                table: "usuario",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_validador_evidencia_id_usuario",
                schema: "validacao",
                table: "validador_evidencia",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "idx_voto_evidencia",
                schema: "validacao",
                table: "voto_evidencia",
                column: "id_evidencia");

            migrationBuilder.CreateIndex(
                name: "IX_voto_evidencia_id_usuario",
                schema: "validacao",
                table: "voto_evidencia",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "unq_voto_usuario",
                schema: "validacao",
                table: "voto_evidencia",
                columns: new[] { "id_evidencia", "id_usuario" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "comentario_aposta",
                schema: "apostas");

            migrationBuilder.DropTable(
                name: "convite_grupo",
                schema: "grupos");

            migrationBuilder.DropTable(
                name: "credencial_usuario",
                schema: "identidade");

            migrationBuilder.DropTable(
                name: "membro_grupo",
                schema: "grupos");

            migrationBuilder.DropTable(
                name: "notificacao",
                schema: "notificacoes");

            migrationBuilder.DropTable(
                name: "participante_aposta",
                schema: "apostas");

            migrationBuilder.DropTable(
                name: "push_subscription",
                schema: "notificacoes");

            migrationBuilder.DropTable(
                name: "transacao_cp",
                schema: "economia");

            migrationBuilder.DropTable(
                name: "voto_evidencia",
                schema: "validacao");

            migrationBuilder.DropTable(
                name: "validador_evidencia",
                schema: "validacao");

            migrationBuilder.DropTable(
                name: "evidencia",
                schema: "validacao");

            migrationBuilder.DropTable(
                name: "aposta",
                schema: "apostas");

            migrationBuilder.DropTable(
                name: "categoria_desafio",
                schema: "apostas");

            migrationBuilder.DropTable(
                name: "grupo_amigos",
                schema: "grupos");

            migrationBuilder.DropTable(
                name: "usuario",
                schema: "identidade");
        }
    }
}
