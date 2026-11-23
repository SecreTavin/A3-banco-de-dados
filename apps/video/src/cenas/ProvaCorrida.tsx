import { interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';

// Rota fictícia: uma volta no parque, desenhada aos poucos.
const ROTA = 'M40 150 C 90 40, 200 30, 260 90 S 380 170, 440 80 S 560 20, 600 120 S 520 190, 420 175 S 220 200, 120 185 Z';

/** "Print" do app de corrida que o Tavin mandou como prova. */
export const ProvaCorrida = () => {
  const frame = useCurrentFrame();
  const desenho = interpolate(frame, [s(0.3), s(2.5)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stat = (rotulo: string, valor: string) => (
    <div>
      <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 34, color: '#f3efe6' }}>{valor}</div>
      <div style={{ fontSize: 16, color: cor.tintaSuave, letterSpacing: 1 }}>{rotulo}</div>
    </div>
  );
  return (
    <div
      style={{
        height: 210,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 230px',
        background: cor.tinta,
      }}
    >
      <svg viewBox="0 0 640 220" style={{ width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grade" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0 L0 0 0 32" fill="none" stroke="#272350" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="640" height="220" fill="url(#grade)" />
        <path d={ROTA} fill="none" stroke="#f6c453" strokeWidth="7" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={desenho} />
        <circle cx="40" cy="150" r="9" fill="#4ad07a" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 22px', borderLeft: '1px solid #272350' }}>
        {stat('DISTÂNCIA', '5,02 km')}
        {stat('TEMPO', '24:31')}
        {stat('RITMO', "4'53\"/km")}
      </div>
    </div>
  );
};
