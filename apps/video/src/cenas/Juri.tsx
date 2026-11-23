import { interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTitulo, s } from '../tema';
import { ProvaCorrida } from './ProvaCorrida';
import { Avatar, Botao, Cartao, Chip, Cursor, Lado, Legenda, Palco, useMola } from '../ui';

const CLIQUE_VALE = s(3.2);
const CLIQUE_CONFIRMA = s(4.6);
const CARIMBO = s(5.6);

const Jurado = ({ nome, voto }: { nome: string; voto: 'vale' | 'pendente' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24 }}>
    <Avatar nome={nome} tamanho={44} />
    <span style={{ flex: 1, fontWeight: 600 }}>{nome}</span>
    {voto === 'vale' ? <Chip cor={cor.cumpriu}>Vale</Chip> : <Chip cor={cor.textoFraco}>Aguardando</Chip>}
  </div>
);

// 12s: a Lari dá o voto que fecha o quórum. Carimbo do júri.
export const Juri = () => {
  const frame = useCurrentFrame();
  const votou = frame >= CLIQUE_CONFIRMA;
  const escolheu = frame >= CLIQUE_VALE;
  const barra = useMola(CLIQUE_CONFIRMA);
  const carimbo = useMola(CARIMBO, { damping: 11, stiffness: 220 });

  return (
    <Palco>
      <Legenda
        passo="03 · PROVAR E JULGAR"
        titulo="Os amigos viram júri."
        apoio="Desafiado e desafiante ficam de fora. O júri congela quando a prova chega, e o voto não volta atrás."
      />
      <Lado>
      <Cartao style={{ position: 'relative', width: 860, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Chip cor={cor.emVotacao}>● Em votação</Chip>
          <span style={{ fontSize: 22, color: cor.textoFraco }}>Prova de Tavin</span>
        </div>
        <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 40 }}>Correr 5 km abaixo de 25 minutos</div>
        <ProvaCorrida />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
            <span>Placar</span>
            <span>{votou ? 2 : 1} de 2 votos</span>
          </div>
          <div style={{ height: 14, borderRadius: 999, background: cor.superficieAlta, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${interpolate(barra, [0, 1], [50, 100])}%`, background: cor.cumpriu, borderRadius: 999 }} />
          </div>
        </div>

        <Jurado nome="Theus" voto="vale" />
        <Jurado nome="Lari" voto={votou ? 'vale' : 'pendente'} />

        <div style={{ display: 'flex', gap: 16 }}>
          <Botao cliqueEm={CLIQUE_VALE} secundario={!escolheu} style={escolheu ? { background: cor.cumpriu } : undefined}>
            ✓ Vale
          </Botao>
          <Botao secundario>✗ Não vale</Botao>
          <Botao cliqueEm={CLIQUE_CONFIRMA} style={{ marginLeft: 'auto', opacity: escolheu ? 1 : 0.4 }}>
            Confirmar voto
          </Botao>
        </div>

        {frame >= CARIMBO && (
          <div
            style={{
              position: 'absolute',
              right: -60,
              top: -70,
              width: 230,
              height: 230,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              border: `8px solid ${cor.cumpriu}`,
              background: `color-mix(in srgb, ${cor.cumpriu} 12%, white)`,
              color: cor.cumpriu,
              fontFamily: fonteTitulo,
              fontWeight: 800,
              fontSize: 64,
              opacity: carimbo,
              transform: `scale(${interpolate(carimbo, [0, 1], [1.8, 1])}) rotate(${interpolate(carimbo, [0, 1], [-18, -8])}deg)`,
            }}
          >
            VALE
          </div>
        )}
      </Cartao>
      </Lado>
      <Cursor
        pontos={[
          { f: s(1.4), x: 1500, y: 1000 },
          { f: s(3.1), x: 1000, y: 818 },
          { f: s(4.5), x: 1612, y: 818 },
          { f: s(6.5), x: 1700, y: 1040 },
        ]}
        cliques={[CLIQUE_VALE, CLIQUE_CONFIRMA]}
      />
    </Palco>
  );
};
