import { interpolate } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { Palco, Surgir, useMola } from '../ui';

// 6s: marca, frase de fechamento do roteiro e onde acessar.
export const Fim = () => {
  const exclamacao = useMola(s(0.5), { damping: 9, stiffness: 200 });
  return (
    <Palco>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <Surgir>
          <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 180, letterSpacing: -6, color: cor.texto }}>
            Eu Duvido
            <span style={{ display: 'inline-block', color: cor.primaria, transform: `rotate(${interpolate(exclamacao, [0, 1], [-30, 8])}deg) scale(${exclamacao})` }}>!</span>
          </div>
        </Surgir>
        <Surgir inicio={s(1)}>
          <p style={{ margin: 0, fontSize: 38, color: cor.textoSuave, textAlign: 'center' }}>
            A aplicação pode errar. O banco não deixa o erro virar dado.
          </p>
        </Surgir>
        <Surgir inicio={s(1.8)}>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 40 }}>Duvida?</span>
          <div style={{ padding: '16px 34px', borderRadius: 999, background: cor.primaria, color: '#fff', fontSize: 32, fontWeight: 700 }}>
            euduvido.falveshub.com
          </div>
          </div>
        </Surgir>
        <Surgir inicio={s(2.4)}>
          <div style={{ fontSize: 22, color: cor.textoFraco }}>Projeto A3 · Banco de Dados · UNA</div>
        </Surgir>
      </div>
    </Palco>
  );
};
