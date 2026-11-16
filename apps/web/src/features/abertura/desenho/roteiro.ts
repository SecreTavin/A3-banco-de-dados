// Roteiro da abertura: as cenas A (voadora) e B (torta) se alternam sem parar,
// num corredor de universidade em 3D estilo PS1, com uma roda de alunos em volta.
//
// `quadro(tempo, palco)` é uma função pura do tempo: devolve o SVG do instante
// pedido, com o corredor à parte, porque ele não muda e só acompanha a câmera. Não há estado de física guardado entre quadros; o "molenga" do
// ragdoll é a resposta a um impulso, calculada a partir do momento do golpe, e
// os impulsos se somam em vez de recomeçar. Assim a animação não acumula erro,
// e o quadro final estático (para quem pede menos movimento) é só
// `quadro(QUADRO_ESTATICO, palco)`.

import { boneco, cabecaGrande, pontoDoCorpo, POSES, ALTURA_BONECO } from './boneco'
import type { OpcoesBoneco, Personagem, Pose } from './boneco'
import {
  aleatorio, corredor, creme, estrelasTontura, faixas, impacto, legenda, oculosVoando,
  peGrande, poeira, PONTA_DO_PE, posicaoJoia, rastro, titulo, torta, tunel,
} from './cena'
import { afimDoPlano, fazCamera, juntar } from './motor3d'
import type { Camera, Face } from './motor3d'
import { plateia } from './plateia'

export const DURACAO_CENA = 5600
export const CICLO = DURACAO_CENA * 2
/** Instante da cena A usado como imagem parada: título, monge vitorioso, nerd tonto. */
export const QUADRO_ESTATICO = 4600

export interface Palco {
  w: number
  h: number
}

// ---------------------------------------------------------------- utilidades

const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const janela = (t: number, inicio: number, fim: number) => limitar((t - inicio) / (fim - inicio))
const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)
const saida = (k: number) => 1 - (1 - k) ** 3
const mola = (k: number) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2
const n = (v: number) => v.toFixed(1)
type Par = [number, number]

function mistura(a: Pose, b: Pose, k: number): Pose {
  const par = (x: Par, y: Par): Par => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)]
  return {
    t: lerp(a.t, b.t, k), h: lerp(a.h, b.h, k),
    bt: par(a.bt, b.bt), bf: par(a.bf, b.bf), pt: par(a.pt, b.pt), pf: par(a.pf, b.pf),
    rosto: k < 0.5 ? a.rosto : b.rosto,
    alto: lerp(a.alto ?? 0, b.alto ?? 0, k),
    giro: lerp(a.giro ?? 0, b.giro ?? 0, k),
  }
}

/**
 * Transição com sobreposição de ação: o tronco lidera, cabeça e antebraços
 * chegam depois, passando um pouco do ponto; o rosto muda logo no começo.
 */
function sobrepoe(a: Pose, b: Pose, t: number, inicio: number, duracao: number): Pose {
  const L = (x: number, y: number, atraso: number) => lerp(x, y, mola(janela(t, inicio + atraso, inicio + atraso + duracao)))
  return {
    t: L(a.t, b.t, 0), h: L(a.h, b.h, 60),
    bt: [L(a.bt[0], b.bt[0], 30), L(a.bt[1], b.bt[1], 90)],
    bf: [L(a.bf[0], b.bf[0], 30), L(a.bf[1], b.bf[1], 90)],
    pt: [L(a.pt[0], b.pt[0], 0), L(a.pt[1], b.pt[1], 40)],
    pf: [L(a.pf[0], b.pf[0], 0), L(a.pf[1], b.pf[1], 40)],
    rosto: janela(t, inicio, inicio + duracao) > 0.12 ? b.rosto : a.rosto,
    alto: L(a.alto ?? 0, b.alto ?? 0, 0), giro: L(a.giro ?? 0, b.giro ?? 0, 0),
  }
}

const com = (pose: Pose, extra: Partial<Pose>): Pose => ({ ...pose, ...extra })

/** Respiração e peso passando de uma perna para a outra: ninguém fica parado. */
function respira(pose: Pose, tempo: number, fase = 0): Pose {
  const s = Math.sin(tempo / 420 + fase), s2 = Math.sin(tempo / 420 + fase - 0.8)
  return com(pose, {
    t: pose.t + s * 1.5, h: pose.h - s2 * 2.5,
    bt: [pose.bt[0] + s * 3, pose.bt[1] + s * 4], bf: [pose.bf[0] - s * 3, pose.bf[1] - s * 4],
    pt: [pose.pt[0] + s2 * 2, pose.pt[1]], pf: [pose.pf[0] - s2 * 2, pose.pf[1] + s2 * 2],
  })
}

/**
 * Ragdoll por impulso: cada articulação responde ao golpe como mola amortecida,
 * partindo de zero, para o lado do golpe; mãos e pés chegam depois (chicote).
 * Impulsos novos se somam aos anteriores, então nada estala.
 */
function ragdoll(pose: Pose, desde: number, forca: number, direcao: number): Pose {
  if (desde < 0) return pose
  const w = (2 * Math.PI) / 420
  const o = (amp: number, atraso: number) => {
    const x = desde - atraso
    return x <= 0 ? 0 : amp * forca * direcao * Math.exp(-x / 520) * Math.sin(w * x)
  }
  return com(pose, {
    t: pose.t + o(-10, 0), h: pose.h + o(26, 40),
    bt: [pose.bt[0] + o(38, 25), pose.bt[1] + o(58, 75)], bf: [pose.bf[0] + o(30, 25), pose.bf[1] + o(54, 75)],
    pt: [pose.pt[0] + o(20, 10), pose.pt[1] + o(40, 55)], pf: [pose.pf[0] + o(16, 10), pose.pf[1] + o(44, 55)],
  })
}

/** Pulo de comemoração com preparação e aterrissagem (squash). */
function pulo(pose: Pose, t: number, desde: number): { pose: Pose; deforma: Par | null } {
  if (t < desde) return { pose, deforma: null }
  const p = ((t - desde) % 560) / 560
  if (p < 0.6) return { pose: com(pose, { alto: Math.sin((Math.PI * p) / 0.6) * 13 }), deforma: null }
  const q = Math.sin((Math.PI * (p - 0.6)) / 0.4) * 0.07
  return { pose, deforma: [1 + q * 0.8, 1 - q] }
}

/** Achatamento que volta como mola, a partir do instante do contato. */
function amassa(desde: number, forca: number, decai = 100, periodo = 50): Par {
  const sq = desde < 0 ? 0 : forca * Math.exp(-desde / decai) * Math.cos(desde / periodo)
  return [1 + sq * 0.8, 1 - sq]
}

/** Tremida suave: ondas de 11 a 24 Hz com envelope que some, igual em qualquer monitor. */
function ruido(tau: number, a: number, b: number) {
  return (Math.sin(tau * a) + 0.5 * Math.sin(tau * b + 1.3)) / 1.5
}
function tremor(tau: number, duracao: number, amplitude: number): Par {
  if (tau < 0 || tau > duracao) return [0, 0]
  const I = amplitude * (1 - tau / duracao) ** 2
  return [I * ruido(tau, 0.071, 0.153), I * ruido(tau + 40, 0.083, 0.131)]
}

/** Brilho de joia no "!": acende e apaga a cada 3 s. */
function brilhoDaJoia(tempoGlobal: number) {
  const fase = tempoGlobal % 3000
  return fase < 700 ? Math.sin((Math.PI * fase) / 700) : 0
}

/** A provocação vira legenda, letra a letra, no tempo do antigo balão. */
function fala(t: number): [string, number] {
  if (t < 120 || t >= 1050) return ['', 0]
  const letras = t < 950 ? Math.ceil(janela(t, 120, 380) * 7) : 7
  return ['DUVIDO!'.slice(0, letras), t < 950 ? 1 : 1 - janela(t, 950, 1050)]
}

// -------------------------------------------------------------------- layout

interface Layout {
  w: number
  h: number
  cx: number
  /** menor dimensão: régua dos planos fechados */
  base: number
  chao: number
  escala: number
  xMonge: number
  xNerd: number
  dx: number
  fsTitulo: number
  baseTitulo: number
  /** unidade do mundo 3D: 1 no palco de 1120x720 em que a cena foi desenhada */
  u: number
  cam: Camera
  /** o plano da briga visto pela câmera: posiciona título e efeitos 2D */
  plano: string
}

const layouts = new Map<string, Layout>()

function medir({ w, h }: Palco): Layout {
  const chave = `${w}x${h}`
  const pronto = layouts.get(chave)
  if (pronto) return pronto
  const retrato = w / h < 0.85
  const escala = retrato ? limitar(w / 400, 0.55, 1.1) : limitar(h / 560, 0.7, 1.5)
  const dx = retrato ? w * 0.24 : Math.min(w * 0.18, 260 * escala)
  const chao = h * (retrato ? 0.74 : 0.8)
  const base = Math.min(w, h), u = escala / (720 / 560)
  const cx = w / 2, pivo = chao - 150 * u
  // Câmera do plano aberto: um pouco acima e de lado, vértices presos à grade.
  const cam = fazCamera({ yaw: 14, pitch: 10, f: base * 2.08, px: cx, py: pivo, grade: Math.max(2, Math.round(base / 360)) })
  const L: Layout = {
    w, h, cx, base, chao, escala, dx, u, cam,
    xMonge: cx - dx,
    xNerd: cx + dx,
    fsTitulo: retrato ? w * 0.135 : Math.min(w * 0.085, h * 0.16),
    baseTitulo: h * (retrato ? 0.26 : 0.3),
    plano: afimDoPlano(cam, cx, pivo),
  }
  layouts.set(chave, L)
  return L
}

// -------------------------------------------------------------- composição

interface Plano {
  /** plano aberto: corredor, título e plateia aparecem */
  aberto: boolean
  /** desenho 2D sob os bonecos (no plano aberto, no plano da briga) */
  cena: string
  /** faces 3D, ordenadas na hora de desenhar */
  faces: Face[]
  /** desenho 2D sobre os bonecos */
  frente: string
  /** clarão e faixas: fora da câmera */
  topo: string
  tremida: Par
  soco: [Par, number] | null
  zoom: number
  foco: Par
  legenda: [string, number]
}

const novoPlano = (L: Layout): Plano => ({
  aberto: false, cena: '', faces: [], frente: '', topo: '', tremida: [0, 0], soco: null,
  zoom: 1, foco: [L.cx, L.chao - ALTURA_BONECO * L.escala * 0.5], legenda: ['', 0],
})

const flash = (L: Layout, opacidade: number, cor = '#fff') =>
  opacidade > 0.01 ? `<rect width="${n(L.w)}" height="${n(L.h)}" fill="${cor}" opacity="${n(opacidade)}"/>` : ''

/** Fundo dos planos fechados, com sobra para a tremida não mostrar a borda. */
const fundoFechado = (L: Layout, cor = '#22304d') =>
  `<rect x="${n(-L.w * 0.08)}" y="${n(-L.h * 0.08)}" width="${n(L.w * 1.16)}" height="${n(L.h * 1.16)}" fill="${cor}"/>`

/** Pontas da bandana e bigode atrasam com o movimento: velocidade vem da posição 50 ms antes. */
function secundario(agora: { x: number; pose: Pose }, antes: { x: number; pose: Pose }, escala: number, t: number) {
  const vx = (agora.x - antes.x) / 50 / escala, va = ((agora.pose.alto ?? 0) - (antes.pose.alto ?? 0)) / 50
  return {
    cauda: limitar(vx * 110 + Math.abs(va) * 70, 0, 75) + 6 * Math.sin(t / 170),
    bigode: limitar(vx * 60 - va * 30, -12, 35) + 3 * Math.sin(t / 150),
  }
}

/**
 * Monge e nerd ficam em três quartos, como em jogo de luta: o duelo continua de
 * lado e o rosto aparece. A câmera já está girada 14° (`medir`), o que ajuda
 * quem olha para a esquerda e atrapalha quem olha para a direita; os giros
 * compensam isso para os dois verem ~50° do rosto.
 */
const TRES_QUARTOS = { direita: -64, esquerda: 36 }

function desenha(p: Plano, L: Layout, quem: Personagem, pose: Pose, o: Partial<OpcoesBoneco> & { x: number }) {
  boneco(p.faces, quem, pose, { y: L.chao, escala: L.escala, chao: L.chao, yaw: o.espelho ? TRES_QUARTOS.esquerda : TRES_QUARTOS.direita, ...o }, L.cam)
}

// ------------------------------------------------------------ cena A: voadora

const HIT = 3250
const POUSO = HIT + 420
const PAUSA_HIT = 70

interface Estado {
  pose: Pose
  x: number
  y: number
  escala: number
  deforma: Par
  estica: Par
  sombra: boolean
  estrelas: boolean
  semOculos: boolean
}

function mongeA(t: number, L: Layout): Estado {
  const E = L.escala
  let pose: Pose, x = L.xMonge, deforma: Par = [1, 1]
  if (t < 1000) pose = respira(POSES.guarda, t)
  else if (t < 1600) {
    pose = sobrepoe(POSES.guarda, POSES.prepara, t, 1000, 300)
    const c = suave(janela(t, 1150, 1450)); deforma = [1 + 0.06 * c, 1 - 0.09 * c]
  } else if (t < 3200) {
    // Depois do chute: desce da voadora perto de onde o nerd estava.
    const k = janela(t, 2600, 3050)
    x = lerp(L.xNerd - 90 * E, L.xMonge + 40 * E, saida(k))
    pose = com(mistura(POSES.voadora, POSES.guarda, saida(k)), { alto: Math.max(0, 70 * (1 - k * k) + 24 * Math.sin(Math.PI * k) * (1 - k)) })
  } else {
    x = L.xMonge + 40 * E
    pose = sobrepoe(POSES.guarda, POSES.vitoria, t, 3200, 260)
  }
  if (t >= 3050) {
    deforma = amassa(t - 3050, 0.2, 110, 55)
    const pl = pulo(pose, t, 3600)
    pose = pl.pose; if (pl.deforma) deforma = pl.deforma
  }
  return { pose, x, y: L.chao, escala: E, deforma, estica: [1, 1], sombra: true, estrelas: false, semOculos: false }
}

function nerdA(t: number, L: Layout): Estado {
  const E = L.escala, joia = posicaoJoia(L.cx, L.baseTitulo, L.fsTitulo)
  const alvoY = joia.base - L.fsTitulo * 0.1 + ALTURA_BONECO * E * 0.21
  const xQueda = limitar(joia.x, L.w * 0.14, L.w * 0.86)
  const r: Estado = { pose: POSES.guarda, x: L.xNerd, y: L.chao, escala: E, deforma: [1, 1], estica: [1, 1], sombra: true, estrelas: false, semOculos: false }
  if (t < 1600) {
    if (t < 1000) r.pose = respira(mistura(POSES.guarda, POSES.provoca, suave(janela(t, 0, 260))), t, 1)
    else {
      let p = com(sobrepoe(POSES.provoca, POSES.guarda, t, 1000, 280), { rosto: t > 1180 ? 'susto' : 'debochado' })
      if (t > 1400) {
        // Antecipação: o nerd se encolhe antes do pé chegar.
        const c = suave(janela(t, 1400, 1600))
        p = com(p, { t: p.t - 12 * c, h: p.h - 10 * c, bf: [p.bf[0] - 30 * c, p.bf[1] - 20 * c] })
        r.deforma = [1 - 0.03 * c, 1 + 0.03 * c]
      }
      r.pose = p
    }
  } else if (t < HIT) {
    // Voa em arco, girando, até o "!" do título; diminui como quem vai para o fundo.
    const k = janela(t, 2600, HIT)
    r.sombra = false; r.semOculos = true
    r.x = lerp(L.xNerd, joia.x, k); r.y = lerp(L.chao, alvoY, k) - L.h * 0.18 * 4 * k * (1 - k); r.escala = E * (1 - 0.4 * k)
    // O balanço vem do contato (2350), não da volta do corte: não recomeça.
    const base = mistura(POSES.atingido, POSES.voando, suave(janela(t, 2350, 2750)))
    r.pose = com(ragdoll(base, t - 2350, 1, 1), { giro: -30 - 540 * saida(k) })
    const st = Math.exp(-(t - 2600) / 160); r.estica = [1 - 0.12 * st, 1 + 0.18 * st]
  } else {
    // Cai do "!" até o chão, quica perdendo energia e fica tonto.
    const k = janela(t, HIT, POUSO)
    r.semOculos = true
    r.x = lerp(joia.x, xQueda, k); r.y = lerp(alvoY, L.chao, k * k); r.escala = E * lerp(0.6, 1, saida(k)); r.sombra = k > 0.6
    const soma = (b: Pose) => ragdoll(ragdoll(b, t - 2350, 1, 1), t - HIT, 0.85, -1)
    if (t < POUSO) {
      r.pose = soma(mistura(com(POSES.voando, { giro: -570 }), com(POSES.tonto, { giro: -720 }), suave(k)))
      const st = Math.exp(-(t - HIT) / 90); r.estica = [1 + 0.18 * st, 1 - 0.16 * st]
    } else {
      const tl = t - POUSO, quique = Math.abs(Math.sin(tl / 95)) * Math.exp(-tl / 150) * 26
      r.pose = ragdoll(soma(com(POSES.tonto, { alto: quique, t: POSES.tonto.t + Math.sin(t / 300) * 6 * janela(t, POUSO, POUSO + 600) })), tl, 0.6, 1)
      r.estrelas = tl > 180
      r.deforma = amassa(tl, 0.26)
    }
  }
  return r
}

function cenaA(tReal: number, L: Layout, joia: number): Plano {
  const E = L.escala, p = novoPlano(L)

  // Planos fechados: câmera atrás do pé e acerto congelado.
  if (tReal >= 1600 && tReal < 2600) {
    const t = tReal
    const headPx = L.base * (t < 2350 ? lerp(0.3, 0.46, suave(janela(t, 1600, 2350))) : 0.48)
    const hx = L.w * 0.62 + (t < 2350 ? Math.sin(t / 25) * L.base * 0.006 : 0)
    const hy = L.h * 0.44
    const contato: Par = [hx - headPx * 0.5, hy + headPx * 0.05]
    const giroPe = -22, sPe = L.base / 260
    const dirPe: Par = [Math.cos((giroPe * Math.PI) / 180), Math.sin((giroPe * Math.PI) / 180)]
    // Rápido no começo, câmera lenta nos últimos 40% antes do contato.
    const avanco = (tt: number) => { const k = janela(tt, 1600, 2350); return k < 0.6 ? saida(k / 0.6) * 0.86 : 0.86 + 0.14 * ((k - 0.6) / 0.4) }
    const inicio: Par = [-L.w * 0.2, L.h * 1.05]
    const ponta = (a: number): Par => [lerp(inicio[0], contato[0], a), lerp(inicio[1], contato[1], a)]
    const origem = (q: Par): Par => [q[0] - dirPe[0] * PONTA_DO_PE * sPe, q[1] - dirPe[1] * PONTA_DO_PE * sPe]
    const pe = origem(t < 2350 ? ponta(avanco(t)) : contato)

    if (t < 2350) {
      p.cena += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.6, { cor: '#ffd9a0', giro: t / 900, semente: 3 })
      // Nos últimos quadros o nerd fecha os olhos e encolhe a cabeça.
      const c = suave(janela(t, 2150, 2350))
      cabecaGrande(p.faces, 'nerd', t > 2230 ? 'dor' : 'susto', hx, hy, headPx / 46, { espelho: true, giro: -8 * c }, L.base)
      for (const [atraso, op] of [[60, 0.16], [30, 0.3]]) {
        if (t - atraso > 1600) { const q = origem(ponta(avanco(t - atraso))); p.frente += peGrande(q[0], q[1], sPe, giroPe, op, L.base) }
      }
      p.frente += rastro(pe[0] - dirPe[0] * L.base * 0.15, pe[1] - dirPe[1] * L.base * 0.15, L.base * 0.45, giroPe, 0.9)
      p.frente += peGrande(pe[0], pe[1], sPe, giroPe, 1, L.base)
      p.topo += flash(L, 1 - janela(t, 1600, 1690))
    } else {
      // Acerto: a cabeça achata e recua como mola, a câmera dá um soco de zoom.
      const k4 = janela(t, 2350, 2600), tau = t - 2350
      p.cena += fundoFechado(L, '#ffc46b') + tunel(contato[0], contato[1], L.w, L.h, headPx * 0.4, { cor: '#f6c453', opacidade: 0.8, semente: 9 })
      p.cena += impacto(contato[0], contato[1], headPx * (0.45 + 0.65 * saida(k4)), '#fff1a8', 0.9 - k4 * 0.5)
      const sq = 0.22 * Math.exp(-tau / 90) * Math.cos(tau / 35), rec = 1 - Math.exp(-tau / 80)
      cabecaGrande(p.faces, 'nerd', 'dor', hx + headPx * 0.16 * rec, hy - headPx * 0.03 * rec, (headPx / 46) * 1.05,
        { espelho: true, giro: 18 + 16 * rec + 6 * Math.exp(-tau / 120) * Math.sin(tau / 40), deforma: [1 - sq, 1 + sq * 0.6], semOculos: true }, L.base)
      // Os óculos saem do rosto e voam em arco.
      const u = tau / 250
      p.frente += oculosVoando(hx + headPx * (0.45 + 1.1 * u), hy - headPx * (0.1 + 1.2 * u - 0.9 * u * u), L.base / 110, 30 + 300 * saida(u))
      p.frente += peGrande(pe[0], pe[1], sPe, giroPe, 1, L.base)
      p.topo += flash(L, (1 - janela(tau, 0, 120)) ** 2 * 0.5)
      p.tremida = tremor(tau, 250, L.base * 0.03)
      p.soco = [contato, 1 + 0.06 * Math.exp(-tau / 60)]
    }
  } else {
    // Plano aberto. Pausa de 70 ms quando o nerd bate no "!".
    const t = tReal < HIT ? tReal : tReal < HIT + PAUSA_HIT ? HIT : tReal - PAUSA_HIT
    const joiaPos = posicaoJoia(L.cx, L.baseTitulo, L.fsTitulo)
    p.aberto = true

    // Título: o "!" achata como mola e o título treme quando o nerd bate nele.
    const tau = t - HIT, achata = tau >= 0 ? 0.32 * Math.exp(-tau / 130) * Math.cos(tau / 42) : 0
    const [tx, ty] = tremor(tReal - HIT, 320, L.fsTitulo * 0.08)
    const brilho = Math.max(joia, tReal >= HIT ? Math.max(0, 1 - (tReal - HIT) / 700) : 0)
    p.cena += `<g transform="translate(${n(tx)} ${n(ty)})">${titulo(L.cx, L.baseTitulo, L.fsTitulo, brilho, achata)}</g>`
    if (tReal >= HIT && tReal < HIT + 350) p.cena += impacto(joiaPos.x, joiaPos.topo + L.fsTitulo * 0.3, L.fsTitulo * 0.45, '#fff6cf', 1 - (tReal - HIT) / 350)

    // Monge.
    const m = mongeA(t, L), sec = secundario(m, mongeA(t - 50, L), E, t)
    if (t >= 1000 && t < 1600) p.cena += rastro(m.x - 30 * E, L.chao - 90 * E, 90 * E, 0, janela(t, 1100, 1400))
    desenha(p, L, 'monge', m.pose, { x: m.x, deforma: m.deforma, ...sec, piscando: t % 2700 < 110 })

    // Nerd, com duas silhuetas atrás no voo.
    const nd = nerdA(t, L)
    if (t >= 2600 && t < HIT) {
      for (const [atraso, op] of [[90, 0.16], [45, 0.3]]) {
        if (t - atraso > 2600) {
          const a = nerdA(t - atraso, L)
          desenha(p, L, 'nerd', a.pose, { x: a.x, y: a.y, escala: a.escala, espelho: true, estica: a.estica, opacidade: op, sombra: false, semOculos: true })
        }
      }
      p.cena += rastro(nd.x + 30 * E, nd.y - 80 * E, 120 * E, -35, 0.6)
    }
    desenha(p, L, 'nerd', nd.pose, { x: nd.x, y: nd.y, escala: nd.escala, espelho: true, deforma: nd.deforma, estica: nd.estica, sombra: nd.sombra, semOculos: nd.semOculos, piscando: (t + 1300) % 2700 < 110 })
    if (t < 1600) p.legenda = fala(t)
    if (nd.estrelas) {
      const [cx, cy] = pontoDoCorpo(nd.pose, 'cabeca', { x: nd.x, y: nd.y, escala: E, espelho: true })
      p.frente += estrelasTontura(cx, cy - 36 * E, 34 * E, tReal)
    }

    // Poeira nos pousos e os óculos caindo depois de voar no plano fechado.
    p.frente += poeira(L.xMonge + 40 * E, L.chao, t - 3050, E) + poeira(nd.x, L.chao, t - POUSO, E)
    if (t >= 2600) {
      const tq = Math.min(1, (t - 2600) / 640)
      p.frente += oculosVoando(L.xNerd + L.dx * 0.75 - 32 * E * tq, lerp(-30, L.chao - 5 * E, tq * tq), E * 0.9, 40 + 576 * tq)
    }
    p.tremida = tremor(tReal - (POUSO + PAUSA_HIT), 220, 5 * L.u)

    // A câmera se aproxima enquanto o monge se prepara e chega ao aberto ainda se afastando.
    if (tReal >= 1000 && tReal < 1600) p.zoom = 1 + 0.16 * suave(janela(tReal, 1000, 1550))
    if (tReal >= 2600 && tReal < 2950) { p.zoom = 1 + 0.07 * (1 - saida(janela(tReal, 2600, 2950))); p.foco = [L.xNerd, L.chao - ALTURA_BONECO * E * 0.6] }
  }

  // Faixas de cinema: entram no corte e saem já no plano aberto.
  const kFaixa = tReal < 2600 ? janela(tReal, 1600, 1700) : 1 - janela(tReal, 2600, 2750)
  if (kFaixa > 0) p.topo += faixas(L.w, L.h, kFaixa)
  return p
}

// --------------------------------------------------------------- cena B: torta

const SPLAT = 2250

const xMongeB = (t: number, L: Layout) => (t < 2500 ? L.xMonge : L.xMonge - 30 * L.escala * saida(janela(t, 2500, 2850)))

function mongeB(t: number, L: Layout) {
  let pose: Pose, deforma: Par = [1, 1]
  if (t < 1000) pose = respira(POSES.provoca, t)
  else if (t < 1450) pose = com(sobrepoe(POSES.provoca, POSES.guarda, t, 1000, 280), { rosto: t > 1180 ? 'susto' : 'debochado' })
  else {
    // O recuo continua o impacto do splat, sem recomeçar na volta do corte.
    const k = janela(t, 2500, 2850)
    pose = ragdoll(com(POSES.melado, { alto: 30 * Math.sin(Math.PI * k), t: POSES.melado.t + Math.sin(t / 340) * 4 }), t - SPLAT, 0.8, 1)
    if (t >= 2850) deforma = amassa(t - 2850, 0.16)
  }
  return { pose, x: xMongeB(t, L), deforma }
}

function nerdB(t: number) {
  let pose: Pose, deforma: Par = [1, 1]
  if (t < 1000) pose = respira(mistura(POSES.guarda, POSES.pegaTorta, suave(janela(t, 300, 700))), t, 1)
  // O braço recua antes de lançar e passa do ponto no arremesso.
  else if (t < 1450) pose = sobrepoe(sobrepoe(POSES.pegaTorta, POSES.recua, t, 1000, 110), POSES.arremessa, t, 1130, 140)
  else {
    const pl = pulo(sobrepoe(POSES.arremessa, POSES.vitoria, t, 2600, 250), t, 2950)
    pose = pl.pose; if (pl.deforma) deforma = pl.deforma
  }
  return { pose, deforma }
}

function cenaB(t: number, L: Layout, joia: number): Plano {
  const E = L.escala, p = novoPlano(L)

  if (t >= 1450 && t < 2500) {
    if (t < SPLAT) {
      // Câmera atrás da torta: o rosto do monge cresce até encher a tela.
      const k = janela(t, 1450, SPLAT)
      const avanco = k < 0.7 ? (k / 0.7) ** 1.6 * 0.8 : 0.8 + 0.2 * ((k - 0.7) / 0.3)
      const headPx = L.base * lerp(0.1, 0.42, avanco), hx = L.cx, hy = L.h * 0.38
      p.cena += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.7, { cor: '#ffd9a0', giro: -t / 700, semente: 11 })
      // No fim, o monge fecha os olhos e encolhe a cabeça, esperando o golpe.
      const c = suave(janela(t, 2080, SPLAT))
      cabecaGrande(p.faces, 'monge', t > 2120 ? 'dor' : 'susto', hx, hy, headPx / 46, { giro: -7 * c }, L.base)
      const sTorta = L.base / 78
      const tx = L.cx + Math.sin(t / 90) * L.base * 0.008, ty = L.h * 0.74 + Math.cos(t / 110) * L.base * 0.006
      p.frente += torta(tx, ty + L.base * 0.03, sTorta * 1.08, 0, 0.35) + torta(tx, ty, sTorta, Math.sin(t / 200) * 6)
      p.topo += flash(L, 1 - janela(t, 1450, 1540))
    } else {
      // Splat: a torta fica 80 ms achatada no rosto antes de estourar.
      const tau = t - SPLAT, headPx = L.base * 0.5, hx = L.cx - headPx * 0.15, hy = L.h * 0.46, cx = hx + headPx * 0.32
      p.cena += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.6, { cor: '#ffd9a0', opacidade: 0.6, semente: 4 })
      const rec = 1 - Math.exp(-tau / 90), sq = 0.18 * Math.exp(-tau / 90) * Math.cos(tau / 35)
      cabecaGrande(p.faces, 'monge', 'dor', hx - headPx * 0.04 * rec, hy, (headPx / 46) * (1 - 0.05 * rec),
        { giro: -10 * rec - 5 * Math.exp(-tau / 120) * Math.sin(tau / 40), deforma: [1 + sq * 0.5, 1 - sq] }, L.base)
      if (tau < 80) p.frente += torta(cx - headPx * 0.12, hy, headPx / 62, -6, 1, [1.35, 0.55])
      else {
        const kc = saida(janela(tau, 80, 250))
        p.frente += impacto(cx, hy, headPx * (0.45 + 0.5 * kc), '#fff6e8', 0.75 - kc * 0.45)
        p.frente += creme(cx, hy, (headPx / 80) * (0.5 + 0.75 * kc), 8, 0.4 + 1.3 * kc)
        p.frente += creme(cx + headPx * 0.05, hy - headPx * 0.04, (headPx / 110) * (0.5 + 0.65 * kc), 2, 0.3 + 1.1 * kc)
      }
      p.topo += flash(L, tau < 80 ? 0.2 : (1 - janela(tau, 80, 200)) ** 2 * 0.35, '#fff6e8')
      p.tremida = tremor(tau, 250, L.base * 0.03)
      p.soco = [[cx, hy], 1 + 0.06 * Math.exp(-Math.max(0, tau - 80) / 60)]
    }
  } else {
    p.aberto = true
    // O título pulsa como mola quando a torta acerta.
    const tau = t - 2500, pulso = tau >= 0 ? 1 + 0.13 * Math.exp(-tau / 220) * Math.sin(tau / 55) : 1
    const brilho = Math.max(joia, t >= 2500 ? Math.max(0, 1 - (t - 2500) / 700) : 0)
    p.cena += `<g transform="translate(${n(L.cx)} ${n(L.baseTitulo)}) scale(${pulso.toFixed(3)}) translate(${n(-L.cx)} ${n(-L.baseTitulo)})">${titulo(L.cx, L.baseTitulo, L.fsTitulo, brilho)}</g>`

    // Monge.
    const m = mongeB(t, L), sec = secundario(m, mongeB(t - 50, L), E, t)
    desenha(p, L, 'monge', m.pose, { x: m.x, deforma: m.deforma, ...sec, piscando: t % 2700 < 110 })
    if (t < 1000) p.legenda = fala(t)
    const cabecaMonge = pontoDoCorpo(m.pose, 'cabeca', { x: m.x, y: L.chao, escala: E })
    if (t >= 2500) {
      // Gotas de creme escorrendo do rosto.
      const [cx, cy] = cabecaMonge, rnd = aleatorio(21)
      for (let i = 0; i < 4; i++) {
        const atraso = i * 260 + rnd() * 120
        const d = (((t - 2500 - atraso) % 1100) + 1100) % 1100
        const y = cy + 18 * E + (d / 1000) ** 2 * 140 * E
        if (y < L.chao) p.frente += `<circle cx="${n(cx + (rnd() * 30 - 8) * E)}" cy="${n(y)}" r="${n((3 + rnd() * 2) * E)}" fill="#fff6e8"/>`
      }
    }

    // Nerd.
    const nb = nerdB(t)
    desenha(p, L, 'nerd', nb.pose, { x: L.xNerd, espelho: true, deforma: nb.deforma, piscando: (t + 1300) % 2700 < 110 })

    // A torta: aparece na mão, é lançada girando e some no corte de câmera.
    if (t >= 500 && t < 1450) {
      const mao = pontoDoCorpo(nb.pose, 'mao', { x: L.xNerd, y: L.chao, escala: E, espelho: true })
      const kVoo = saida(janela(t, 1250, 1450))
      const x = lerp(mao[0], lerp(mao[0], cabecaMonge[0], 0.6), kVoo)
      const y = lerp(mao[1], lerp(mao[1], cabecaMonge[1], 0.6), kVoo) - 30 * E * Math.sin(Math.PI * kVoo)
      if (kVoo > 0) p.frente += rastro(x + 50 * E, y, 60 * E, 0, kVoo)
      p.frente += torta(x, y - 6 * E, E * 0.85 * mola(janela(t, 500, 750)), -kVoo * 40)
    }
    p.frente += poeira(xMongeB(2850, L), L.chao, t - 2850, E)

    if (t >= 1000 && t < 1450) { p.zoom = 1 + 0.14 * suave(janela(t, 1000, 1400)); p.foco = [L.xNerd, L.chao - ALTURA_BONECO * E * 0.55] }
    if (t >= 2500 && t < 2850) { p.zoom = 1 + 0.07 * (1 - saida(janela(t, 2500, 2850))); p.foco = [L.xMonge, L.chao - ALTURA_BONECO * E * 0.6] }
  }

  const kFaixa = t < 2500 ? janela(t, 1450, 1550) : 1 - janela(t, 2500, 2650)
  if (kFaixa > 0) p.topo += faixas(L.w, L.h, kFaixa)
  return p
}

// ------------------------------------------------------------------- quadro

const GOLPES = { A: [2350, HIT, POUSO], B: [SPLAT, 2850] }

export interface Quadro {
  /** corredor: o mesmo texto enquanto o palco não muda de tamanho */
  fundo: string
  /** câmera aplicada ao corredor (tremida, soco e zoom) */
  camera: string
  /** a mesma câmera em números: x' = escala * x + dx (idem y) */
  cameraNumeros: [number, number, number]
  /** plano aberto: o corredor aparece; nos fechados ele fica escondido */
  aberto: boolean
  /** tudo o que se move */
  cena: string
}

/** O instante `tempo` (ms desde o início), já no tamanho do palco. */
export function quadro(tempo: number, palco: Palco, { brilho = true } = {}): Quadro {
  // Palco ainda sem medida (tela escondida): sem câmera possível, nada a desenhar.
  if (palco.w < 1 || palco.h < 1) return { fundo: '', camera: '', cameraNumeros: [1, 0, 0], aberto: false, cena: '' }
  const L = medir(palco)
  const tempoCiclo = ((tempo % CICLO) + CICLO) % CICLO
  const naCenaA = tempoCiclo < DURACAO_CENA
  const t = naCenaA ? tempoCiclo : tempoCiclo - DURACAO_CENA
  const joia = brilho ? brilhoDaJoia(tempo) : 0
  const p = naCenaA ? cenaA(t, L, joia) : cenaB(t, L, joia)

  // A roda de alunos só aparece nos planos abertos.
  if (p.aberto) {
    for (const a of plateia(t, naCenaA ? GOLPES.A : GOLPES.B, { cx: L.cx, dx: L.dx, chao: L.chao, escala: L.escala, u: L.u })) {
      boneco(p.faces, 'aluno', a.pose, { ...a.opcoes, chao: L.chao }, L.cam)
    }
  }

  let camera = `translate(${n(p.tremida[0])} ${n(p.tremida[1])})`
  if (p.soco) camera += ` translate(${n(p.soco[0][0])} ${n(p.soco[0][1])}) scale(${p.soco[1].toFixed(3)}) translate(${n(-p.soco[0][0])} ${n(-p.soco[0][1])})`
  if (p.zoom !== 1) camera += ` translate(${n(p.foco[0])} ${n(p.foco[1])}) scale(${p.zoom.toFixed(3)}) translate(${n(-p.foco[0])} ${n(-p.foco[1])})`
  const plano = p.aberto ? ` transform="${L.plano}"` : ''

  // Escurece rápido na troca de cena.
  const troca = Math.max(1 - janela(t, 0, 260), janela(t, DURACAO_CENA - 260, DURACAO_CENA))
  const cena = `<g transform="${camera}"><g${plano}>${p.cena}</g>${juntar(p.faces)}<g${plano}>${p.frente}</g></g>${p.topo}` +
    legenda(p.legenda[0], p.legenda[1], L.w, L.h) +
    (troca > 0.01 ? `<rect width="${n(L.w)}" height="${n(L.h)}" fill="#120c33" opacity="${n(troca)}"/>` : '')
  // Tremida, soco e zoom são escala uniforme mais deslocamento: x' = s·z·x + d.
  const [s, ps] = p.soco ? [p.soco[1], p.soco[0]] : [1, [0, 0] as Par]
  const z = p.zoom, d = (i: 0 | 1) => s * (p.foco[i] - z * p.foco[i] - ps[i]) + ps[i] + p.tremida[i]
  return {
    fundo: corredor({ w: L.w, h: L.h, cx: L.cx, chao: L.chao, u: L.u, cam: L.cam, tituloTopo: L.baseTitulo - L.fsTitulo }),
    camera, cameraNumeros: [s * z, d(0), d(1)], aberto: p.aberto, cena,
  }
}
