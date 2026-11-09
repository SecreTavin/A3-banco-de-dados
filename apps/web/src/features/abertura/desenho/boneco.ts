// Boneco articulado da abertura, em 3D estilo PS1, como string SVG.
//
// Pose = ângulos absolutos em graus (0 aponta para baixo, 90 para a frente).
// O esqueleto é o mesmo dos sprites aprovados em docs/04-ux/propostas/tela-inicial:
// cada osso vira uma caixa, e rosto e roupa são o desenho 2D de sempre, aplicado
// na face da frente por textura. O boneco olha para a direita; o da direita usa espelho.

import { caixa, fazCamera } from './motor3d'
import type { Camera, Face, V3 } from './motor3d'

export type Rosto = 'normal' | 'debochado' | 'focado' | 'bravo' | 'dor' | 'tonto' | 'feliz' | 'melado' | 'susto'
type Par = [number, number]

export interface Pose {
  /** inclinação do tronco */
  t: number
  /** inclinação da cabeça, relativa ao tronco */
  h: number
  /** braço de trás e da frente: [braço, antebraço] */
  bt: Par
  bf: Par
  /** perna de trás e da frente: [coxa, canela] */
  pt: Par
  pf: Par
  rosto: Rosto
  /** altura do quadril acima do chão, em unidades do boneco */
  alto?: number
  /** giro do corpo inteiro */
  giro?: number
}

export type Personagem = 'monge' | 'nerd' | 'aluno'

export const POSES = {
  guarda: { t: 4, h: 0, bt: [35, 160], bf: [55, 168], pt: [-20, -5], pf: [22, 8], rosto: 'normal' },
  provoca: { t: -8, h: -10, bt: [-35, 40], bf: [96, 96], pt: [-12, -4], pf: [16, 4], rosto: 'debochado' },
  prepara: { t: 24, h: -12, bt: [-60, -100], bf: [-45, -80], pt: [-8, -42], pf: [62, -6], rosto: 'focado' },
  voadora: { t: -40, h: 10, bt: [-130, -160], bf: [30, 150], pt: [20, -60], pf: [98, 96], rosto: 'bravo', alto: 70 },
  pegaTorta: { t: 2, h: 0, bt: [35, 160], bf: [-20, -40], pt: [-20, -5], pf: [22, 8], rosto: 'focado' },
  recua: { t: -10, h: 4, bt: [40, 120], bf: [-70, -120], pt: [-26, -8], pf: [28, 10], rosto: 'focado' },
  arremessa: { t: 14, h: 0, bt: [-30, -10], bf: [100, 110], pt: [-32, -14], pf: [32, 10], rosto: 'focado' },
  atingido: { t: -32, h: -28, bt: [150, 110], bf: [-150, -115], pt: [-14, 35], pf: [45, 70], rosto: 'dor', alto: 20 },
  voando: { t: 0, h: 20, bt: [125, 70], bf: [-100, -40], pt: [-35, -85], pf: [45, 95], rosto: 'tonto' },
  vitoria: { t: 0, h: -6, bt: [-128, -158], bf: [128, 158], pt: [-16, -4], pf: [16, 4], rosto: 'feliz' },
  tonto: { t: -6, h: 14, bt: [20, 10], bf: [-15, -5], pt: [-14, -2], pf: [12, 2], rosto: 'tonto' },
  melado: { t: -4, h: -8, bt: [-20, -10], bf: [30, 170], pt: [-14, -4], pf: [14, 4], rosto: 'melado' },
} satisfies Record<string, Pose>

export type Estampa = 'jaqueta' | 'xadrez' | 'colete' | 'macacao' | 'cardiga' | 'listras' | 'ziper'
export type Penteado = 'curto' | 'repartido' | 'longo' | 'chanel' | 'rabo' | 'bone'

export interface Visual {
  pele: string
  peleSombra: string
  camisa: string
  calca: string
  sapato: string
  /** cor das mangas e dos antebraços, quando não são a da camisa */
  manga?: string
  antebraco?: string
  /** cor das coxas e das canelas, quando não são a da calça (saia, meião) */
  coxa?: string
  canela?: string
  saia?: string
  cabelo?: string
  penteado?: Penteado
  bone?: string
  laco?: string
  estampa?: Estampa
  detalhe?: string
  menina?: boolean
}

const VISUAL: Record<'monge' | 'nerd', Visual> = {
  // Monge do kung fu: careca, bandana com o "!", bigode branco, fino e longo.
  monge: { pele: '#e0a676', peleSombra: '#c4875a', camisa: '#f08a24', calca: '#b8521b', sapato: '#1d1a22' },
  // Estudante nerd: óculos, espinhas, camisa social com "?" no bolso e mochila.
  nerd: { pele: '#f1c49b', peleSombra: '#d9a275', camisa: '#dbe7ff', calca: '#c9a96e', sapato: '#6b4420', cabelo: '#5a3a22' },
}

const DIM = { tronco: 60, cabeca: 46, braco: 32, antebraco: 30, coxa: 38, canela: 38 }
const ESCURO = '#1d1a22'
const RAD = Math.PI / 180

type Ponto = [number, number]
const soma = (p: Ponto, a: number, L: number): Ponto => [p[0] + Math.sin(a * RAD) * L, p[1] + Math.cos(a * RAD) * L]
const angulo = (a: Ponto, b: Ponto) => Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD
const n = (v: number) => v.toFixed(1)

interface Esqueleto {
  topo: Ponto
  aTronco: number
  centroCabeca: Ponto
  anguloCabeca: number
  bt: [Ponto, Ponto, Ponto]
  bf: [Ponto, Ponto, Ponto]
  pt: [Ponto, Ponto, Ponto]
  pf: [Ponto, Ponto, Ponto]
}

function esqueleto(p: Pose): Esqueleto {
  const aTronco = 180 - p.t
  const topo = soma([0, 0], aTronco, DIM.tronco)
  const ombro = soma([0, 0], aTronco, DIM.tronco - 8)
  const membro = (origem: Ponto, [a1, a2]: Par, L1: number, L2: number): [Ponto, Ponto, Ponto] => {
    const meio = soma(origem, a1, L1)
    return [origem, meio, soma(meio, a2, L2)]
  }
  return {
    topo, aTronco,
    centroCabeca: soma(topo, 180 - p.t - p.h, DIM.cabeca / 2 + 2),
    anguloCabeca: p.t + p.h,
    bt: membro(ombro, p.bt, DIM.braco, DIM.antebraco),
    bf: membro(ombro, p.bf, DIM.braco, DIM.antebraco),
    pt: membro([-4, -4], p.pt, DIM.coxa, DIM.canela),
    pf: membro([4, -4], p.pf, DIM.coxa, DIM.canela),
  }
}

// ------------------------------------------------------------ texturas 2D

function rosto(tipo: Rosto, quem: Personagem, piscando: boolean) {
  const nerd = quem === 'nerd'
  const olho = (x: number) => piscando
    ? `<rect x="${x - 1}" y="3" width="7" height="2.4" rx="1.2" fill="${ESCURO}"/>`
    : `<rect x="${x + (nerd ? 0.5 : 0)}" y="${nerd ? 0 : -2}" width="${nerd ? 4 : 5}" height="${nerd ? 6 : 9}" rx="2" fill="${ESCURO}"/>`
  const sobrancelha = (x: number, inclinacao: number) => `<rect x="${x}" y="${nerd ? -8 : -9}" width="9" height="3" rx="1.5" fill="${ESCURO}" transform="rotate(${inclinacao} ${x + 4} -8)"/>`
  const boca = (d: string) => `<path d="${d}" stroke="${ESCURO}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  switch (tipo) {
    case 'debochado': return olho(6) + olho(17) + sobrancelha(4, -14) + sobrancelha(15, 6) + boca('M 7 15 Q 14 19 21 12')
    case 'focado': return olho(6) + olho(17) + sobrancelha(4, 12) + sobrancelha(15, -12) + `<rect x="10" y="14" width="9" height="2.6" rx="1.3" fill="${ESCURO}"/>`
    case 'bravo': return olho(6) + olho(17) + sobrancelha(4, 18) + sobrancelha(15, -18) + `<path d="M 8 17 Q 14 11 20 17" stroke="${ESCURO}" stroke-width="2.6" fill="#7a2230" stroke-linecap="round"/>`
    case 'dor': return `<path d="M 5 -1 l 6 4 l -6 4 M 23 -1 l -6 4 l 6 4" stroke="${ESCURO}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="14" cy="16" rx="4.5" ry="5.5" fill="#7a2230"/>`
    case 'tonto': return `<path d="M 5 0 l 6 6 M 11 0 l -6 6 M 16 0 l 6 6 M 22 0 l -6 6" stroke="${ESCURO}" stroke-width="2.6" stroke-linecap="round"/>` + boca('M 7 16 q 3.5 -4 7 0 q 3.5 4 7 0')
    case 'feliz': return `<path d="M 5 4 q 3 -5 6 0 M 16 4 q 3 -5 6 0" stroke="${ESCURO}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M 6 12 Q 14 22 22 12 Z" fill="#7a2230" stroke="${ESCURO}" stroke-width="2.2" stroke-linejoin="round"/>`
    case 'susto': return `<circle cx="8.5" cy="3" r="2.6" fill="${ESCURO}"/><circle cx="19.5" cy="3" r="2.6" fill="${ESCURO}"/>` + sobrancelha(4, -10) + sobrancelha(15, 10) + `<ellipse cx="14" cy="16" rx="3.6" ry="4.6" fill="#7a2230" stroke="${ESCURO}" stroke-width="2"/>`
    case 'melado': return `<path d="M 5 3 l 6 0 M 16 3 l 6 0" stroke="${ESCURO}" stroke-width="2.6" stroke-linecap="round"/>` +
      '<path d="M -4 -16 Q 8 -22 24 -14 L 24 4 Q 20 10 18 2 Q 15 12 12 3 Q 8 9 6 1 Q 2 7 -4 0 Z" fill="#fff6e8" stroke="#f1e2c8" stroke-width="1"/><circle cx="10" cy="-12" r="3" fill="#ff5d73"/>'
    default: return olho(6) + olho(17) + `<rect x="10" y="14" width="8" height="2.6" rx="1.3" fill="${ESCURO}"/>`
  }
}

export interface Detalhes {
  piscando?: boolean
  /** o nerd perde os óculos no acerto */
  semOculos?: boolean
  /** giro das pontas da bandana e do bigode, que atrasam com o movimento */
  cauda?: number
  bigode?: number
  menina?: boolean
}

/** Os traços do rosto foram desenhados de perfil, centrados em x = 14; na face da frente da cabeça eles vêm para o meio. */
const CENTRO_DO_ROSTO = -14

/** Franja e mechas dos alunos, desenhadas no rosto; o volume fica nas caixas de cima e de trás. */
function franja(v: Visual) {
  const c = v.cabelo ?? '#2a1d14'
  switch (v.penteado) {
    case 'bone': return `<rect x="-23" y="-23" width="46" height="6" fill="${v.bone ?? c}"/>`
    case 'repartido': return `<path d="M -23 -23 L 23 -23 L 23 -9 Q 14 -13 5 -18 Q 1 -14 -3 -18 Q -11 -13 -23 -9 Z" fill="${c}"/>`
    case 'longo': return `<rect x="-23" y="-23" width="46" height="9" fill="${c}"/><rect x="-23" y="-23" width="6" height="46" fill="${c}"/><rect x="17" y="-23" width="6" height="46" fill="${c}"/>`
    case 'chanel': return `<rect x="-23" y="-23" width="46" height="12" fill="${c}"/><rect x="-23" y="-23" width="7" height="38" fill="${c}"/><rect x="16" y="-23" width="7" height="38" fill="${c}"/>`
    default: return `<rect x="-23" y="-23" width="46" height="7" fill="${c}"/>`
  }
}

/** Desenho do rosto em coordenadas da cabeça (de -23 a 23), aplicado na face da frente. */
function texturaCabeca(quem: Personagem, tipo: Rosto, d: Detalhes, v?: Visual) {
  let p = '', tracos = ''
  if (quem === 'monge') {
    // A faixa da bandana; o nó e as pontas ficam atrás, em 3D.
    p += '<rect x="-24" y="-14" width="48" height="10" fill="#d92b36"/>'
    tracos += '<circle cx="13" cy="-9" r="7.5" fill="#f6c453" stroke="#fff3c4" stroke-width="1.5"/>'
    tracos += '<text x="13" y="-4.6" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="12" fill="#7a2a00" text-anchor="middle">!</text>'
  } else if (quem === 'nerd') {
    // Franja de lado, arrumada.
    p += '<path d="M -23 -23 L 23 -23 L 23 -12 Q 10 -16 -2 -11 Q -10 -16 -23 -12 Z" fill="#5a3a22"/>'
    tracos += '<circle cx="5" cy="13" r="1.8" fill="#e05a5a"/><circle cx="24" cy="14" r="1.6" fill="#e05a5a"/><circle cx="20" cy="-6" r="1.4" fill="#e05a5a"/>'
  } else {
    if (v) p += franja(v)
    if (d.menina) {
      tracos += `<path d="M 6 -2 l -2 -3 M 9 -2 l 0 -3 M 22 -2 l 2 -3 M 19 -2 l 0 -3" stroke="${ESCURO}" stroke-width="1.6" stroke-linecap="round"/>`
      tracos += '<circle cx="4" cy="11" r="3" fill="#e8798a" opacity=".55"/><circle cx="23" cy="11" r="3" fill="#e8798a" opacity=".55"/>'
    }
  }
  tracos += rosto(tipo, quem, !!d.piscando && ['normal', 'debochado', 'focado', 'bravo'].includes(tipo))
  if (quem === 'monge') {
    // Bigodão branco de mestre velho: barra sob o nariz e duas pontas que caem
    // para fora, abertas embaixo; o contorno cinza não deixa sumir na pele.
    const ponta = (dd: string) => `<path d="${dd}" stroke="#9a948a" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="${dd}" stroke="#fbfaf6" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    tracos += `<g transform="rotate(${n(d.bigode ?? 0)} 14 11)">` +
      '<path d="M 4 13 Q 9 8 14 10 Q 19 8 24 13 Q 19 14 14 12.5 Q 9 14 4 13 Z" fill="#fbfaf6" stroke="#9a948a" stroke-width="1.2" stroke-linejoin="round"/>' +
      `${ponta('M 5 13.5 Q 1 19 1 28')}${ponta('M 23 13.5 Q 27 19 27 28')}</g>`
  } else if (quem === 'nerd' && !d.semOculos) {
    tracos += `<circle cx="8.5" cy="3" r="7" fill="rgba(255,255,255,.18)" stroke="${ESCURO}" stroke-width="2.6"/>`
    tracos += `<circle cx="20" cy="3" r="7" fill="rgba(255,255,255,.18)" stroke="${ESCURO}" stroke-width="2.6"/>`
    tracos += `<path d="M 15.5 3 L 13 3 M 1.5 2 L -12 0" stroke="${ESCURO}" stroke-width="2.4" stroke-linecap="round"/>`
    tracos += '<path d="M 5 0 l 3 -2 M 17 0 l 3 -2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>'
  }
  return p + `<g transform="translate(${CENTRO_DO_ROSTO} 0)">${tracos}</g>`
}

/** Desenho da roupa em coordenadas do tronco (x de -23 a 23; y de -14, cintura, a 62, gola). */
function texturaRoupa(quem: Personagem, v: Visual) {
  if (quem === 'monge') {
    return '<path d="M -19 60 L 19 14 L 19 24 L -11 62 Z" fill="#d9731c"/><rect x="-23" y="-14" width="46" height="16" fill="#b8521b"/><rect x="-23" y="2" width="46" height="9" fill="#6b2a0e"/>' +
      [-14, -7, 0, 7, 14].map((x, i) => `<circle cx="${x}" cy="${n(56 - Math.abs(x) * 0.25)}" r="3" fill="${i % 2 ? '#7a3b1a' : '#9c5428'}"/>`).join('')
  }
  if (quem === 'nerd') {
    return '<rect x="-23" y="-14" width="46" height="16" fill="#c9a96e"/><rect x="-23" y="0" width="46" height="5" fill="#6b4420"/>' +
      '<path d="M -10 61 L -2 51 L 0 61 Z M 0 61 L 4 51 L 12 61 Z" fill="#fff"/>' +
      [10, 22, 34, 46].map((y) => `<circle cx="-2" cy="${y}" r="1.6" fill="#8fa3c8"/>`).join('') +
      '<rect x="-20" y="28.8" width="17" height="15" rx="3" fill="#c3d4f3" stroke="#9fb3db" stroke-width="1.2"/><rect x="-9" y="40.8" width="3" height="9" rx="1.5" fill="#2f5bd3"/>' +
      '<text x="-11.5" y="36" transform="rotate(180 -11.5 36)" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="13" fill="#5638c9" text-anchor="middle" dominant-baseline="middle">?</text>' +
      '<rect x="8.3" y="6" width="6" height="56" rx="3" fill="#16804a"/>'
  }
  const d = v.detalhe ?? '#f2efe6'
  let p = `<rect x="-23" y="-14" width="46" height="14" fill="${v.saia ?? v.calca}"/>`
  switch (v.estampa) {
    case 'jaqueta': // jaqueta de time (letterman)
      p += `<rect x="-23" y="-2" width="46" height="5" fill="${d}"/><rect x="-23" y="4" width="46" height="2" fill="#7a2a3a"/><rect x="-2" y="6" width="4" height="56" fill="${d}"/>` +
        `<rect x="-21" y="30" width="15" height="17" rx="3" fill="#7a2a3a"/><path d="M -17 33 L -17 44 L -10 44" stroke="${d}" stroke-width="3" fill="none"/><path d="M -12 62 L 0 54 L 12 62" stroke="${d}" stroke-width="4" fill="none"/>`
      break
    case 'xadrez': // camisa de flanela
      p += `<path d="M -15 0 L -15 62 M -5 0 L -5 62 M 5 0 L 5 62 M 15 0 L 15 62 M -23 8 L 23 8 M -23 20 L 23 20 M -23 32 L 23 32 M -23 44 L 23 44 M -23 56 L 23 56" stroke="${d}" stroke-width="3" opacity=".5"/>` +
        '<path d="M -10 0 L -10 62 M 10 0 L 10 62 M -23 14 L 23 14 M -23 38 L 23 38" stroke="#e8c070" stroke-width="1.2" opacity=".6"/>'
      break
    case 'colete': // colete de tricô com losangos
      p += `<path d="M -23 0 L 23 0 L 23 50 L 7 50 L 0 34 L -7 50 L -23 50 Z" fill="${d}"/>` +
        '<path d="M -14 12 L -8 20 L -14 28 L -20 20 Z M 14 12 L 20 20 L 14 28 L 8 20 Z M 0 4 L 6 12 L 0 20 L -6 12 Z" fill="#e2c86a" opacity=".85"/>' +
        '<path d="M -9 62 L -2 52 L 0 62 Z M 0 62 L 2 52 L 9 62 Z" fill="#fff"/>'
      break
    case 'macacao': // jardineira jeans
      p += `<rect x="-23" y="-14" width="46" height="24" fill="${d}"/><rect x="-14" y="8" width="28" height="30" rx="3" fill="${d}"/>` +
        `<rect x="-13" y="36" width="5" height="26" fill="${d}"/><rect x="8" y="36" width="5" height="26" fill="${d}"/>` +
        '<circle cx="-10" cy="34" r="2.2" fill="#e2c86a"/><circle cx="10" cy="34" r="2.2" fill="#e2c86a"/><rect x="-7" y="16" width="14" height="10" rx="2" fill="#000" opacity=".15"/>'
      break
    case 'cardiga': // cardigã com blusa
      p += '<path d="M -7 62 L 7 62 L 0 40 Z" fill="#f4f2ea"/><rect x="-1" y="0" width="2" height="40" fill="#000" opacity=".25"/>' +
        [10, 21, 32].map((y) => `<circle cx="-4" cy="${y}" r="1.8" fill="#f4f2ea"/>`).join('')
      break
    case 'listras': // uniforme de líder de torcida
      p += `<rect x="-23" y="42" width="46" height="4" fill="${d}"/><rect x="-23" y="49" width="46" height="2" fill="${d}"/><path d="M -6 20 L -6 34 L 2 34 M 6 20 L 6 34" stroke="${d}" stroke-width="3.5" fill="none"/>`
      break
    case 'ziper': // corta-vento e moletom
      p += `<rect x="-1" y="0" width="2" height="62" fill="#d0d0d0"/><rect x="-23" y="30" width="46" height="8" fill="${d}"/><rect x="-14" y="4" width="28" height="12" rx="3" fill="#000" opacity=".15"/>`
      break
  }
  return p
}

// ---------------------------------------------------------------- 2D

/** Quanto subir o corpo para o ponto mais baixo, depois do giro, tocar o chão. */
function apoio(e: Esqueleto, giro: number) {
  const cosG = Math.cos(giro * RAD)
  const senG = Math.sin(giro * RAD)
  const pontos: [Ponto, number][] = [[e.bt[2], 14], [e.bf[2], 14], [e.pt[2], 14], [e.pf[2], 14], [e.pt[1], 14], [e.pf[1], 14], [e.topo, 14], [e.centroCabeca, DIM.cabeca / 2]]
  return Math.max(...pontos.map(([p, folga]) => p[0] * senG + p[1] * cosG + folga))
}

interface Posicao {
  x: number
  /** linha do chão */
  y: number
  escala: number
  espelho?: boolean
}

/** Onde a mão da frente ou o centro da cabeça cai no plano da cena (z = 0). */
export function pontoDoCorpo(pose: Pose, parte: 'mao' | 'cabeca', { x, y, escala, espelho = false }: Posicao): Ponto {
  const e = esqueleto(pose)
  const giro = pose.giro ?? 0
  const p = parte === 'mao' ? e.bf[2] : e.centroCabeca
  const rx = p[0] * Math.cos(giro * RAD) - p[1] * Math.sin(giro * RAD)
  const ry = p[0] * Math.sin(giro * RAD) + p[1] * Math.cos(giro * RAD)
  return [x + (espelho ? -escala : escala) * rx, y + escala * (ry - apoio(e, giro) - (pose.alto ?? 0))]
}

/** Altura aproximada do boneco em pé, em unidades, para posicionar balões e estrelas. */
export const ALTURA_BONECO = 196

// ---------------------------------------------------------------- 3D

export interface OpcoesBoneco extends Posicao, Detalhes {
  /** profundidade no mundo (positivo vem para a câmera) */
  z?: number
  /** giro em torno do eixo vertical, para virar o boneco para o centro */
  yaw?: number
  /** squash e stretch: preso ao chão e no corpo */
  deforma?: Par
  estica?: Par
  opacidade?: number
  sombra?: boolean
  visual?: Visual
  /** linha do chão para a sombra, quando o boneco está no ar */
  chao?: number
}

function corCabeca(quem: Personagem, v: Visual) {
  const temCabelo = quem !== 'monge'
  return (eixo: number, lado: number) => (temCabelo && lado < 0 && eixo < 2) ? (v.cabelo ?? '#5a3a22') : (eixo === 1 && lado > 0 ? v.peleSombra : v.pele)
}

/** Boneco inteiro em caixas, acrescentado à lista de faces da cena. */
/** Uma caixa em coordenadas da cabeça: centro e semieixos (frente, baixo, lado). */
type BlocoDaCabeca = (centro: V3, A: V3, B: V3, C: V3, cor: string) => void

/**
 * Volume da cabeça além do cubo: nariz, cabelo dos alunos e a bandana do monge
 * (faixa em volta, nó e pontas atrás, que balançam com `cauda`).
 */
function volumesDaCabeca(bloco: BlocoDaCabeca, quem: Personagem, v: Visual, cauda: number) {
  bloco([25, 6, 0], [2.5, 0, 0], [0, 3.5, 0], [0, 0, 2.5], v.pele)
  if (quem === 'monge') {
    const faixa = '#d92b36'
    bloco([0, -9, 20.6], [23, 0, 0], [0, 5, 0], [0, 0, 0.6], faixa)
    bloco([0, -9, -20.6], [23, 0, 0], [0, 5, 0], [0, 0, 0.6], faixa)
    bloco([-23.6, -9, 0], [0.6, 0, 0], [0, 5, 0], [0, 0, 20.6], faixa)
    bloco([-25.5, -9, 0], [2.5, 0, 0], [0, 4, 0], [0, 0, 5], '#a3151f')
    // Pontas: segmentos que saem do nó para trás e para baixo; `cauda` levanta.
    const c = (cauda * Math.PI) / 180, cc = Math.cos(c), sc = Math.sin(c)
    for (const [fim, z, cor] of [[[-12, 16], 3, '#c41f2b'], [[-7, 21], -3, '#a3151f']] as [[number, number], number, string][]) {
      const du = fim[0] * cc - fim[1] * sc, dv = fim[0] * sc + fim[1] * cc, L = Math.hypot(du, dv)
      bloco([-26 + du / 2, -9 + dv / 2, z], [du / 2, dv / 2, 0], [(-dv / L) * 3, (du / L) * 3, 0], [0, 0, 1.5], cor)
    }
  }
  if (quem === 'aluno') {
    const c = v.cabelo ?? '#2a1d14'
    if (v.penteado === 'bone') { bloco([0, -27, 0], [26, 0, 0], [0, 6, 0], [0, 0, 24], v.bone ?? c); bloco([-33, -23, 0], [11, 0, 0], [0, 2, 0], [0, 0, 15], v.bone ?? c) }
    else bloco([0, -26, 0], [25, 0, 0], [0, 5, 0], [0, 0, 23], c)
    // Cabelo comprido e chanel caem atrás da cabeça, nunca na frente do rosto.
    if (v.penteado === 'longo') bloco([-28, 11, 0], [6, 0, 0], [0, 31, 0], [0, 0, 19], c)
    if (v.penteado === 'chanel') bloco([-27, -3, 0], [5, 0, 0], [0, 17, 0], [0, 0, 19], c)
    if (v.penteado === 'rabo') { bloco([-28, -12, 0], [6, 0, 0], [0, 6, 0], [0, 0, 7], v.laco ?? c); bloco([-33, 6, 0], [6, 0, 0], [0, 13, 0], [0, 0, 6], c) }
  }
}

/**
 * Boneco inteiro em caixas, acrescentado à lista de faces da cena.
 *
 * O esqueleto anda no plano do desenho (x para a frente, y para baixo); z é a
 * largura do corpo. O rosto vai na face da cabeça que olha para a frente, e a
 * roupa, na frente do tronco. `yaw` vira o boneco para a câmera.
 */
export function boneco(out: Face[], quem: Personagem, pose: Pose, o: OpcoesBoneco, cam: Camera) {
  const e = esqueleto(pose), giroG = pose.giro ?? 0, g = giroG * RAD, alto = pose.alto ?? 0, base = apoio(e, giroG)
  const M = quem === 'monge', v = o.visual ?? VISUAL[quem === 'aluno' ? 'nerd' : quem]
  const [gx, gy] = o.deforma ?? [1, 1], [bx, by] = o.estica ?? [1, 1]
  const sx = (o.espelho ? -1 : 1) * o.escala * gx, sy = o.escala * gy, s = o.escala
  const op = o.opacidade ?? 1, cg = Math.cos(g), sn = Math.sin(g)
  const yw = (o.yaw ?? 0) * RAD, cy = Math.cos(yw), syw = Math.sin(yw), z0 = o.z ?? 0
  const lin = (px: number, py: number, pz: number): V3 => {
    const ux = bx * px, uy = by * py, x = sx * (ux * cg - uy * sn), y = sy * (ux * sn + uy * cg), z = s * pz
    return [x * cy + z * syw, y, -x * syw + z * cy]
  }
  const T: V3 = [o.x, o.y + sy * (-base - alto), z0]
  const pto = (px: number, py: number, pz: number): V3 => { const l = lin(px, py, pz); return [T[0] + l[0], T[1] + l[1], T[2] + l[2]] }

  // Meia largura do tronco (ombros) e meia espessura, de frente para trás.
  const largo = M ? 22 : 19, fundo = M ? 14 : 12
  const osso = (p: Ponto, q: Ponto, w: number, d: number, z: number, cor: string) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 0.001, ux = dx / L, uy = dy / L, hl = L / 2 + w * 0.25
    caixa(out, pto((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, z), lin(ux * hl, uy * hl, 0), lin(-uy * w / 2, ux * w / 2, 0), lin(0, 0, d / 2), cor, op, cam)
  }
  const cubo = (p: Ponto, r: number, z: number, cor: string) => caixa(out, pto(p[0], p[1], z), lin(r, 0, 0), lin(0, r, 0), lin(0, 0, r), cor, op, cam)
  const braco = (m: [Ponto, Ponto, Ponto], z: number) => {
    const manga = v.manga ?? v.camisa
    osso(m[0], m[1], M ? 20 : 17, M ? 18 : 15, z, manga)
    osso(m[1], m[2], 14, 13, z, v.antebraco ?? (M ? v.pele : manga))
    cubo(m[2], 10, z, v.pele)
  }
  const perna = (m: [Ponto, Ponto, Ponto], z: number) => {
    const coxa = v.coxa ?? v.calca, aC = angulo(m[1], m[2]), pe = soma(m[2], aC, -3)
    osso(m[0], m[1], M ? 24 : 20, M ? 20 : 17, z, coxa)
    osso(m[1], m[2], M ? 22 : 18, M ? 18 : 15, z, v.canela ?? coxa)
    osso(soma(pe, aC + 90, -4), soma(pe, aC + 90, 16), 14, 16, z, v.sapato)
  }
  braco(e.bt, -(largo + 8)); perna(e.pt, -10); perna(e.pf, 10); braco(e.bf, largo + 8)

  // Tronco: a frente (-x no desenho do tronco) leva a roupa como textura.
  const th = -e.aTronco * RAD, ct = Math.cos(th), st = Math.sin(th), tl = (u: number, w: number): Ponto => [u * ct - w * st, u * st + w * ct]
  const cT = tl(0, 24), aU = tl(fundo, 0), aV = tl(0, 38)
  const frente = (z: number, w: number) => { const q = tl(-fundo, w); return pto(q[0], q[1], z) }
  caixa(out, pto(cT[0], cT[1], 0), lin(aU[0], aU[1], 0), lin(aV[0], aV[1], 0), lin(0, 0, largo), v.camisa, op, cam,
    { svg: texturaRoupa(quem, v), eixo: 0, lado: -1, P00: frente(-largo, -14), P10: frente(largo, -14), P01: frente(-largo, 62), u0: -23, v0: -14, w: 46, h: 76 })
  if (quem === 'nerd') { const cm = tl(fundo + 7, 34), mu = tl(7, 0), mv = tl(0, 26); caixa(out, pto(cm[0], cm[1], 0), lin(mu[0], mu[1], 0), lin(mv[0], mv[1], 0), lin(0, 0, largo - 3), '#22a45d', op, cam) }
  if (v.saia) { const cs = tl(0, -24), su = tl(fundo + 5, 0), sv = tl(0, 13); caixa(out, pto(cs[0], cs[1], 0), lin(su[0], su[1], 0), lin(sv[0], sv[1], 0), lin(0, 0, largo + 5), v.saia, op, cam) }

  // Cabeça: o rosto vai na face da frente (+x da cabeça), de -dH a dH na largura.
  const ha = e.anguloCabeca * RAD, hc = Math.cos(ha), hs = Math.sin(ha), dH = 20
  const hp = (u: number, w: number): Ponto => [e.centroCabeca[0] + u * hc - w * hs, e.centroCabeca[1] + u * hs + w * hc]
  const hv = (u: number, w: number, z: number) => lin(u * hc - w * hs, u * hs + w * hc, z)
  const ph = (u: number, w: number, z: number) => { const q = hp(u, w); return pto(q[0], q[1], z) }
  caixa(out, ph(0, 0, 0), hv(23, 0, 0), hv(0, 23, 0), hv(0, 0, dH), corCabeca(quem, v), op, cam,
    { svg: texturaCabeca(quem, pose.rosto, { ...o, menina: v.menina }, v), eixo: 0, lado: 1, P00: ph(23, -23, -dH), P10: ph(23, -23, dH), P01: ph(23, 23, -dH), u0: -23, v0: -23, w: 46, h: 46 })
  volumesDaCabeca((c, A, B, C, cor) => caixa(out, ph(c[0], c[1], c[2]), hv(...A), hv(...B), hv(...C), cor, op, cam), quem, v, o.cauda ?? 0)

  if (o.sombra !== false) {
    const rx = Math.max(16, 46 - alto * 0.15) * s, chao = o.chao ?? o.y, pts: string[] = []
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, q = cam.tela([o.x + Math.cos(a) * rx, chao, z0 + Math.sin(a) * rx * 0.5])
      pts.push(`${n(q[0])},${n(q[1])}`)
    }
    out.push({ k: 1e9, svg: `<polygon points="${pts.join(' ')}" fill="#000" opacity="${(Math.max(0.06, 0.3 - alto * 0.0012) * op).toFixed(2)}"/>` })
  }
}

/**
 * Cabeça sozinha, para os planos fechados, em três quartos: o rosto olha para
 * a câmera, virado 25° para o lado do adversário.
 */
export function cabecaGrande(out: Face[], quem: Personagem, tipo: Rosto, x: number, y: number, escala: number,
  { espelho = false, giro = 0, deforma = [1, 1] as Par, semOculos = false } = {}, base = 720) {
  const g = giro * RAD, cg = Math.cos(g), sn = Math.sin(g), v = VISUAL[quem === 'aluno' ? 'nerd' : quem]
  const c = fazCamera({ yaw: 0, pitch: 5, f: base * 3.6, px: x, py: y, grade: 4 })
  // Frente da cabeça (+u) aponta para a câmera, com 25° para o lado do adversário.
  const lado = espelho ? -1 : 1, a = (25 * Math.PI) / 180, fx = lado * Math.sin(a), fz = Math.cos(a)
  const L = (u: number, w: number, z: number): V3 => {
    const wx = u * fx + z * fz * lado, wz = u * fz - z * fx * lado
    const rx = wx * cg - w * sn, ry = wx * sn + w * cg
    return [rx * escala * deforma[0], ry * escala * deforma[1], wz * escala]
  }
  const P = (u: number, w: number, z: number): V3 => { const l = L(u, w, z); return [x + l[0], y + l[1], l[2]] }
  const faces: Face[] = []
  caixa(faces, [x, y, 0], L(23, 0, 0), L(0, 23, 0), L(0, 0, 20), corCabeca(quem, v), 1, c,
    { svg: texturaCabeca(quem, tipo, { semOculos }), eixo: 0, lado: 1, P00: P(23, -23, -20), P10: P(23, -23, 20), P01: P(23, 23, -20), u0: -23, v0: -23, w: 46, h: 46 })
  volumesDaCabeca((cc, A, B, C, cor) => caixa(faces, P(cc[0], cc[1], cc[2]), L(...A), L(...B), L(...C), cor, 1, c), quem, v, 0)
  for (const f of faces) out.push(f)
}
