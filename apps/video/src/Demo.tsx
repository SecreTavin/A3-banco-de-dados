import { springTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import type { ComponentType } from 'react';
import { AbsoluteFill } from 'remotion';
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
  descricao: 'Biel e Tavin no pátio da faculdade. Biel provoca, Tavin aceita.',
  falas: ['Biel: “Tu? Correr 5 km em menos de 25 minutos? Eu duvido.”', 'Tavin: “Duvida? Então valendo.”'],
});
const Corrida = clipe({
  arquivo: 'corrida.mp4',
  titulo: 'A corrida',
  descricao: 'Tavin correndo no parque no fim da tarde. Olha o relógio, acelera. Sem fala.',
});
const Reacao = clipe({
  arquivo: 'reacao.mp4',
  titulo: 'O troco',
  descricao: 'Biel recebe a notificação no celular, incrédulo. Tavin aparece por trás.',
  falas: ['Biel: “Não acredito…”', 'Tavin: “Paga.”'],
});

type Entrada = 'corte' | 'fade' | 'lado' | 'baixo';

// ~85s. Uma história só, do desafio 1 do seed: Biel duvida do Tavin.
const cenas: { id: string; Componente: ComponentType; duracao: number; entrada: Entrada }[] = [
  { id: 'abertura', Componente: Abertura, duracao: s(8), entrada: 'corte' },
  { id: 'virada', Componente: Gancho, duracao: s(4), entrada: 'corte' },
  { id: 'criar', Componente: CriarDesafio, duracao: s(10), entrada: 'lado' },
  { id: 'escrow', Componente: Escrow, duracao: s(9), entrada: 'lado' },
  { id: 'corrida', Componente: Corrida, duracao: s(6), entrada: 'fade' },
  { id: 'juri', Componente: Juri, duracao: s(12), entrada: 'fade' },
  { id: 'apuracao', Componente: Apuracao, duracao: s(12), entrada: 'lado' },
  { id: 'reacao', Componente: Reacao, duracao: s(5), entrada: 'fade' },
  { id: 'banco', Componente: Banco, duracao: s(14), entrada: 'baixo' },
  { id: 'fim', Componente: Fim, duracao: s(6), entrada: 'fade' },
];

const TRANSICAO = s(0.6);
const sobreposicao = (e: Entrada) => (e === 'corte' ? 0 : TRANSICAO);

const inicios = cenas.reduce<number[]>(
  (acc, cena, i) => [...acc, i === 0 ? 0 : acc[i - 1] + cenas[i - 1].duracao - sobreposicao(cena.entrada)],
  [],
);

export const duracaoDemo = inicios[inicios.length - 1] + cenas[cenas.length - 1].duracao;

const rotulos: Record<string, string> = { criar: 'Criar', escrow: 'Apostar', juri: 'Julgar', apuracao: 'Apurar', banco: 'Banco' };
const capitulos: Capitulo[] = cenas.flatMap((cena, i) =>
  rotulos[cena.id] ? [{ rotulo: rotulos[cena.id], inicio: inicios[i], fim: inicios[i] + cena.duracao }] : [],
);

const apresentacao = { fade: fade(), lado: slide({ direction: 'from-right' }), baixo: slide({ direction: 'from-bottom' }) };

export const Demo = () => (
  <AbsoluteFill style={{ background: cor.fundo }}>
    <TransitionSeries>
      {cenas.flatMap(({ id, Componente, duracao, entrada }, i) => {
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
    <Capitulos capitulos={capitulos} />
    <Grao />
  </AbsoluteFill>
);
