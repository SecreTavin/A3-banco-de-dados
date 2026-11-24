import { interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { Avatar, Cartao, Chip, contagem, CP, Lado, Legenda, Palco, useMola } from '../ui';

// Os papéis e a ordem do roteiro da banca (passo 5): o apostador entra primeiro,
// porque, com desafiado e desafiante dentro, o desafio deixa de estar aberto.
const participantes = [
  { nome: 'Luís', papel: 'Apostador · vai cumprir', inicio: s(1.2) },
  { nome: 'Arthur', papel: 'Desafiado · vai cumprir', inicio: s(2.6) },
  { nome: 'Mario', papel: 'Desafiante · não vai cumprir', inicio: s(4.0) },
];
const POTE = { x: 620, y: 470 };

const Participante = ({ nome, papel, inicio }: (typeof participantes)[number]) => {
  const entrou = useMola(inicio);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: 0.4 + entrou * 0.6 }}>
      <Avatar nome={nome} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{nome}</div>
        <div style={{ fontSize: 20, color: cor.textoFraco }}>{papel}</div>
      </div>
      <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 32, color: cor.perdeu, opacity: entrou }}>−20 CP</span>
    </div>
  );
};

/** Moeda que sai da linha do participante e cai no pote. */
const Moeda = ({ inicio, y }: { inicio: number; y: number }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicio, inicio + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (t === 0 || t === 1) return null;
  const x = interpolate(t, [0, 1], [720, POTE.x]);
  const yy = interpolate(t, [0, 1], [y, POTE.y]) - Math.sin(t * Math.PI) * 100;
  return <div style={{ position: 'absolute', left: x, top: yy, width: 40, height: 40, borderRadius: '50%', background: cor.cpFundo, border: '3px solid #e0a92e' }} />;
};

// 9s: os três entram, o CP sai do saldo e fica retido no desafio.
export const Escrow = () => {
  const frame = useCurrentFrame();
  const pote = participantes.reduce((total, p) => total + contagem(frame, 0, 20, p.inicio, s(0.8)), 0);
  const andamento = frame >= participantes[2].inicio + s(0.9);
  return (
    <Palco>
      <Legenda
        passo="02 · APOSTAR"
        titulo="Ninguém dá calote."
        apoio={<>Quem entra tem o CP retido na hora, pela procedure <code>debitar_escrow</code>. Ele só sai com o resultado.</>}
      />
      <Lado>
        <Cartao style={{ position: 'relative', width: 860, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {andamento ? <Chip cor={cor.emAndamento}>● Em andamento</Chip> : <Chip cor={cor.aberta}>● Aberto</Chip>}
            <CP valor={20} />
          </div>
          <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 40 }}>Correr 5 km abaixo de 25 minutos</div>
          {participantes.map((p) => <Participante key={p.nome} {...p} />)}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderRadius: 14,
              border: `2px dashed color-mix(in srgb, ${cor.cp} 50%, transparent)`,
              background: cor.cpFraca,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 700 }}>🔒 Retido no desafio</span>
            <CP valor={pote} grande />
          </div>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {participantes.flatMap((p, i) => [0, 3, 6].map((d) => <Moeda key={`${p.nome}${d}`} inicio={p.inicio + d} y={190 + i * 88} />))}
          </div>
        </Cartao>
      </Lado>
    </Palco>
  );
};
