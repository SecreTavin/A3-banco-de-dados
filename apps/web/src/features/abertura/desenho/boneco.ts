// Boneco articulado da abertura, desenhado como string SVG.
//
// Pose = ângulos absolutos em graus (0 aponta para baixo, 90 para a frente).
// O boneco é sempre desenhado virado para a direita; o da direita usa espelho.
// É o mesmo esqueleto dos sprites aprovados em docs/04-ux/propostas/tela-inicial.

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

export type Personagem = 'monge' | 'nerd'

export const POSES = {
  guarda: { t: 4, h: 0, bt: [35, 160], bf: [55, 168], pt: [-20, -5], pf: [22, 8], rosto: 'normal' },
  provoca: { t: -8, h: -10, bt: [-35, 40], bf: [96, 96], pt: [-12, -4], pf: [16, 4], rosto: 'debochado' },
  prepara: { t: 24, h: -12, bt: [-60, -100], bf: [-45, -80], pt: [-8, -42], pf: [62, -6], rosto: 'focado' },
  voadora: { t: -40, h: 10, bt: [-130, -160], bf: [30, 150], pt: [20, -60], pf: [98, 96], rosto: 'bravo', alto: 70 },
  pegaTorta: { t: 2, h: 0, bt: [35, 160], bf: [-20, -40], pt: [-20, -5], pf: [22, 8], rosto: 'focado' },
  arremessa: { t: 14, h: 0, bt: [-30, -10], bf: [100, 110], pt: [-32, -14], pf: [32, 10], rosto: 'focado' },
  atingido: { t: -32, h: -28, bt: [150, 110], bf: [-150, -115], pt: [-14, 35], pf: [45, 70], rosto: 'dor', alto: 20 },
  voando: { t: 0, h: 20, bt: [125, 70], bf: [-100, -40], pt: [-35, -85], pf: [45, 95], rosto: 'tonto' },
  vitoria: { t: 0, h: -6, bt: [-128, -158], bf: [128, 158], pt: [-16, -4], pf: [16, 4], rosto: 'feliz' },
  tonto: { t: -6, h: 14, bt: [20, 10], bf: [-15, -5], pt: [-14, -2], pf: [12, 2], rosto: 'tonto' },
  melado: { t: -4, h: -8, bt: [-20, -10], bf: [30, 170], pt: [-14, -4], pf: [14, 4], rosto: 'melado' },
} satisfies Record<string, Pose>

interface Visual {
  pele: string
  peleSombra: string
  camisa: string
  camisaSombra: string
  calca: string
  calcaSombra: string
  sapato: string
  sola: string
  mochila?: string
  mochilaSombra?: string
}

const VISUAL: Record<Personagem, Visual> = {
  // Monge do kung fu: careca, bandana com o "!", bigode branco, fino e longo.
  monge: {
    pele: '#e0a676', peleSombra: '#c4875a',
    camisa: '#f08a24', camisaSombra: '#c9661a',
    calca: '#b8521b', calcaSombra: '#933f12',
    sapato: '#1d1a22', sola: '#f4efe6',
  },
  // Estudante nerd: óculos, espinhas, camisa social com "?" no bolso e mochila.
  nerd: {
    pele: '#f1c49b', peleSombra: '#d9a275',
    camisa: '#dbe7ff', camisaSombra: '#b4c6ea',
    calca: '#c9a96e', calcaSombra: '#a88a52',
    sapato: '#6b4420', sola: '#3a2410',
    mochila: '#22a45d', mochilaSombra: '#16804a',
  },
}

const DIM = { tronco: 60, larguraTronco: 46, cabeca: 46, braco: 32, antebraco: 30, larguraBraco: 17, punho: 12.5, coxa: 38, canela: 38, larguraPerna: 21, pe: 24 }
const ESCURO = '#1d1a22'
const RAD = Math.PI / 180
const CONTORNO = 'fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"'

type Ponto = [number, number]
const soma = (p: Ponto, a: number, L: number): Ponto => [p[0] + Math.sin(a * RAD) * L, p[1] + Math.cos(a * RAD) * L]
const angulo = (a: Ponto, b: Ponto) => Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD
const n = (v: number) => v.toFixed(1)
const g = (conteudo: string, transform = '') => `<g${transform ? ` transform="${transform}"` : ''}>${conteudo}</g>`

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

// Segmento "bloco": retângulo ao longo do ângulo, com a face lateral mais escura.
function bloco(p: Ponto, a: number, L: number, w: number, cor: string, sombra: string, contorno: boolean) {
  const tr = `translate(${n(p[0])} ${n(p[1])}) rotate(${n(-a)})`
  const forma = `x="${-w / 2}" y="${-w * 0.35}" width="${w}" height="${n(L + w * 0.7)}" rx="${w * 0.3}"`
  if (contorno) return g(`<rect ${forma} ${CONTORNO}/>`, tr)
  return g(`<rect ${forma} fill="${cor}"/><rect x="${w * 0.12}" y="${-w * 0.35}" width="${w * 0.38}" height="${n(L + w * 0.7)}" rx="${w * 0.25}" fill="${sombra}"/>`, tr)
}

function braco(m: [Ponto, Ponto, Ponto], quem: Personagem, fundo: boolean, contorno: boolean) {
  const v = VISUAL[quem]
  const [ombro, cotovelo, mao] = m
  const pele = fundo ? v.peleSombra : v.pele
  const tecido = fundo ? v.camisaSombra : v.camisa
  const aBraco = angulo(ombro, cotovelo)
  const aAnte = angulo(cotovelo, mao)
  let s = ''
  if (quem === 'monge') {
    // Manga larga do hábito, antebraço à mostra e faixa no pulso.
    s += bloco(ombro, aBraco, DIM.braco, DIM.larguraBraco + 7, tecido, v.camisaSombra, contorno)
    s += bloco(cotovelo, aAnte, DIM.antebraco, DIM.larguraBraco, pele, v.peleSombra, contorno)
    if (!contorno) s += bloco(soma(cotovelo, aAnte, DIM.antebraco - 6), aAnte, 4, DIM.larguraBraco + 1, '#f4efe6', '#ddd5c6', false)
  } else {
    // Manga comprida da camisa social, com punho branco.
    s += bloco(ombro, aBraco, DIM.braco, DIM.larguraBraco + 2, tecido, v.camisaSombra, contorno)
    s += bloco(cotovelo, aAnte, DIM.antebraco, DIM.larguraBraco, tecido, v.camisaSombra, contorno)
    if (!contorno) s += bloco(soma(cotovelo, aAnte, DIM.antebraco - 4), aAnte, 3, DIM.larguraBraco + 1, '#fff', '#e6ecf8', false)
  }
  s += contorno
    ? `<circle cx="${n(mao[0])}" cy="${n(mao[1])}" r="${DIM.punho}" ${CONTORNO}/>`
    : `<circle cx="${n(mao[0])}" cy="${n(mao[1])}" r="${DIM.punho}" fill="${pele}"/><circle cx="${n(mao[0] - 3)}" cy="${n(mao[1] - 3)}" r="${DIM.punho * 0.45}" fill="#fff" opacity=".18"/>`
  return s
}

function perna(m: [Ponto, Ponto, Ponto], quem: Personagem, fundo: boolean, contorno: boolean) {
  const v = VISUAL[quem]
  const [quadril, joelho, tornozelo] = m
  const calca = fundo ? v.calcaSombra : v.calca
  const aCanela = angulo(joelho, tornozelo)
  const pe = soma(tornozelo, aCanela, -4)
  const tr = `translate(${n(pe[0])} ${n(pe[1])}) rotate(${n(-(aCanela + 90))})`
  const largura = quem === 'monge' ? DIM.larguraPerna + 5 : DIM.larguraPerna
  const sapato = contorno
    ? g(`<rect x="-8" y="-9" width="18" height="${DIM.pe + 10}" rx="6" ${CONTORNO}/>`, tr)
    : g(`<rect x="-8" y="-9" width="18" height="${DIM.pe + 10}" rx="6" fill="${v.sapato}"/><rect x="6" y="-9" width="5" height="${DIM.pe + 10}" rx="2" fill="${v.sola}"/>` +
      (quem === 'monge' ? '<rect x="-10" y="-11" width="10" height="9" rx="3" fill="#f4efe6"/>' : ''), tr)
  return bloco(quadril, angulo(quadril, joelho), DIM.coxa, largura, calca, v.calcaSombra, contorno) +
    bloco(joelho, aCanela, DIM.canela, largura - 2, calca, v.calcaSombra, contorno) + sapato
}

function rosto(tipo: Rosto, quem: Personagem) {
  const nerd = quem === 'nerd'
  const olho = (x: number) => `<rect x="${x + (nerd ? 0.5 : 0)}" y="${nerd ? 0 : -2}" width="${nerd ? 4 : 5}" height="${nerd ? 6 : 9}" rx="2" fill="${ESCURO}"/>`
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

/** Cabeça em coordenadas locais: rosto para +x, topo para -y. */
function cabecaLocal(quem: Personagem, tipo: Rosto, contorno: boolean) {
  const v = VISUAL[quem]
  const s = DIM.cabeca
  if (contorno) {
    const extra = quem === 'monge'
      ? `<path d="M -22 -12 Q -40 -6 -44 12 L -36 14 Q -34 0 -20 -4 Z" ${CONTORNO}/>`
      : `<path d="M -26 -14 Q -10 -36 20 -24 L 26 -10 L -26 -6 Z" ${CONTORNO}/>`
    return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="13" ${CONTORNO}/>` + extra
  }
  let p = `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="13" fill="${v.pele}"/>` +
    `<rect x="${-s / 2}" y="${-s / 2}" width="${s * 0.3}" height="${s}" rx="11" fill="${v.peleSombra}" opacity=".55"/>`
  if (quem === 'monge') {
    // Cabeça raspada com brilho; bandana vermelha com o "!" dourado e pontas ao vento.
    p += '<ellipse cx="2" cy="-17" rx="12" ry="4" fill="#fff" opacity=".35"/>'
    p += '<path d="M -22 -12 Q -38 -8 -42 10 L -36 12 Q -33 -1 -21 -5 Z" fill="#c41f2b"/>'
    p += '<path d="M -22 -9 Q -32 2 -30 18 L -25 17 Q -26 4 -20 -4 Z" fill="#a3151f"/>'
    p += `<rect x="${-s / 2 - 1}" y="-14" width="${s + 2}" height="10" rx="3" fill="#d92b36"/>`
    p += '<circle cx="13" cy="-9" r="7.5" fill="#f6c453" stroke="#fff3c4" stroke-width="1.5"/>'
    p += '<text x="13" y="-4.6" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="12" fill="#7a2a00" text-anchor="middle">!</text>'
  } else {
    // Cabelo arrumado com franja de lado, topete rebelde e espinhas.
    p += '<path d="M -24 -6 Q -26 -26 -2 -26 Q 20 -27 24 -10 L 24 -12 Q 12 -14 4 -8 Q -2 -16 -10 -10 L -24 -4 Z" fill="#5a3a22"/>'
    p += '<path d="M -8 -25 Q -6 -36 2 -34 Q -2 -30 -1 -25 Z" fill="#5a3a22"/>'
    p += '<circle cx="3" cy="13" r="1.8" fill="#e05a5a"/><circle cx="22" cy="15" r="1.6" fill="#e05a5a"/><circle cx="-4" cy="2" r="1.5" fill="#e05a5a"/><circle cx="17" cy="-4" r="1.4" fill="#e05a5a"/>'
  }
  p += rosto(tipo, quem)
  if (quem === 'monge') {
    // Bigode branco de mestre velho; o contorno cinza não deixa sumir na pele.
    const bigode = (d: string) => `<path d="${d}" stroke="#9a948a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fbfaf6" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    p += bigode('M 13 9 Q 5 11 4 19 Q 3 26 6 31') + bigode('M 15 9 Q 22 11 23 19 Q 24 26 21 31')
  } else {
    // Óculos redondos de aro grosso, com reflexo.
    p += `<circle cx="8.5" cy="3" r="7" fill="rgba(255,255,255,.18)" stroke="${ESCURO}" stroke-width="2.6"/>`
    p += `<circle cx="20" cy="3" r="7" fill="rgba(255,255,255,.18)" stroke="${ESCURO}" stroke-width="2.6"/>`
    p += `<path d="M 15.5 3 L 13 3 M 1.5 2 L -12 0" stroke="${ESCURO}" stroke-width="2.4" stroke-linecap="round"/>`
    p += '<path d="M 5 0 l 3 -2 M 17 0 l 3 -2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>'
  }
  return p
}

function tronco(e: Esqueleto, quem: Personagem, contorno: boolean) {
  const v = VISUAL[quem]
  const w = DIM.larguraTronco
  const L = DIM.tronco
  const tr = `rotate(${n(-e.aTronco)})`
  // Coordenadas locais: +y sobe pelo tronco; -x é a frente, +x as costas.
  const mochila = v.mochila
    ? (contorno
      ? `<rect x="${w / 2 - 8}" y="8" width="24" height="${L - 8}" rx="9" ${CONTORNO}/>`
      : `<rect x="${w / 2 - 8}" y="8" width="24" height="${L - 8}" rx="9" fill="${v.mochila}"/><rect x="${w / 2 + 4}" y="8" width="12" height="${L - 8}" rx="7" fill="${v.mochilaSombra}"/><rect x="${w / 2 + 2}" y="14" width="14" height="18" rx="5" fill="#2bc06d"/>`)
    : ''
  if (contorno) return g(mochila + `<rect x="${-w / 2}" y="-14" width="${w}" height="${L + 16}" rx="12" ${CONTORNO}/>`, tr)
  let s = mochila +
    `<rect x="${-w / 2}" y="-14" width="${w}" height="${L + 16}" rx="12" fill="${v.camisa}"/>` +
    `<rect x="${w * 0.1}" y="-14" width="${w * 0.4}" height="${L + 16}" rx="10" fill="${v.camisaSombra}"/>`
  if (quem === 'monge') {
    // Hábito transpassado, faixa marrom na cintura e contas no pescoço.
    s += `<path d="M ${-w / 2 + 4} ${L} L ${w / 2 - 4} 14 L ${w / 2 - 4} 24 L ${-w / 2 + 12} ${L + 2} Z" fill="#d9731c"/>`
    s += `<rect x="${-w / 2}" y="-14" width="${w}" height="16" rx="8" fill="${v.calca}"/>`
    s += `<rect x="${-w / 2 - 1}" y="2" width="${w + 2}" height="9" rx="3" fill="#6b2a0e"/>`
    s += `<path d="M ${-w / 2 + 4} 3 L ${-w / 2 - 2} -12 L ${-w / 2 + 6} -12 Z" fill="#6b2a0e"/>`
    s += [-14, -7, 0, 7, 14].map((x, i) => `<circle cx="${x}" cy="${n(L - 4 - Math.abs(x) * 0.25)}" r="3" fill="${i % 2 ? '#7a3b1a' : '#9c5428'}"/>`).join('')
  } else {
    // Camisa social: gola, botões, bolso com o "?" e caneta; alça da mochila.
    const yBolso = L * 0.48
    s += `<rect x="${-w / 2}" y="-14" width="${w}" height="16" rx="8" fill="${v.calca}"/>`
    s += `<rect x="${-w / 2 - 1}" y="0" width="${w + 2}" height="5" rx="2" fill="#6b4420"/>`
    s += `<path d="M -10 ${L + 1} L -2 ${L - 9} L 0 ${L + 1} Z M 0 ${L + 1} L 4 ${L - 9} L 12 ${L + 1} Z" fill="#fff"/>`
    s += [10, 22, 34, 46].map((y) => `<circle cx="-2" cy="${y}" r="1.6" fill="#8fa3c8"/>`).join('')
    s += `<rect x="${-w / 2 + 3}" y="${yBolso}" width="17" height="15" rx="3" fill="#c3d4f3" stroke="#9fb3db" stroke-width="1.2"/>`
    s += `<rect x="${-w / 2 + 14}" y="${yBolso + 12}" width="3" height="9" rx="1.5" fill="#2f5bd3"/>`
    s += `<text x="${-w / 2 + 11.5}" y="${yBolso + 7}" transform="rotate(180 ${-w / 2 + 11.5} ${yBolso + 7})" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="13" fill="#5638c9" text-anchor="middle" dominant-baseline="middle">?</text>`
    s += `<rect x="${w * 0.18}" y="6" width="6" height="${L - 4}" rx="3" fill="${v.mochilaSombra}"/>`
  }
  return g(s, tr)
}

function camada(e: Esqueleto, quem: Personagem, rostoAtual: Rosto, contorno: boolean) {
  return braco(e.bt, quem, true, contorno) + perna(e.pt, quem, true, contorno) +
    tronco(e, quem, contorno) + perna(e.pf, quem, false, contorno) +
    g(cabecaLocal(quem, rostoAtual, contorno), `translate(${n(e.centroCabeca[0])} ${n(e.centroCabeca[1])}) rotate(${n(e.anguloCabeca)})`) +
    braco(e.bf, quem, false, contorno)
}

interface OpcoesBoneco {
  x: number
  /** linha do chão */
  y: number
  escala: number
  espelho?: boolean
  sombra?: boolean
}

/** Quanto subir o corpo para o ponto mais baixo, depois do giro, tocar o chão. */
function apoio(e: Esqueleto, giro: number) {
  const cosG = Math.cos(giro * RAD)
  const senG = Math.sin(giro * RAD)
  const pontos: [Ponto, number][] = [[e.bt[2], 14], [e.bf[2], 14], [e.pt[2], 14], [e.pf[2], 14], [e.pt[1], 14], [e.pf[1], 14], [e.topo, 14], [e.centroCabeca, DIM.cabeca / 2]]
  return Math.max(...pontos.map(([p, folga]) => p[0] * senG + p[1] * cosG + folga))
}

/** Boneco com os pés apoiados em y (ou suspenso pela altura da pose). */
export function boneco(quem: Personagem, pose: Pose, { x, y, escala, espelho = false, sombra = true }: OpcoesBoneco) {
  const e = esqueleto(pose)
  const giro = pose.giro ?? 0
  const alto = pose.alto ?? 0
  const base = apoio(e, giro)
  const corpo = g(camada(e, quem, pose.rosto, true) + camada(e, quem, pose.rosto, false), `translate(0 ${n(-base - alto)}) rotate(${n(giro)})`)
  const somb = sombra
    ? `<ellipse cx="0" cy="0" rx="${n(Math.max(16, 46 - alto * 0.15))}" ry="9" fill="#000" opacity="${n(Math.max(0.06, 0.28 - alto * 0.0012))}"/>`
    : ''
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(espelho ? -escala : escala)} ${n(escala)})">${somb}${corpo}</g>`
}

/** Onde a mão da frente ou o centro da cabeça cai na tela, com as mesmas opções do boneco. */
export function pontoDoCorpo(pose: Pose, parte: 'mao' | 'cabeca', { x, y, escala, espelho = false }: OpcoesBoneco): Ponto {
  const e = esqueleto(pose)
  const giro = pose.giro ?? 0
  const p = parte === 'mao' ? e.bf[2] : e.centroCabeca
  const rx = p[0] * Math.cos(giro * RAD) - p[1] * Math.sin(giro * RAD)
  const ry = p[0] * Math.sin(giro * RAD) + p[1] * Math.cos(giro * RAD)
  return [x + (espelho ? -escala : escala) * rx, y + escala * (ry - apoio(e, giro) - (pose.alto ?? 0))]
}

/** Cabeça sozinha, para os planos fechados da câmera. */
export function cabecaGrande(quem: Personagem, tipo: Rosto, x: number, y: number, escala: number, { espelho = false, giro = 0 } = {}) {
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(espelho ? -escala : escala)} ${n(escala)}) rotate(${n(giro)})">${cabecaLocal(quem, tipo, true)}${cabecaLocal(quem, tipo, false)}</g>`
}

/** Altura aproximada do boneco em pé, em unidades, para posicionar balões e estrelas. */
export const ALTURA_BONECO = 196
