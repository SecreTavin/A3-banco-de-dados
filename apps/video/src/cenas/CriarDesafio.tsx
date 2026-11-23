import { useCurrentFrame } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { Botao, Cartao, Chip, Cursor, Lado, Legenda, Palco, Surgir, useDigitado } from '../ui';

const TROCA = s(5.2);

const Campo = ({ rotulo, valor, ativo = false }: { rotulo: string; valor: string; ativo?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span style={{ fontSize: 20, fontWeight: 700, color: cor.textoSuave }}>{rotulo}</span>
    <div
      style={{
        minHeight: 64,
        padding: '16px 20px',
        borderRadius: 12,
        border: `2px solid ${ativo ? cor.primaria : cor.borda}`,
        boxShadow: ativo ? `0 0 0 4px ${cor.primariaFraca}` : 'none',
        fontSize: 26,
        background: cor.superficie,
      }}
    >
      {valor}
    </div>
  </div>
);

const Proposta = ({ titulo, aposta, inicio, clique, resultado }: {
  titulo: string; aposta: number; inicio: number; clique: number; resultado: 'aprovada' | 'recusada';
}) => {
  const frame = useCurrentFrame();
  const digitado = useDigitado(titulo, inicio, 32);
  const pensando = frame >= clique + 4 && frame < clique + s(1.1);
  const respondeu = frame >= clique + s(1.1);

  return (
    <Cartao style={{ width: 860, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 34 }}>Novo desafio</div>
      <Campo rotulo="Título" valor={digitado} ativo={frame < clique} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 20 }}>
        <Campo rotulo="Grupo" valor="Os Inimigos do Fim" />
        <Campo rotulo="Aposta" valor={`${aposta} CP`} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, minHeight: 72 }}>
        <Botao cliqueEm={clique}>Enviar para a moderação</Botao>
        {pensando && <span style={{ fontSize: 24, color: cor.textoFraco }}>A IA está avaliando…</span>}
        {respondeu && resultado === 'aprovada' && (
          <Surgir inicio={clique + s(1.1)} distancia={12}>
            <Chip cor={cor.cumpriu} style={{ fontSize: 24 }}>✓ Aprovado · desafio criado</Chip>
          </Surgir>
        )}
      </div>
      {/* Espaço reservado: o cartão não muda de altura quando a recusa aparece. */}
      <div style={{ minHeight: 90 }}>
      {respondeu && resultado === 'recusada' && (
        <Surgir inicio={clique + s(1.1)} distancia={12}>
          <div
            style={{
              padding: '18px 22px',
              borderRadius: 12,
              background: `color-mix(in srgb, ${cor.perdeu} 10%, white)`,
              border: `1px solid color-mix(in srgb, ${cor.perdeu} 35%, white)`,
              color: cor.perdeu,
              fontSize: 24,
            }}
          >
            <strong>Não passou no filtro.</strong> Envolve consumo excessivo de álcool, risco à saúde.
          </div>
        </Surgir>
      )}
      </div>
    </Cartao>
  );
};

// 10s: o desafio do Tavin passa; uma proposta perigosa não. As duas ficam gravadas.
export const CriarDesafio = () => {
  const frame = useCurrentFrame();
  return (
    <Palco>
      <Legenda
        passo="01 · CRIAR"
        titulo="Todo desafio passa por um filtro de IA."
        apoio={<>Aprovada ou recusada, a proposta fica gravada em <code>moderacao_desafio</code>.</>}
      />
      <Lado>
        {frame < TROCA ? (
          <Proposta titulo="Correr 5 km abaixo de 25 minutos" aposta={20} inicio={s(0.4)} clique={s(2.4)} resultado="aprovada" />
        ) : (
          <Surgir inicio={TROCA}>
            <Proposta titulo="Beber uma garrafa de vodka em 10 minutos" aposta={10} inicio={TROCA + s(0.3)} clique={TROCA + s(1.9)} resultado="recusada" />
          </Surgir>
        )}
      </Lado>
      <Cursor
        pontos={[
          { f: s(1.2), x: 1500, y: 900 },
          { f: s(2.3), x: 1080, y: 690 },
          { f: TROCA, x: 1080, y: 690 },
          { f: TROCA + s(1), x: 1300, y: 860 },
          { f: TROCA + s(1.8), x: 1080, y: 690 },
        ]}
        cliques={[s(2.4), TROCA + s(1.9)]}
      />
    </Palco>
  );
};
