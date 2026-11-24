import { AbsoluteFill, staticFile } from 'remotion';

// Mesmo grão do app (--grao no global.css): ruído fixo, quase invisível, que
// tira a cara de "slide" do fundo liso. É uma textura pronta (public/grao.png,
// preta com transparência de 0 a 1%), na intensidade medida do filtro antigo. O
// filtro SVG feTurbulence com mix-blend-mode era refeito a cada quadro e dobrava
// o tempo de render. Grão mais forte também engorda o MP4: ruído custa bitrate.
export const Grao = () => (
  <AbsoluteFill
    style={{ backgroundImage: `url(${staticFile('grao.png')})`, backgroundSize: '128px 128px', pointerEvents: 'none' }}
  />
);
