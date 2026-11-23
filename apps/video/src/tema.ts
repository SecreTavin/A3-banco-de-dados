// Tokens copiados de apps/web/src/estilos/global.css (tema claro). O vídeo usa
// a mesma identidade do app: papel claro, tinta índigo e dourado só para o CP.
import { loadFont as carregarBricolage } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as carregarFigtree } from '@remotion/google-fonts/Figtree';
import { loadFont as carregarMono } from '@remotion/google-fonts/JetBrainsMono';

export const fonteTitulo = carregarBricolage('normal', { weights: ['600', '800'], subsets: ['latin'] }).fontFamily;
export const fonteTexto = carregarFigtree('normal', { weights: ['400', '500', '700'], subsets: ['latin'] }).fontFamily;
export const fonteMono = carregarMono('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily;

export const cor = {
  fundo: '#f5f2ea',
  superficie: '#ffffff',
  superficieAlta: '#efebe1',
  borda: '#e3ded2',
  texto: '#171336',
  textoSuave: '#4b4769',
  textoFraco: '#7a7694',
  primaria: '#4433cc',
  primariaFraca: 'rgba(68, 51, 204, 0.1)',
  cp: '#8a5a00',
  cpFundo: '#f6c453',
  cpFraca: 'rgba(246, 196, 83, 0.26)',
  aberta: '#2a55d4',
  emAndamento: '#b35a00',
  emVotacao: '#7a2bb5',
  cumpriu: '#1f7a3e',
  perdeu: '#c2301e',
  // terminal das cenas de banco
  tinta: '#0d0b1c',
  tintaSuave: '#b5b1cb',
} as const;

export const sombra = '0 16px 40px rgba(23, 19, 54, 0.14), 0 2px 6px rgba(23, 19, 54, 0.06)';

export const FPS = 30;
export const s = (segundos: number) => Math.round(segundos * FPS);
