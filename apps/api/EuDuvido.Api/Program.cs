using System.Net.Http.Headers;
using System.Text;
using EuDuvido.Api.Modules.Desafios.Features;
using EuDuvido.Api.Modules.Desafios.Features.CriarDesafio;
using EuDuvido.Api.Modules.Desafios.Infrastructure;
using EuDuvido.Api.Modules.Grupos.Features;
using EuDuvido.Api.Modules.Identidade.Features;
using EuDuvido.Api.Modules.Identidade.Features.CompletarCadastro;
using EuDuvido.Api.Modules.Identidade.Features.EntrarComGoogle;
using EuDuvido.Api.Modules.Ranking.Features;
using EuDuvido.Api.Modules.Validacao.Features;
using EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;
using EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;
using EuDuvido.Api.Modules.Validacao.Infrastructure;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Ia;
using EuDuvido.Api.Shared.Midia;
using EuDuvido.Api.Shared.Realtime;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var conexao = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres nao configurada.");

var auth = builder.Configuration.GetSection(AuthOptions.Secao).Get<AuthOptions>()
    ?? throw new InvalidOperationException("Secao Auth nao configurada.");

builder.Services.AddSingleton(auth);
builder.Services.AddSingleton<TokenService>();
// O validador simulado so existe para os testes de ponta a ponta (ADR 0024).
var googleSimulado = !string.IsNullOrWhiteSpace(auth.GoogleSimuladoChave);
if (googleSimulado)
{
    if (auth.GoogleSimuladoChave!.Length < ValidadorGoogleSimulado.TamanhoMinimoChave)
        throw new InvalidOperationException(
            $"Auth:GoogleSimuladoChave precisa de ao menos {ValidadorGoogleSimulado.TamanhoMinimoChave} caracteres.");
    builder.Services.AddSingleton<IValidadorGoogle>(new ValidadorGoogleSimulado(auth.GoogleSimuladoChave));
}
else
{
    builder.Services.AddSingleton<IValidadorGoogle, ValidadorGoogle>();
}
builder.Services.AddScoped<EntrarComGoogleHandler>();
builder.Services.AddScoped<CompletarCadastroHandler>();

builder.Services.AddDbContext<EuDuvidoDbContext>(o =>
    o.UseNpgsql(conexao, npg => npg.EnableRetryOnFailure()));

builder.Services.AddSingleton<IConexaoLeitura>(new ConexaoLeitura(conexao));
builder.Services.AddScoped<IApuracao, Apuracao>();
builder.Services.AddScoped<RegistrarVotoHandler>();
builder.Services.AddScoped<EnviarEvidenciaHandler>();

var storage = builder.Configuration.GetSection(StorageOptions.Secao).Get<StorageOptions>() ?? new StorageOptions();
builder.Services.AddSingleton(storage);
builder.Services.AddSingleton<IArmazenamentoMidia, ArmazenamentoMinio>();
builder.Services.AddScoped<CriarDesafioHandler>();
builder.Services.AddHostedService<PrazosWorker>();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// IA de moderacao de desafios, na Groq (ADR 0015). Sem Ia:BaseUrl e Ia:Modelo
// a API sobe normalmente; so criar desafio responde 503.
var ia = builder.Configuration.GetSection(IaOptions.Secao).Get<IaOptions>() ?? new IaOptions();
builder.Services.AddSingleton(ia);
builder.Services.AddHttpClient<IChatIa, ChatIa>(http =>
{
    http.Timeout = TimeSpan.FromSeconds(ia.TimeoutSegundos);
    if (!string.IsNullOrWhiteSpace(ia.ApiKey))
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ia.ApiKey);
});
builder.Services.AddScoped<IModeradorDesafio, ModeradorDesafio>();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<TratadorIaIndisponivel>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsuarioAtual, UsuarioAtual>();

builder.Services.AddSignalR();
builder.Services.AddScoped<INotificadorVotacao, NotificadorVotacao>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        // So a audiencia da sessao: o token de cadastro nao abre endpoint nenhum.
        o.TokenValidationParameters = TokenService.ParametrosValidacao(auth);

        // O cliente SignalR manda o token na query string do handshake.
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origens").Get<string[]>() ?? [])
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

var app = builder.Build();

if (googleSimulado)
    app.Logger.LogWarning(
        "Login com Google SIMULADO ativo (Auth:GoogleSimuladoChave): so para testes, nunca na producao. ADR 0024.");

app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

// Prazo curto: com o banco fora, a estrategia de retry segurava a resposta por
// ~2 minutos (cenario S05), e quem monitora desistia antes de ver o 503.
app.MapGet("/health", async (EuDuvidoDbContext db, CancellationToken ct) =>
{
    using var prazo = CancellationTokenSource.CreateLinkedTokenSource(ct);
    prazo.CancelAfter(TimeSpan.FromSeconds(5));
    bool conecta;
    try
    {
        conecta = await db.Database.CanConnectAsync(prazo.Token);
    }
    catch (OperationCanceledException) when (!ct.IsCancellationRequested)
    {
        conecta = false;
    }
    return conecta
        ? Results.Ok(new { status = "ok" })
        : Results.Problem("Banco indisponivel.", statusCode: 503);
});

app.MapAuthEndpoints();
app.MapGruposEndpoints();
app.MapDesafiosEndpoints();
app.MapValidacaoEndpoints();
app.MapRankingEndpoints();
app.MapHub<VotacaoHub>("/hubs/votacao").RequireAuthorization();

using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<EuDuvidoDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();

public partial class Program;
