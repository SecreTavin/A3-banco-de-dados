# Vídeo de demonstração

Vídeo de ~81s do Eu Duvido!, escrito em React com [Remotion](https://www.remotion.dev/)
e renderizado para MP4. As cenas reconstroem as telas do app com os tokens de
`apps/web/src/estilos/global.css` e os números do
[roteiro da banca](../../docs/06-encerramento/roteiro-da-demonstracao.md).

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências (o primeiro render baixa o Chrome headless) |
| `npm run studio` | Abre o editor no navegador, com linha do tempo |
| `npm run render` | Gera `out/demo.mp4` |

Cada cena é um arquivo em `src/cenas/`. A ordem e a duração ficam em
`src/Demo.tsx`. O roteiro, a narração e os prompts dos clipes filmados estão em
[ROTEIRO.md](ROTEIRO.md). Os clipes vão em `public/clipes/`; enquanto não
existem, o vídeo mostra uma claquete no lugar.
