# Vídeo de demonstração

Vídeo de ~81s do Eu Duvido!, escrito em React com [Remotion](https://www.remotion.dev/)
e renderizado para MP4 (1920x1080, 30 fps). As cenas reconstroem as telas do app
com os tokens de `apps/web/src/estilos/global.css`. A história usa os
integrantes do grupo e os valores do
[roteiro da banca](../../docs/06-encerramento/roteiro-da-demonstracao.md).

| Comando | O que faz |
| --- | --- |
| `npm ci` | Instala as dependências (o primeiro render baixa o Chrome headless) |
| `npm run studio` | Abre o editor no navegador, com linha do tempo |
| `npm run render` | Gera `out/demo.mp4` |
| `npm run still -- --frame=1260` | Gera um quadro em `out/quadro.png` |
| `npm run tipos` | Confere os tipos com o TypeScript |
| `npm run narrar` | Refaz a narração com a voz sintética do macOS, a partir de `narracao.json` |

Cada cena é um arquivo em `src/cenas/`. A ordem e a duração ficam em
`src/Demo.tsx`. O roteiro, a narração e os clipes filmados estão em
[ROTEIRO.md](ROTEIRO.md).

**Arquivos em `public/`:** a narração (`narracao/<id>.mp3`) já está gerada. Os
clipes (`clipes/<id>.mp4`) e a trilha (`trilha.mp3`) são opcionais: o vídeo
renderiza sem eles e usa cada um assim que aparece. Um clipe que ainda não existe
sai do vídeo (63 s sem os três, 81 s com eles). Para editar com o tempo final, use
a claquete no lugar: `npm run render -- --props='{"claquetes":true}'`, ou ligue
`claquetes` no painel de props do Studio.

**Versão da banca:** o MP4 e a página datada ficam em
[`docs/06-encerramento/video-de-demonstracao.md`](../../docs/06-encerramento/video-de-demonstracao.md).
Depois de um render novo, atualize os dois.

**Desempenho do render:** o grão do fundo é a textura `public/grao.png`, e a barra
de capítulos não usa `backdrop-filter`. Com as duas trocas, o render completo
caiu de 180 s para 63 s numa máquina de 8 núcleos, com o mesmo visual. Antes de
voltar a usar filtro SVG, `mix-blend-mode` ou desfoque em camada de tela cheia,
meça o render. Grão mais forte também aumenta o MP4, porque ruído custa bitrate.
