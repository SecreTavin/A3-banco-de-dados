import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, fonteTexto, fonteTitulo, sombra } from './tema';

/** Mola padrão do vídeo: entra rápido e assenta sem quicar demais. */
export const useMola = (inicio: number, config: { damping?: number; stiffness?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - inicio, fps, config: { damping: 18, stiffness: 140, ...config } });
};

/** Entrada de baixo para cima, com fade. */
export const Surgir = ({ inicio = 0, distancia = 40, children, style }: {
  inicio?: number; distancia?: number; children: ReactNode; style?: CSSProperties;
}) => {
  const p = useMola(inicio);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * distancia}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Texto que vai sendo digitado a partir de `inicio`. */
export const useDigitado = (texto: string, inicio: number, porSegundo = 28) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - inicio) / fps) * porSegundo));
  return texto.slice(0, n);
};

/** Valor de um número que rola de `de` para `para`, no quadro `frame`. */
export const contagem = (frame: number, de: number, para: number, inicio: number, duracao: number) =>
  Math.round(
    interpolate(frame, [inicio, inicio + duracao], [de, para], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

/** Número que rola de `de` para `para`. */
export const useContagem = (de: number, para: number, inicio: number, duracao: number) =>
  contagem(useCurrentFrame(), de, para, inicio, duracao);

export const Palco = ({ children }: { children: ReactNode }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1200px 700px at 78% 30%, ${cor.primariaFraca}, transparent 70%), ${cor.fundo}`,
      fontFamily: fonteTexto,
      color: cor.texto,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Legenda da cena: número do passo, título grande e uma linha de apoio. */
export const Legenda = ({ passo, titulo, apoio, style }: {
  passo: string; titulo: ReactNode; apoio?: ReactNode; style?: CSSProperties;
}) => (
  <div style={{ position: 'absolute', left: 120, top: 0, bottom: 0, width: 640, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...style }}>
    <Surgir>
      <div style={{ fontFamily: fonteTitulo, fontWeight: 600, fontSize: 26, color: cor.primaria, letterSpacing: 1 }}>
        {passo}
      </div>
    </Surgir>
    <Surgir inicio={4}>
      <h1 style={{ margin: '18px 0 0', fontFamily: fonteTitulo, fontWeight: 800, fontSize: 78, lineHeight: 1.02, letterSpacing: -2 }}>
        {titulo}
      </h1>
    </Surgir>
    {apoio && (
      <Surgir inicio={10}>
        <p style={{ margin: '28px 0 0', fontSize: 30, lineHeight: 1.4, color: cor.textoSuave }}>{apoio}</p>
      </Surgir>
    )}
  </div>
);

/** Coluna da direita, centralizada na vertical, onde fica a "tela" do app. */
export const Lado = ({ children }: { children: ReactNode }) => (
  <div style={{ position: 'absolute', left: 900, top: 0, bottom: 0, width: 860, display: 'flex', alignItems: 'center' }}>
    {children}
  </div>
);

export const Cartao = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: cor.superficie,
      border: `1px solid ${cor.borda}`,
      borderRadius: 22,
      boxShadow: sombra,
      padding: 32,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip = ({ cor: tom, children, style }: { cor: string; children: ReactNode; style?: CSSProperties }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      borderRadius: 999,
      fontSize: 20,
      fontWeight: 700,
      color: tom,
      background: `color-mix(in srgb, ${tom} 12%, transparent)`,
      ...style,
    }}
  >
    {children}
  </span>
);

export const CP = ({ valor, grande = false }: { valor: ReactNode; grande?: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: grande ? '10px 22px' : '6px 14px',
      borderRadius: 999,
      background: cor.cpFundo,
      color: '#2a1b00',
      fontFamily: fonteTitulo,
      fontWeight: 800,
      fontSize: grande ? 40 : 22,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {valor} CP
  </span>
);

export const Avatar = ({ nome, tom = cor.primaria, tamanho = 56 }: { nome: string; tom?: string; tamanho?: number }) => (
  <span
    style={{
      display: 'grid',
      placeItems: 'center',
      width: tamanho,
      height: tamanho,
      flex: 'none',
      borderRadius: '50%',
      background: `color-mix(in srgb, ${tom} 16%, white)`,
      color: tom,
      fontFamily: fonteTitulo,
      fontWeight: 800,
      fontSize: tamanho * 0.42,
    }}
  >
    {nome[0]}
  </span>
);

/** Botão com "clique": afunda quando o cursor chega. */
export const Botao = ({ children, cliqueEm, secundario = false, style }: {
  children: ReactNode; cliqueEm?: number; secundario?: boolean; style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const apertado = cliqueEm !== undefined && frame >= cliqueEm && frame < cliqueEm + 5;
  return (
    <div
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        padding: '18px 30px',
        borderRadius: 14,
        fontSize: 24,
        fontWeight: 700,
        background: secundario ? cor.superficie : cor.primaria,
        color: secundario ? cor.texto : '#fff',
        border: secundario ? `1px solid ${cor.borda}` : 'none',
        transform: `scale(${apertado ? 0.96 : 1})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Cursor falso. `pontos` são paradas no tempo; entre elas o cursor desliza com
 * easing. `cliques` são frames em que ele pulsa.
 */
export const Cursor = ({ pontos, cliques = [] }: {
  pontos: { f: number; x: number; y: number }[]; cliques?: number[];
}) => {
  const frame = useCurrentFrame();
  const fs = pontos.map((p) => p.f);
  const opcoes = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) } as const;
  const x = interpolate(frame, fs, pontos.map((p) => p.x), opcoes);
  const y = interpolate(frame, fs, pontos.map((p) => p.y), opcoes);
  const visivel = interpolate(frame, [pontos[0].f, pontos[0].f + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const clique = cliques.find((c) => frame >= c && frame < c + 12);
  const onda = clique === undefined ? 0 : (frame - clique) / 12;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: visivel, pointerEvents: 'none', zIndex: 10 }}>
      {clique !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: -30 * onda - 4,
            top: -30 * onda - 4,
            width: 60 * onda + 8,
            height: 60 * onda + 8,
            borderRadius: '50%',
            border: `3px solid ${cor.primaria}`,
            opacity: 1 - onda,
          }}
        />
      )}
      <svg width="34" height="40" viewBox="0 0 17 20" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' }}>
        <path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill={cor.texto} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
