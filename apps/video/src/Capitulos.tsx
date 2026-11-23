import { interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTexto } from './tema';

export type Capitulo = { rotulo: string; inicio: number; fim: number };

/** Barra de capítulos no rodapé: mostra em que parte do ciclo do desafio estamos. */
export const Capitulos = ({ capitulos }: { capitulos: Capitulo[] }) => {
  const frame = useCurrentFrame();
  // Some durante os clipes filmados, que ficam entre os capítulos.
  const visivel = Math.max(
    ...capitulos.map((c) =>
      interpolate(frame, [c.inicio, c.inicio + 10, c.fim - 10, c.fim], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 48,
        transform: `translateX(-50%) translateY(${(1 - visivel) * 20}px)`,
        opacity: visivel,
        display: 'flex',
        gap: 10,
        padding: 8,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 6px 24px rgba(23,19,54,0.12)',
        fontFamily: fonteTexto,
      }}
    >
      {capitulos.map((c) => {
        const progresso = interpolate(frame, [c.inicio, c.fim], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const ativo = frame >= c.inicio && frame < c.fim;
        return (
          <div
            key={c.rotulo}
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '10px 22px',
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
              color: ativo ? cor.primaria : progresso === 1 ? cor.textoSuave : cor.textoFraco,
              background: ativo ? cor.primariaFraca : 'transparent',
            }}
          >
            {ativo && (
              <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${progresso * 100}%`, background: cor.primaria }} />
            )}
            {c.rotulo}
          </div>
        );
      })}
    </div>
  );
};
