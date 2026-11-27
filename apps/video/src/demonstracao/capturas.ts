// Acesso tipado às capturas reais (public/demonstracao/capturas/) e às caixas
// dos alvos, em px de CSS da página capturada.
import manifesto from '../../public/demonstracao/capturas/capturas.json';
import { staticFile } from 'remotion';

export type Caixa = { x: number; y: number; w: number; h: number };

type Captura = { arquivo: string; largura: number; altura: number; alvos: Record<string, Caixa> };
const capturas = manifesto as Record<string, Captura>;

export type NomeCaptura = keyof typeof manifesto;

/**
 * Caixas medidas sobre as PNG (com uma grade de 50 px de CSS por cima), para regiões que o script de captura não
 * marcou (um cartão inteiro, um bloco de texto). Mesma unidade: px de CSS.
 *
 * `05-votacao/jurados` substitui a do capturas.json, que saiu com y = -716: o
 * script mediu a caixa antes de a página rolar até o cartão da prova.
 */
const extras: Partial<Record<NomeCaptura, Record<string, Caixa>>> = {
  '01-cadastro-vazio': { cartao: { x: 760, y: 234, w: 581, h: 391 } },
  '01-cadastro': { cartao: { x: 760, y: 234, w: 581, h: 391 } },
  '03-avaliando': { moderacao: { x: 1014, y: 350, w: 380, h: 212 } },
  '03-criado': { cabecalho: { x: 316, y: 72, w: 532, h: 100 } },
  '04-luis-escolha': { form: { x: 320, y: 615, w: 661, h: 229 } },
  '04-luis': { duelo: { x: 335, y: 320, w: 630, h: 180 } },
  '04-arthur': { duelo: { x: 335, y: 320, w: 630, h: 230 } },
  '04-mario': {
    duelo: { x: 335, y: 320, w: 630, h: 230 },
    pote: { x: 578, y: 360, w: 144, h: 148 },
    etapas: { x: 320, y: 192, w: 1064, h: 92 },
  },
  '05-votacao': { jurados: { x: 32, y: 598, w: 326, h: 42 } },
  '06-card': { oQueVale: { x: 34, y: 307, w: 322, h: 112 } },
  '06-decisao': { quorum: { x: 33, y: 508, w: 324, h: 137 } },
  '07-fecha': { placarCartao: { x: 938, y: 348, w: 432, h: 119 } },
  '08-ranking': { podioInteiro: { x: 320, y: 133, w: 1064, h: 276 } },
};

export const caixa = (nome: NomeCaptura, alvo: string): Caixa => {
  const encontrada = extras[nome]?.[alvo] ?? capturas[nome].alvos[alvo];
  if (!encontrada) throw new Error(`Captura ${nome}: alvo "${alvo}" não existe`);
  return encontrada;
};

/** Centro de uma caixa: para onde o cursor vai. */
export const centro = (c: Caixa) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

export const arquivoCaptura = (nome: NomeCaptura) => staticFile(`demonstracao/capturas/${capturas[nome].arquivo}`);

export const DESKTOP = { largura: 1440, altura: 900 } as const;
export const CELULAR = { largura: 390, altura: 844 } as const;
