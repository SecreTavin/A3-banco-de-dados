using Dapper;
using ErrorOr;
using EuDuvido.Api.Shared.Auth;
using EuDuvido.Api.Shared.Database;

namespace EuDuvido.Api.Modules.Identidade.Features.EntrarComGoogle;

public record EntrarComGoogleRequest(string Credential);

public record UsuarioAutenticado(
    int IdUsuario, string Nome, string Apelido, string Email, string? AvatarUrl);

// Quem ja tem conta sai com o token de sessao. Quem nao tem sai com um token de
// cadastro, para informar apelido e data de nascimento no passo seguinte.
public record RespostaEntrada(
    string? Token = null,
    UsuarioAutenticado? Usuario = null,
    bool CadastroPendente = false,
    string? TokenCadastro = null,
    string? Nome = null,
    string? Email = null,
    string? AvatarUrl = null);

public static class AuthErrors
{
    public static Error GoogleInvalido =>
        Error.Unauthorized("Auth.GoogleInvalido", "Não foi possível confirmar o login com o Google. Tente de novo.");

    public static Error CadastroExpirado =>
        Error.Unauthorized("Auth.CadastroExpirado", "O tempo para completar o cadastro acabou. Entre com o Google de novo.");
}

// Leitura (Dapper): so procura a conta pelo e-mail que o Google confirmou.
public class EntrarComGoogleHandler(
    IValidadorGoogle validador, IConexaoLeitura leitura, TokenService tokens, AuthOptions auth)
{
    public async Task<ErrorOr<RespostaEntrada>> Handle(string credencial, CancellationToken ct)
    {
        var google = await validador.ValidarAsync(credencial, auth.GoogleClientId!, ct);
        if (google is null || !google.EmailVerificado)
            return AuthErrors.GoogleInvalido;

        var email = google.Email.Trim().ToLowerInvariant();

        using var conexao = await leitura.AbrirAsync(ct);
        var usuario = await conexao.QuerySingleOrDefaultAsync<UsuarioAutenticado>(
            """
            SELECT id_usuario AS IdUsuario, nome AS Nome, apelido AS Apelido,
                   email AS Email, avatar_url AS AvatarUrl
              FROM usuario WHERE lower(email) = @email
            """,
            new { email });

        if (usuario is not null)
            return new RespostaEntrada(
                Token: tokens.Gerar(usuario.IdUsuario, usuario.Apelido, usuario.Email),
                Usuario: usuario);

        var identidade = new IdentidadeCadastro(email, google.Nome, google.AvatarUrl);
        return new RespostaEntrada(
            CadastroPendente: true,
            TokenCadastro: tokens.GerarCadastro(identidade),
            Nome: identidade.Nome,
            Email: identidade.Email,
            AvatarUrl: identidade.AvatarUrl);
    }
}
