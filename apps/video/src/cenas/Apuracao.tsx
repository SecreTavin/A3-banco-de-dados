import { interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { Avatar, Cartao, Lado, Legenda, Palco, Surgir, useContagem, useMola } from '../ui';

const RANKING = s(5.8);
const REORDENA = RANKING + s(1.6);

// Números do roteiro da banca, passo 7 (conferidos no PostgreSQL em 16/11).
const pagamentos = [
  { nome: 'Tavin', motivo: 'PREMIO', ganho: 30, de: 80 },
  { nome: 'Theus', motivo: 'PREMIO + RECOMPENSA_VOTO', ganho: 32, de: 10 },
  { nome: 'Lari', motivo: 'RECOMPENSA_VOTO', ganho: 2, de: 100 },
  { nome: 'Biel', motivo: 'Duvidou e perdeu os 20 CP do escrow', ganho: 0, de: 85 },
];

// Ordem antes e depois da apuração; Tavin sobe de 4º para 1º.
const ranking = [
  { nome: 'Tavin', antes: 3, depois: 0, de: 80, para: 110 },
  { nome: 'Lari', antes: 0, depois: 1, de: 100, para: 102 },
  { nome: 'Biel', antes: 1, depois: 2, de: 85, para: 85 },
  { nome: 'Lipe', antes: 2, depois: 3, de: 85, para: 85 },
  { nome: 'Theus', antes: 4, depois: 4, de: 10, para: 42 },
];

const Pagamento = ({ nome, motivo, ganho, de, i }: (typeof pagamentos)[number] & { i: number }) => {
  const inicio = s(0.8) + i * s(0.5);
  const saldo = useContagem(de, de + ganho, inicio, s(1));
  return (
    <Surgir inicio={inicio}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0', borderBottom: `1px solid ${cor.borda}` }}>
        <Avatar nome={nome} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{nome}</div>
          <code style={{ fontSize: 18, color: cor.textoFraco }}>{motivo}</code>
        </div>
        <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 30, color: ganho ? cor.cumpriu : cor.textoFraco }}>{ganho ? `+${ganho}` : '—'}</span>
        <span style={{ width: 150, textAlign: 'right', fontFamily: fonteTitulo, fontWeight: 800, fontSize: 34, fontVariantNumeric: 'tabular-nums' }}>
          {saldo} CP
        </span>
      </div>
    </Surgir>
  );
};

const LinhaRanking = ({ nome, antes, depois, de, para }: (typeof ranking)[number]) => {
  const p = useMola(REORDENA, { damping: 16, stiffness: 90 });
  const saldo = useContagem(de, para, REORDENA, s(1));
  const y = interpolate(p, [0, 1], [antes, depois]) * 92;
  const lider = nome === 'Tavin';
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 20px',
        borderRadius: 14,
        background: lider ? cor.cpFraca : cor.superficie,
        border: `1px solid ${lider ? cor.cpFundo : cor.borda}`,
        zIndex: lider ? 2 : 1,
        transform: `scale(${lider ? 1 + Math.sin(p * Math.PI) * 0.04 : 1})`,
      }}
    >
      <span style={{ width: 40, fontFamily: fonteTitulo, fontWeight: 800, fontSize: 28, color: cor.textoFraco }}>
        {Math.round(interpolate(p, [0, 1], [antes, depois])) + 1}º
      </span>
      <Avatar nome={nome} tamanho={48} />
      <span style={{ flex: 1, fontSize: 28, fontWeight: 700 }}>{nome}</span>
      <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{saldo} CP</span>
    </div>
  );
};

// 12s: a procedure liquida o CP e o ranking reage.
export const Apuracao = () => {
  const frame = useCurrentFrame();
  const mostrarRanking = frame >= RANKING;
  return (
    <Palco>
      <Legenda
        passo="04 · APURAÇÃO"
        titulo="Uma transação. Paga tudo ou nada."
        apoio={<>A procedure <code>apurar_votacao</code> fecha o quórum e paga numa transação só. O aviso em tempo real sai depois do <code>COMMIT</code>.</>}
      />
      <Lado>
      <Cartao style={{ width: 860, minHeight: 600 }}>
        {!mostrarRanking ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 36 }}>Pagamento</div>
              <span style={{ fontSize: 22, color: cor.textoFraco }}>Pote de 60 CP · Tavin cumpriu</span>
            </div>
            {pagamentos.map((p, i) => <Pagamento key={p.nome} {...p} i={i} />)}
          </>
        ) : (
          <Surgir inicio={RANKING}>
            <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 36, marginBottom: 24 }}>Ranking · Os Inimigos do Fim</div>
            <div style={{ position: 'relative', height: 92 * 5 }}>
              {ranking.map((r) => <LinhaRanking key={r.nome} {...r} />)}
            </div>
          </Surgir>
        )}
      </Cartao>
      </Lado>
    </Palco>
  );
};
