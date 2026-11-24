import { springTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import type { ComponentType } from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile } from 'remotion';
import { temArquivo } from './arquivos';
import { Capitulos, type Capitulo } from './Capitulos';
import { Grao } from './Grao';
import { Apuracao } from './cenas/Apuracao';
import { Banco } from './cenas/Banco';
import { Clipe, type DadosClipe } from './cenas/Clipe';
import { CriarDesafio } from './cenas/CriarDesafio';
import { Escrow } from './cenas/Escrow';
import { Fim } from './cenas/Fim';
import { Gancho } from './cenas/Gancho';
import { Juri } from './cenas/Juri';
import { cor, s } from './tema';

// Os três trechos filmados. O roteiro completo e os prompts estão em ROTEIRO.md.
const clipe = (dados: DadosClipe): ComponentType => () => <Clipe {...dados} />;

const Abertura = clipe({
  arquivo: 'abertura.mp4',
  titulo: 'Abertura: o “eu duvido”',
  descricao: 'Mario e Arthur no pátio da faculdade. Mario provoca, Arthur aceita.',
  falas: ['Mario: “Tu? Correr 5 km em menos de 25 minutos? Eu duvido.”', 'Arthur: “Duvida? Então valendo.”'],
});
const Corrida = clipe({
  arquivo: 'corrida.mp4',
  titulo: 'A corrida',
  descricao: 'Arthur correndo no parque no fim da tarde. Olha o relógio, acelera. Sem fala.',
});
const Reacao = clipe({
  arquivo: 'reacao.mp4',
  titulo: 'O troco',
  descricao: 'Mario recebe a notificação no celular, incrédulo. Arthur aparece por trás.',
  falas: ['Mario: “Não acredito…”', 'Arthur: “Paga.”'],
});

type Entrada = 'corte' | 'fade' | 'lado' | 'baixo';
type Cena = { id: string; Componente: ComponentType; duracao: number; entrada: Entrada; clipe?: string };

// ~81s com os clipes. Uma história só, com os papéis e os valores do roteiro da
// banca: o Mario duvida do Arthur, e o Luís aposta a favor.
const todasAsCenas: Cena[] = [
  { id: 'abertura', Componente: Abertura, duracao: s(8), entrada: 'corte', clipe: 'abertura.mp4' },
  { id: 'virada', Componente: Gancho, duracao: s(4), entrada: 'corte' },
  { id: 'criar', Componente: CriarDesafio, duracao: s(10), entrada: 'lado' },
  { id: 'escrow', Componente: Escrow, duracao: s(9), entrada: 'lado' },
  { id: 'corrida', Componente: Corrida, duracao: s(6), entrada: 'fade', clipe: 'corrida.mp4' },
  { id: 'juri', Componente: Juri, duracao: s(12), entrada: 'fade' },
  { id: 'apuracao', Componente: Apuracao, duracao: s(12), entrada: 'lado' },
  { id: 'reacao', Componente: Reacao, duracao: s(5), entrada: 'fade', clipe: 'reacao.mp4' },
  { id: 'banco', Componente: Banco, duracao: s(14), entrada: 'baixo' },
  { id: 'fim', Componente: Fim, duracao: s(6), entrada: 'fade' },
];

const TRANSICAO = s(0.6);
const sobreposicao = (e: Entrada) => (e === 'corte' ? 0 : TRANSICAO);
const rotulos: Record<string, string> = { criar: 'Criar', escrow: 'Apostar', juri: 'Julgar', apuracao: 'Apurar', banco: 'Banco' };

export type PropsDemo = { claquetes: boolean };

/**
 * Monta a linha do tempo. Um clipe filmado que ainda não está em public/clipes/
 * sai do vídeo, que fica mais curto, para a banca não ver "CLIPE PENDENTE".
 * Com `claquetes: true` (no Studio, ou `--props='{"claquetes":true}'`), a
 * claquete ocupa o lugar dele, para editar com o tempo final.
 */
export const montarLinha = ({ claquetes }: PropsDemo) => {
  const cenas = todasAsCenas.filter((c) => !c.clipe || claquetes || temArquivo(`clipes/${c.clipe}`));
  const inicios = cenas.reduce<number[]>(
    (acc, cena, i) => [...acc, i === 0 ? 0 : acc[i - 1] + cenas[i - 1].duracao - sobreposicao(cena.entrada)],
    [],
  );
  const duracao = inicios[inicios.length - 1] + cenas[cenas.length - 1].duracao;
  const capitulos: Capitulo[] = cenas.flatMap((cena, i) =>
    rotulos[cena.id] ? [{ rotulo: rotulos[cena.id], inicio: inicios[i], fim: inicios[i] + cena.duracao }] : [],
  );
  return { cenas, inicios, duracao, capitulos };
};

const apresentacao = { fade: fade(), lado: slide({ direction: 'from-right' }), baixo: slide({ direction: 'from-bottom' }) };

// A fala começa um pouco depois da cena, quando a transição já assentou.
const ATRASO_FALA = s(0.4);
const VOLUME_TRILHA = 0.12;

/** Narração por cena: public/narracao/<id da cena>.mp3, quando existir. */
const Narracao = ({ cenas, inicios }: ReturnType<typeof montarLinha>) => (
  <>
    {cenas.map(({ id }, i) => {
      const caminho = `narracao/${id}.mp3`;
      if (!temArquivo(caminho)) return null;
      return (
        <Sequence key={id} from={inicios[i] + ATRASO_FALA} layout="none">
          <Html5Audio src={staticFile(caminho)} />
        </Sequence>
      );
    })}
  </>
);

/** Trilha de fundo baixa, com entrada e saída suaves: public/trilha.mp3. */
const Trilha = ({ duracao }: { duracao: number }) =>
  temArquivo('trilha.mp3') ? (
    <Html5Audio
      src={staticFile('trilha.mp3')}
      loop
      volume={(f) =>
        interpolate(f, [0, s(1), duracao - s(2), duracao], [0, VOLUME_TRILHA, VOLUME_TRILHA, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    />
  ) : null;

export const Demo = (props: PropsDemo) => {
  const linha = montarLinha(props);
  return (
    <AbsoluteFill style={{ background: cor.fundo }}>
      <TransitionSeries>
        {linha.cenas.flatMap(({ id, Componente, duracao, entrada }, i) => {
          const cena = (
            <TransitionSeries.Sequence key={id} durationInFrames={duracao}>
              <Componente />
            </TransitionSeries.Sequence>
          );
          if (i === 0 || entrada === 'corte') return [cena];
          return [
            <TransitionSeries.Transition
              key={`${id}-entrada`}
              presentation={apresentacao[entrada]}
              timing={springTiming({ durationInFrames: TRANSICAO, config: { damping: 200 } })}
            />,
            cena,
          ];
        })}
      </TransitionSeries>
      <Capitulos capitulos={linha.capitulos} />
      <Grao />
      <Narracao {...linha} />
      <Trilha duracao={linha.duracao} />
    </AbsoluteFill>
  );
};
