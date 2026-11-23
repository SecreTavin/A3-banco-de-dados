import { AbsoluteFill } from 'remotion';

// Mesmo grão do app (--grao no global.css): ruído fixo, quase invisível,
// que tira a cara de "slide" do fundo liso.
const ruido = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const Grao = () => (
  <AbsoluteFill style={{ backgroundImage: ruido, opacity: 0.05, mixBlendMode: 'multiply', pointerEvents: 'none' }} />
);
