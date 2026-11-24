import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, fonteMono, fonteTexto, fonteTitulo, s } from '../tema';
import { Surgir } from '../ui';

type Linha = { texto: string; inicio: number; tipo: 'cmd' | 'saida' | 'erro' | 'ok' };

// O que o SQL ao vivo e o psql mostram nos passos 7 e 10 do roteiro da banca.
const linhas: Linha[] = [
  { tipo: 'cmd', inicio: s(0.8), texto: 'BEGIN;' },
  { tipo: 'cmd', inicio: s(1.2), texto: "UPDATE jurado_evidencia SET voto = 'VALIDO' WHERE ...;" },
  { tipo: 'cmd', inicio: s(2.6), texto: 'CALL apurar_votacao(2);' },
  { tipo: 'cmd', inicio: s(3.5), texto: 'COMMIT;' },
  { tipo: 'cmd', inicio: s(4.8), texto: 'SELECT * FROM vw_reconciliacao_saldo;' },
  { tipo: 'ok', inicio: s(6.0), texto: '(0 linhas)' },
  { tipo: 'cmd', inicio: s(6.4), texto: 'SELECT * FROM vw_escrow_orfao;' },
  { tipo: 'ok', inicio: s(7.4), texto: '(0 linhas)' },
  { tipo: 'cmd', inicio: s(8.2), texto: 'UPDATE transacao_cp SET valor = 999 WHERE id_transacao = 1;' },
  { tipo: 'erro', inicio: s(10.0), texto: 'ERROR: transacao_cp e append-only: UPDATE nao e permitido. Lance um ESTORNO.' },
];

const destaques = [
  { inicio: s(3.6), titulo: 'Procedure transacional', texto: 'Quórum e pagamento no mesmo COMMIT.' },
  { inicio: s(7.5), titulo: 'Contabilidade que se audita', texto: 'Views de reconciliação sempre vazias.' },
  { inicio: s(10.2), titulo: 'Ledger append-only', texto: 'Nem o dono do banco altera um lançamento.' },
];

const LinhaTerminal = ({ texto, inicio, tipo }: Linha) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < inicio) return null;
  const n = tipo === 'cmd' ? Math.floor(((frame - inicio) / fps) * 55) : texto.length;
  const corLinha = { cmd: '#f3efe6', saida: cor.tintaSuave, ok: '#7fe0a3', erro: '#ff6b5b' }[tipo];
  return (
    <div style={{ color: corLinha, whiteSpace: 'pre' }}>
      {tipo === 'cmd' && <span style={{ color: '#8878ff' }}>euduvido=# </span>}
      {texto.slice(0, n)}
    </div>
  );
};

// 14s: a cena "desce" para baixo dos panos. É onde está a nota da disciplina.
export const Banco = () => (
  <AbsoluteFill style={{ background: cor.tinta, color: '#f3efe6', fontFamily: fonteTexto }}>
    <div style={{ position: 'absolute', left: 120, top: 110 }}>
      <Surgir>
        <div style={{ fontFamily: fonteTitulo, fontWeight: 600, fontSize: 26, color: '#bdb2ff', letterSpacing: 1 }}>05 · POR BAIXO DOS PANOS</div>
      </Surgir>
      <Surgir inicio={4}>
        <h1 style={{ margin: '14px 0 0', fontFamily: fonteTitulo, fontWeight: 800, fontSize: 72, letterSpacing: -2 }}>
          Quem garante as regras é o PostgreSQL.
        </h1>
      </Surgir>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 330,
        width: 1120,
        height: 560,
        padding: '28px 32px',
        borderRadius: 18,
        background: '#161331',
        border: '1px solid #272350',
        fontFamily: fonteMono,
        fontSize: 23,
        lineHeight: 1.75,
        overflow: 'hidden',
      }}
    >
      {linhas.map((l) => <LinhaTerminal key={l.texto} {...l} />)}
    </div>

    <div style={{ position: 'absolute', left: 1300, top: 330, width: 500, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {destaques.map((d) => (
        <Surgir key={d.titulo} inicio={d.inicio} distancia={24}>
          <div style={{ padding: '24px 28px', borderRadius: 16, background: '#1e1a3e', borderLeft: `6px solid ${cor.cpFundo}` }}>
            <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 30 }}>{d.titulo}</div>
            <div style={{ marginTop: 8, fontSize: 22, color: cor.tintaSuave }}>{d.texto}</div>
          </div>
        </Surgir>
      ))}
    </div>
  </AbsoluteFill>
);
