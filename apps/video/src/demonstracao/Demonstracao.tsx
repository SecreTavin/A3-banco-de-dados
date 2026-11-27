// Vídeo "Demonstracao": o ciclo real de um desafio na aplicação, em ritmo de
// tutorial, ligando cada passo ao objeto do banco que o garante. Passa entre os
// slides 18 e 19. Plano completo em DEMONSTRACAO.md; falas e marcos em cenas.ts.
import { springTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from 'remotion';
import { temArquivo } from '../arquivos';
import { Grao } from '../Grao';
import { cor, s } from '../tema';
import { CAPITULOS } from './capitulos';
import { Legendas, Progresso } from './Interface';
import { ATRASO_FALA, montarLinha, TRANSICAO, type Linha, type PropsDemonstracao } from './linha';

const apresentacao = { fade: fade(), slide: slide({ direction: 'from-right' }) };

/** Fala de cada capítulo: public/demonstracao/audio/NN-id.mp3, quando existir. */
const Falas = ({ linha }: { linha: Linha }) => (
  <>
    {linha.cenas.map((c) =>
      c.temAudio ? (
        <Sequence key={c.cena.id} from={c.inicio + ATRASO_FALA} layout="none">
          <Html5Audio src={staticFile(c.cena.arquivoAudio)} />
        </Sequence>
      ) : null,
    )}
  </>
);

const TRILHA = 0.08;
const TRILHA_NA_FALA = 0.03;
const RAMPA = s(0.3);

/**
 * Trilha opcional (public/trilha.mp3) a 8%, abaixando para 3% enquanto alguém
 * fala (ducking calculado por quadro a partir das janelas de fala com áudio).
 */
const Trilha = ({ linha }: { linha: Linha }) => {
  if (!temArquivo('trilha.mp3')) return null;
  const janelas = linha.cenas.filter((c) => c.temAudio).map((c) => [c.inicio + ATRASO_FALA, c.inicio + c.fimDaFala] as const);
  const volume = (f: number) => {
    const dentro = Math.max(
      0,
      ...janelas.map(([de, ate]) =>
        interpolate(f, [de - RAMPA, de, ate, ate + RAMPA], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      ),
    );
    const base = TRILHA - (TRILHA - TRILHA_NA_FALA) * dentro;
    const bordas = interpolate(f, [0, s(1), linha.duracao - s(2), linha.duracao], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return base * bordas;
  };
  return <Html5Audio src={staticFile('trilha.mp3')} loop volume={volume} />;
};

export const Demonstracao = ({ falas }: PropsDemonstracao) => {
  const linha = montarLinha(falas);
  return (
    <AbsoluteFill style={{ background: cor.fundo }}>
      <TransitionSeries>
        {linha.cenas.flatMap((c, i) => {
          const Capitulo = CAPITULOS[c.cena.id];
          const cena = (
            <TransitionSeries.Sequence key={c.cena.id} durationInFrames={c.duracao} name={c.cena.rotulo}>
              <Capitulo c={c} />
            </TransitionSeries.Sequence>
          );
          if (i === 0 || c.entrada === 'corte') return [cena];
          return [
            <TransitionSeries.Transition
              key={`${c.cena.id}-entrada`}
              presentation={apresentacao[c.entrada]}
              timing={springTiming({ durationInFrames: TRANSICAO, config: { damping: 200 } })}
            />,
            cena,
          ];
        })}
      </TransitionSeries>
      <Legendas linha={linha} />
      <Progresso linha={linha} />
      <Grao />
      <Falas linha={linha} />
      <Trilha linha={linha} />
    </AbsoluteFill>
  );
};
