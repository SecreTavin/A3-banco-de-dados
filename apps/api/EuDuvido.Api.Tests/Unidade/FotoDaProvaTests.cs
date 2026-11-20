using EuDuvido.Api.Modules.Validacao.Features.EnviarFoto;
using FluentAssertions;

namespace EuDuvido.Api.Tests.Unidade;

// Foto da prova (ADR 0022): o tipo sai dos bytes, e o nome nao deixa escolher
// caminho no bucket.
public class FotoDaProvaTests
{
    [Fact(DisplayName = "JPEG, PNG e WebP sao reconhecidos pelos primeiros bytes")]
    public void ReconheceFormatos()
    {
        FotoDaProva.Identificar([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0]).Should().Be(("jpg", "image/jpeg"));
        FotoDaProva.Identificar([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0]).Should().Be(("png", "image/png"));
        FotoDaProva.Identificar("RIFF\0\0\0\0WEBPVP8 "u8).Should().Be(("webp", "image/webp"));
    }

    [Fact(DisplayName = "Texto, PDF e arquivo vazio sao recusados, mesmo com nome de imagem")]
    public void RecusaOutrosArquivos()
    {
        FotoDaProva.Identificar("<script>alert(1)</script>"u8).Should().BeNull();
        FotoDaProva.Identificar("%PDF-1.7\n"u8).Should().BeNull();
        FotoDaProva.Identificar([]).Should().BeNull();
        FotoDaProva.Identificar("RIFF\0\0\0\0WAVE"u8).Should().BeNull();
    }

    [Fact(DisplayName = "Nome gerado e um Guid com a extensao e passa na propria validacao")]
    public void NomeGerado()
    {
        var nome = FotoDaProva.NovoNome("png");

        nome.Should().MatchRegex(@"^[0-9a-f]{32}\.png$");
        FotoDaProva.NomeValido(nome).Should().BeTrue();
    }

    [Theory(DisplayName = "Nome com caminho, outra extensao ou maiusculas nao chega ao storage")]
    [InlineData("../segredo.png")]
    [InlineData("0123456789abcdef0123456789abcdef.svg")]
    [InlineData("0123456789ABCDEF0123456789ABCDEF.png")]
    [InlineData("0123456789abcdef0123456789abcdef.png/../x")]
    [InlineData("")]
    public void NomeInvalido(string nome) => FotoDaProva.NomeValido(nome).Should().BeFalse();
}
