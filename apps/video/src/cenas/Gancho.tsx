import { interpolate } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { Avatar, Cartao, Chip, CP, Palco, useMola } from '../ui';

const PALAVRAS = ['Eu', 'duvido', 'que', 'você', 'corre', '5 km', 'em', 'menos', 'de', '25', 'minutos.'];

const Palavra = ({ texto, i }: { texto: string; i: number }) => {
  const p = useMola(i * 2, { damping: 14, stiffness: 180 });
  const forte = texto === 'duvido';
  return (
    <span
      style={{
        display: 'inline-block',
        marginRight: '0.25em',
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
        color: forte ? cor.primaria : cor.texto,
      }}
    >
      {texto}
    </span>
  );
};

// A virada: a fala do clipe de abertura aparece em tipografia cinética e vira
// um desafio registrado no app.
export const Gancho = () => {
  const subir = useMola(s(1.4), { damping: 22 });
  const cartao = useMola(s(1.8));

  return (
    <Palco>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
        }}
      >
        <p
          style={{
            margin: 0,
            maxWidth: 1500,
            textAlign: 'center',
            textWrap: 'balance',
            fontFamily: fonteTitulo,
            fontWeight: 800,
            fontSize: interpolate(subir, [0, 1], [104, 56]),
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {PALAVRAS.map((p, i) => <Palavra key={p} texto={p} i={i} />)}
        </p>

        <div style={{ opacity: cartao, transform: `scale(${interpolate(cartao, [0, 1], [0.9, 1])})`, height: cartao > 0.01 ? 'auto' : 0 }}>
          <Cartao style={{ width: 820, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip cor={cor.aberta}>● Aberto</Chip>
              <CP valor={20} />
            </div>
            <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 44 }}>Correr 5 km abaixo de 25 minutos</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: cor.textoSuave }}>
              <Avatar nome="Mario" tamanho={44} /> Mario duvidou do Arthur · Banca do A3
            </div>
          </Cartao>
        </div>
      </div>
    </Palco>
  );
};
