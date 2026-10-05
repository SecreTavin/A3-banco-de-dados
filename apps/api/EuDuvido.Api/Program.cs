using System.Net.Http.Headers;
using System.Text;
using EuDuvido.Api.Modules.Apostas.Features;
using EuDuvido.Api.Modules.Apostas.Features.CriarAposta;
using EuDuvido.Api.Modules.Apostas.Infrastructure;
using EuDuvido.Api.Modules.Grupos.Features;
using EuDuvido.Api.Modules.Identidade.Features;
using EuDuvido.Api.Modules.Ranking.Features;
using EuDuvido.Api.Modules.Validacao.Features;
using EuDuvido.Api.Modules.Validacao.Features.EnviarEvidencia;
using EuDuvido.Api.Modules.Validacao.Features.RegistrarVoto;
using EuDuvido.Api.Modules.Validacao.Infrastructure;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Ia;
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

builder.Services.AddDbContext<EuDuvidoDbContext>(o =>
    o.UseNpgsql(conexao, npg => npg.EnableRetryOnFailure()));

builder.Services.AddSingleton<IConexaoLeitura>(new ConexaoLeitura(conexao));
builder.Services.AddScoped<IApuracao, Apuracao>();
builder.Services.AddScoped<RegistrarVotoHandler>();
builder.Services.AddScoped<EnviarEvidenciaHandler>();
builder.Services.AddScoped<CriarApostaHandler>();
builder.Services.AddHostedService<PrazosWorker>();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// IA de moderacao e de verificacao de prova (ADR 0015, ADR 0017). Sem Ia:BaseUrl
// a API sobe normalmente; so criar aposta e enviar evidencia respondem 503.
var ia = builder.Configuration.GetSection(IaOptions.Secao).Get<IaOptions>() ?? new IaOptions();
builder.Services.AddSingleton(ia);
builder.Services.AddHttpClient<IChatIa, ChatIa>(http =>
{
    http.Timeout = TimeSpan.FromSeconds(ia.TimeoutSegundos);
    // O ngrok gratuito pode responder com uma pagina de aviso no lugar da API;
    // este cabecalho a dispensa.
    http.DefaultRequestHeaders.Add("ngrok-skip-browser-warning", "true");
    if (!string.IsNullOrWhiteSpace(ia.ApiKey))
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ia.ApiKey);
});
builder.Services.AddHttpClient<IBaixadorDeImagem, BaixadorDeImagem>(http =>
        http.Timeout = TimeSpan.FromSeconds(20))
    .ConfigurePrimaryHttpMessageHandler(BaixadorDeImagem.CriarHandler);
builder.Services.AddScoped<IModeradorDesafio, ModeradorDesafio>();
builder.Services.AddScoped<IVerificadorEvidencia, VerificadorEvidencia>();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<TratadorIaIndisponivel>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsuarioAtual, UsuarioAtual>();

builder.Services.AddSignalR();
builder.Services.AddScoped<INotificadorVotacao, NotificadorVotacao>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = auth.Emissor,
            ValidAudience = auth.Audiencia,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(auth.Chave))
        };

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

app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/health", async (EuDuvidoDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new { status = "ok" })
        : Results.Problem("Banco indisponivel.", statusCode: 503));

app.MapAuthEndpoints();
app.MapGruposEndpoints();
app.MapApostasEndpoints();
app.MapValidacaoEndpoints();
app.MapRankingEndpoints();
app.MapHub<VotacaoHub>("/hubs/votacao");

using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<EuDuvidoDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();

public partial class Program;
