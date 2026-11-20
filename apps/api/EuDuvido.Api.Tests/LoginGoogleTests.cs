using Dapper;
using EuDuvido.Api.Modules.Identidade.Features.CompletarCadastro;
using EuDuvido.Api.Modules.Identidade.Features.EntrarComGoogle;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;
using EuDuvido.Api.Shared.Results;
using FluentAssertions;
using Npgsql;

namespace EuDuvido.Api.Tests;

// Login com Google (RN05, ADR 0021) contra o PostgreSQL real. O Google e um
// validador falso: a assinatura do ID token e responsabilidade da biblioteca
// Google.Apis.Auth; aqui o que importa e o que a API faz com a identidade.
public class LoginGoogleTests(BancoDeTeste banco) : IClassFixture<BancoDeTeste>
{
    private const string ClientId = "cliente-de-teste.apps.googleusercontent.com";

    private sealed class GoogleFalso(IdentidadeGoogle? identidade) : IValidadorGoogle
    {
        public string? ClientIdRecebido { get; private set; }

        public Task<IdentidadeGoogle?> ValidarAsync(string credencial, string clientId, CancellationToken ct)
        {
            ClientIdRecebido = clientId;
            return Task.FromResult(identidade);
        }
    }

    private static readonly AuthOptions Opcoes = new()
    {
        Chave = "chave-de-teste-com-mais-de-32-caracteres!!",
        GoogleClientId = ClientId
    };

    private static readonly TokenService Tokens = new(Opcoes);

    private static string EmailNovo() => $"pessoa{Guid.NewGuid():N}@gmail.com";

    private EntrarComGoogleHandler Entrar(IdentidadeGoogle? identidade) =>
        new(new GoogleFalso(identidade), new ConexaoLeitura(banco.ConnectionString), Tokens, Opcoes);

    private CompletarCadastroHandler Cadastrar() => new(banco.CriarContexto(), Tokens);

    private static DateOnly Idade(int anos) => DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-anos);

    private async Task<int> UsuariosAsync()
    {
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        return await c.QuerySingleAsync<int>("SELECT count(*) FROM usuario");
    }

    private async Task<string> TokenCadastroAsync(string email, string nome = "Pessoa Nova")
    {
        var entrada = await Entrar(new IdentidadeGoogle(email, nome, "https://foto/x.png", true)).Handle("id-token", default);
        return entrada.Value.TokenCadastro!;
    }

    [Fact(DisplayName = "E-mail novo no Google pede para completar o cadastro, sem gravar nada")]
    public async Task EmailNovoPedeCadastro()
    {
        var antes = await UsuariosAsync();
        var email = EmailNovo();

        var resultado = await Entrar(new IdentidadeGoogle(email, "Pessoa Nova", null, true)).Handle("id-token", default);

        resultado.IsError.Should().BeFalse();
        resultado.Value.CadastroPendente.Should().BeTrue();
        resultado.Value.Token.Should().BeNull();
        Tokens.LerCadastro(resultado.Value.TokenCadastro!)!.Email.Should().Be(email);
        (await UsuariosAsync()).Should().Be(antes);
    }

    [Fact(DisplayName = "Conta existente entra direto, mesmo com o e-mail em outra caixa")]
    public async Task ContaExistenteEntra()
    {
        var email = EmailNovo();
        var cadastro = await Cadastrar().Handle(
            new CompletarCadastroCommand(await TokenCadastroAsync(email), "Tavin", Idade(20)), default);
        cadastro.IsError.Should().BeFalse();

        var resultado = await Entrar(new IdentidadeGoogle(email.ToUpperInvariant(), "Tavin", null, true))
            .Handle("id-token", default);

        resultado.Value.CadastroPendente.Should().BeFalse();
        resultado.Value.Usuario!.IdUsuario.Should().Be(cadastro.Value.Usuario!.IdUsuario);
        resultado.Value.Token.Should().NotBeNullOrEmpty();
    }

    [Fact(DisplayName = "Token do Google invalido ou de outro app e recusado com 401")]
    public async Task GoogleInvalido()
    {
        var google = new GoogleFalso(null);
        var handler = new EntrarComGoogleHandler(google, new ConexaoLeitura(banco.ConnectionString), Tokens, Opcoes);

        var resultado = await handler.Handle("lixo", default);

        resultado.FirstError.Code.Should().Be("Auth.GoogleInvalido");
        resultado.FirstError.Type.Should().Be(ErrorOr.ErrorType.Unauthorized);
        google.ClientIdRecebido.Should().Be(ClientId);
    }

    [Fact(DisplayName = "Conta Google com e-mail nao verificado e recusada")]
    public async Task EmailNaoVerificado()
    {
        var resultado = await Entrar(new IdentidadeGoogle(EmailNovo(), "X", null, EmailVerificado: false))
            .Handle("id-token", default);

        resultado.FirstError.Code.Should().Be("Auth.GoogleInvalido");
    }

    [Fact(DisplayName = "Completar o cadastro grava nome, e-mail e foto do Google e ja entra")]
    public async Task CadastroGrava()
    {
        var email = EmailNovo();

        var resultado = await Cadastrar().Handle(
            new CompletarCadastroCommand(await TokenCadastroAsync(email, "Ana Souza"), "  Aninha  ", Idade(20)), default);

        resultado.IsError.Should().BeFalse();
        resultado.Value.Token.Should().NotBeNullOrEmpty();
        await using var c = new NpgsqlConnection(banco.ConnectionString);
        var gravado = await c.QuerySingleAsync<(string Nome, string Apelido, string Avatar)>(
            "SELECT nome, apelido, avatar_url FROM usuario WHERE email = @email", new { email });
        gravado.Should().Be(("Ana Souza", "Aninha", "https://foto/x.png"));
    }

    [Fact(DisplayName = "Menor de 16 anos e recusado com 422 e nada e gravado (RN26)")]
    public async Task MenorDeIdade()
    {
        var antes = await UsuariosAsync();

        var resultado = await Cadastrar().Handle(
            new CompletarCadastroCommand(await TokenCadastroAsync(EmailNovo()), "Menor", Idade(12)), default);

        resultado.FirstError.Code.Should().Be("Usuario.IdadeMinima");
        resultado.FirstError.NumericType.Should().Be(TipoErro.Recusado);
        (await UsuariosAsync()).Should().Be(antes);
    }

    [Fact(DisplayName = "Apelido repetido e aceito: quem identifica o usuario e o id")]
    public async Task ApelidoRepetido()
    {
        var primeiro = await Cadastrar().Handle(
            new CompletarCadastroCommand(await TokenCadastroAsync(EmailNovo()), "Gemeo", Idade(20)), default);
        var segundo = await Cadastrar().Handle(
            new CompletarCadastroCommand(await TokenCadastroAsync(EmailNovo()), "Gemeo", Idade(20)), default);

        segundo.IsError.Should().BeFalse();
        segundo.Value.Usuario!.IdUsuario.Should().NotBe(primeiro.Value.Usuario!.IdUsuario);
    }

    [Fact(DisplayName = "Completar o cadastro duas vezes com o mesmo e-mail da 409")]
    public async Task EmailEmUso()
    {
        var token = await TokenCadastroAsync(EmailNovo());
        await Cadastrar().Handle(new CompletarCadastroCommand(token, "Um", Idade(20)), default);

        var resultado = await Cadastrar().Handle(new CompletarCadastroCommand(token, "Dois", Idade(20)), default);

        resultado.FirstError.Code.Should().Be("Usuario.EmailEmUso");
    }

    [Fact(DisplayName = "Token de cadastro invalido da 401 e nada e gravado")]
    public async Task CadastroExpirado()
    {
        var antes = await UsuariosAsync();

        var resultado = await Cadastrar().Handle(new CompletarCadastroCommand("vencido", "X", Idade(20)), default);

        resultado.FirstError.Code.Should().Be("Auth.CadastroExpirado");
        (await UsuariosAsync()).Should().Be(antes);
    }
}
