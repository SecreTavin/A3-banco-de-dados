// Linha do tempo do vídeo "Demonstracao": quando cada capítulo começa, quanto
// dura e em que quadro cai cada marco. Tudo sai de cenas.ts e da duração real
// da fala (quando o mp3 existe); sem o áudio, vale a duração estimada.
import { s } from '../tema';
import {
  ATRASO_FALA_SEGUNDOS,
  TRANSICAO_SEGUNDOS,
  cenas,
  duracaoCenaSegundos,
  type Cena,
  type Entrada,
} from './cenas';

export type PropsDemonstracao = {
  /** Duração real da fala de cada cena, em segundos; null quando não há mp3. */
  falas: (number | null)[];
};

export const TRANSICAO = s(TRANSICAO_SEGUNDOS);
export const ATRASO_FALA = s(ATRASO_FALA_SEGUNDOS);

export type CenaNaLinha = {
  cena: Cena;
  entrada: Entrada;
  /** Se a próxima cena entra com transição (a faixa precisa sair antes). */
  saidaComTransicao: boolean;
  temAudio: boolean;
  falaSegundos: number;
  /** Duração real ÷ estimada: escala os marcos. */
  fator: number;
  /** Quadro de início na linha inteira. */
  inicio: number;
  duracao: number;
  /** Quadro, dentro da cena, em que a fala termina. */
  fimDaFala: number;
  /** Quadro de cada marco, contado do início da cena. */
  marcos: Record<string, number>;
};

export const montarLinha = (falas: (number | null)[] = []) => {
  let inicio = 0;
  const lista: CenaNaLinha[] = cenas.map((cena, i) => {
    const real = falas[i] ?? null;
    const falaSegundos = real ?? cena.duracaoEstimadaSegundos;
    const fator = falaSegundos / cena.duracaoEstimadaSegundos;
    const entrada = cena.entrada;
    const duracao = s(duracaoCenaSegundos(cena, falaSegundos));
    if (i > 0 && entrada !== 'corte') inicio -= TRANSICAO;
    const item: CenaNaLinha = {
      cena,
      entrada,
      saidaComTransicao: (cenas[i + 1]?.entrada ?? 'corte') !== 'corte',
      temAudio: real !== null,
      falaSegundos,
      fator,
      inicio,
      duracao,
      fimDaFala: s(ATRASO_FALA_SEGUNDOS + falaSegundos),
      marcos: Object.fromEntries(
        cena.marcos.map((m) => [m.id, s(ATRASO_FALA_SEGUNDOS + m.em * fator + m.ajuste)]),
      ),
    };
    inicio += duracao;
    return item;
  });
  return { cenas: lista, duracao: inicio };
};

export type Linha = ReturnType<typeof montarLinha>;
