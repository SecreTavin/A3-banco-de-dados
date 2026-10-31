// Roteiro da abertura: as cenas A (voadora) e B (torta) se alternam sem parar.
//
// `quadro(tempo, palco)` é uma função pura do tempo: devolve o SVG do instante
// pedido. Não há estado de física guardado entre quadros; o "molenga" do
// ragdoll é uma oscilação amortecida calculada a partir do momento do golpe.
// Assim a animação não acumula erro, e o quadro final estático (para quem
// pede menos movimento) é só `quadro(QUADRO_ESTATICO, palco)`.

import { boneco, cabecaGrande, pontoDoCorpo, POSES, ALTURA_BONECO } from './boneco'
import type { Pose } from './boneco'
import {
  aleatorio, balao, creme, estrelasTontura, faixas, impacto, oculosVoando,
  peGrande, PONTA_DO_PE, posicaoJoia, rastro, titulo, torta, tunel,
} from './cena'

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

function mistura(a: Pose, b: Pose, k: number): Pose {
  const par = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)]
  return {
    t: lerp(a.t, b.t, k), h: lerp(a.h, b.h, k),
    bt: par(a.bt, b.bt), bf: par(a.bf, b.bf), pt: par(a.pt, b.pt), pf: par(a.pf, b.pf),
    rosto: k < 0.5 ? a.rosto : b.rosto,
    alto: lerp(a.alto ?? 0, b.alto ?? 0, k),
    giro: lerp(a.giro ?? 0, b.giro ?? 0, k),
  }
}

const com = (pose: Pose, extra: Partial<Pose>): Pose => ({ ...pose, ...extra })

/** Respiração: o boneco nunca fica totalmente parado. */
function respira(pose: Pose, tempo: number, fase = 0): Pose {
  const s = Math.sin(tempo / 420 + fase)
  return com(pose, {
    t: pose.t + s * 1.5,
    bt: [pose.bt[0] + s * 3, pose.bt[1] + s * 4],
    bf: [pose.bf[0] - s * 3, pose.bf[1] - s * 4],
  })
}

/**
 * Ragdoll: cada articulação balança numa oscilação amortecida a partir do
 * golpe, com amplitude, frequência e fase próprias. O corpo parece solto sem
 * simulação passo a passo.
 */
function molenga(pose: Pose, desde: number, forca: number, semente: number): Pose {
  if (desde < 0) return pose
  const rnd = aleatorio(semente)
  const amortece = Math.exp(-desde / 420) * forca
  const balanco = () => {
    const amplitude = 25 + rnd() * 35
    const periodo = 70 + rnd() * 60
    const fase = rnd() * Math.PI * 2
    return amplitude * amortece * Math.sin(desde / periodo + fase)
  }
  return com(pose, {
    t: pose.t + balanco() * 0.4, h: pose.h + balanco() * 0.6,
    bt: [pose.bt[0] + balanco(), pose.bt[1] + balanco()],
    bf: [pose.bf[0] + balanco(), pose.bf[1] + balanco()],
    pt: [pose.pt[0] + balanco() * 0.7, pose.pt[1] + balanco() * 0.7],
    pf: [pose.pf[0] + balanco() * 0.7, pose.pf[1] + balanco() * 0.7],
  })
}

/** Pulinho periódico de comemoração. */
const pulinho = (tempo: number, altura: number) => Math.max(0, Math.sin(tempo / 230)) * altura

/** Brilho de joia no "!": acende e apaga a cada 3 s. */
function brilhoDaJoia(tempoGlobal: number) {
  const fase = tempoGlobal % 3000
  return fase < 700 ? Math.sin((Math.PI * fase) / 700) : 0
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
  fsTitulo: number
  baseTitulo: number
}

function medir({ w, h }: Palco): Layout {
  const retrato = w / h < 0.85
  const escala = retrato ? limitar(w / 400, 0.55, 1.1) : limitar(h / 560, 0.7, 1.5)
  const dx = retrato ? w * 0.24 : Math.min(w * 0.18, 260 * escala)
  return {
    w, h, cx: w / 2, base: Math.min(w, h),
    chao: h * (retrato ? 0.74 : 0.8),
    escala,
    xMonge: w / 2 - dx,
    xNerd: w / 2 + dx,
    fsTitulo: retrato ? w * 0.135 : Math.min(w * 0.085, h * 0.16),
    baseTitulo: h * (retrato ? 0.26 : 0.3),
  }
}

// -------------------------------------------------------------- composição

interface Plano {
  /** camadas sob a câmera (cenário aberto) */
  cena: string
  /** camadas fora da câmera: planos fechados, flash, faixas */
  frente: string
  zoom: number
  foco: [number, number]
}

const chaoSombra = (L: Layout) =>
  `<ellipse cx="${n(L.cx)}" cy="${n(L.chao + 6)}" rx="${n(L.w * 0.44)}" ry="${n(L.h * 0.035)}" fill="#000" opacity=".22"/>`

const flash = (L: Layout, opacidade: number, cor = '#fff') =>
  opacidade > 0.01 ? `<rect width="${n(L.w)}" height="${n(L.h)}" fill="${cor}" opacity="${n(opacidade)}"/>` : ''

function tremer(tempo: number, intensidade: number): [number, number] {
  return [Math.sin(tempo * 0.9) * intensidade, Math.cos(tempo * 1.3) * intensidade]
}

const fundoFechado = (L: Layout) => `<rect width="${n(L.w)}" height="${n(L.h)}" fill="#2e2185"/>`

// ------------------------------------------------------------ cena A: voadora

function cenaA(t: number, L: Layout, joia: number): Plano {
  const { escala: E, chao } = L
  const opcoesMonge = (x: number) => ({ x, y: chao, escala: E })
  const opcoesNerd = (x: number) => ({ x, y: chao, escala: E, espelho: true })
  const joiaPos = posicaoJoia(L.cx, L.baseTitulo, L.fsTitulo)
  const xQueda = limitar(joiaPos.x, L.w * 0.14, L.w * 0.86)
  const HIT = 3250
  const plano: Plano = { cena: '', frente: '', zoom: 1, foco: [L.cx, chao - ALTURA_BONECO * E * 0.5] }

  // Planos fechados: câmera atrás do pé e acerto congelado.
  if (t >= 1600 && t < 2600) {
    const headPx = L.base * (t < 2350 ? lerp(0.3, 0.46, suave(janela(t, 1600, 2350))) : 0.48)
    const hx = L.w * 0.62 + (t < 2350 ? Math.sin(t / 25) * L.base * 0.006 : 0)
    const hy = L.h * 0.44
    const contato: [number, number] = [hx - headPx * 0.5, hy + headPx * 0.05]
    const giroPe = -22
    const sPe = L.base / 260
    const dirPe: [number, number] = [Math.cos(giroPe * Math.PI / 180), Math.sin(giroPe * Math.PI / 180)]
    // Rápido no começo, câmera lenta nos últimos 40% antes do contato.
    const k = janela(t, 1600, 2350)
    const avanco = k < 0.6 ? saida(k / 0.6) * 0.86 : 0.86 + 0.14 * ((k - 0.6) / 0.4)
    const inicio: [number, number] = [-L.w * 0.2, L.h * 1.05]
    const ponta: [number, number] = t < 2350 ? [lerp(inicio[0], contato[0], avanco), lerp(inicio[1], contato[1], avanco)] : contato
    const origemPe: [number, number] = [ponta[0] - dirPe[0] * PONTA_DO_PE * sPe, ponta[1] - dirPe[1] * PONTA_DO_PE * sPe]

    if (t < 2350) {
      plano.frente += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.6, { giro: t / 900, semente: 3 })
      plano.frente += cabecaGrande('nerd', 'susto', hx, hy, headPx / 46, { espelho: true })
      plano.frente += rastro(origemPe[0] - dirPe[0] * L.base * 0.15, origemPe[1] - dirPe[1] * L.base * 0.15, L.base * 0.45, giroPe, 0.9)
      plano.frente += peGrande(origemPe[0], origemPe[1], sPe, giroPe)
      plano.frente += flash(L, 1 - janela(t, 1600, 1690))
    } else {
      const k4 = janela(t, 2350, 2600)
      plano.frente += `<rect width="${n(L.w)}" height="${n(L.h)}" fill="#fff6cf"/>`
      plano.frente += tunel(contato[0], contato[1], L.w, L.h, headPx * 0.4, { cor: '#f6c453', opacidade: 0.8, semente: 9 })
      plano.frente += impacto(contato[0], contato[1], headPx * (0.5 + 0.5 * k4), '#fff', 0.8 - k4 * 0.4)
      plano.frente += cabecaGrande('nerd', 'dor', hx + headPx * 0.1 * k4, hy, headPx / 46 * 1.05, { espelho: true, giro: 18 + 10 * k4 })
      plano.frente += oculosVoando(hx + headPx * (0.5 + k4), hy - headPx * (0.5 + k4 * 0.8), L.base / 110, 30 + k4 * 260)
      plano.frente += peGrande(origemPe[0], origemPe[1], sPe, giroPe)
      plano.frente += flash(L, (1 - k4) ** 2 * 0.5)
      const [tx, ty] = tremer(t, L.base * 0.03 * (1 - k4))
      plano.frente = `<g transform="translate(${n(tx)} ${n(ty)})">${plano.frente}</g>`
    }
  } else {
    // Plano aberto.
    plano.cena += chaoSombra(L)

    // Título: treme quando o nerd bate no "!".
    const batida = t >= HIT ? Math.exp(-(t - HIT) / 160) : 0
    const [tx, ty] = tremer(t, L.fsTitulo * 0.12 * batida)
    const brilho = Math.max(joia, t >= HIT ? Math.max(0, 1 - (t - HIT) / 700) : 0)
    plano.cena += `<g transform="translate(${n(tx)} ${n(ty)})">${titulo(L.cx, L.baseTitulo, L.fsTitulo, brilho)}</g>`
    if (t >= HIT && t < HIT + 350) plano.cena += impacto(joiaPos.x, joiaPos.topo + L.fsTitulo * 0.3, L.fsTitulo * 0.45, '#fff6cf', 1 - (t - HIT) / 350)

    // Monge.
    let poseMonge: Pose
    let xMonge = L.xMonge
    if (t < 1000) poseMonge = respira(POSES.guarda, t)
    else if (t < 1600) poseMonge = mistura(POSES.guarda, POSES.prepara, suave(janela(t, 1000, 1350)))
    else if (t < 3200) {
      // Depois do chute: desce da voadora perto de onde o nerd estava.
      const k = janela(t, 2600, 3050)
      xMonge = lerp(L.xNerd - 90 * E, L.xMonge + 40 * E, saida(k))
      poseMonge = com(mistura(POSES.voadora, POSES.guarda, saida(k)), { alto: 70 * (1 - k * k) })
    } else {
      xMonge = L.xMonge + 40 * E
      const k = janela(t, 3200, 3450)
      poseMonge = com(mistura(POSES.guarda, POSES.vitoria, mola(k)), { alto: k >= 1 ? pulinho(t, 10) : 0 })
    }
    if (t >= 1000 && t < 1600) plano.cena += rastro(xMonge - 30 * E, chao - 90 * E, 90 * E, 0, janela(t, 1100, 1400))
    plano.cena += boneco('monge', poseMonge, opcoesMonge(xMonge))

    // Nerd.
    if (t < 1600) {
      const pose = t < 1000
        ? respira(mistura(POSES.guarda, POSES.provoca, suave(janela(t, 0, 260))), t, 1)
        : com(mistura(POSES.provoca, POSES.guarda, suave(janela(t, 1000, 1300))), { rosto: t > 1250 ? 'susto' : 'debochado' })
      plano.cena += boneco('nerd', pose, opcoesNerd(L.xNerd))
      const kBalao = t < 950 ? mola(janela(t, 120, 380)) : 1 - janela(t, 950, 1050)
      const [bx, by] = pontoDoCorpo(pose, 'cabeca', opcoesNerd(L.xNerd))
      plano.cena += balao(bx - 20 * E, by - 70 * E, 'Duvido!', E * 1.1, -1, kBalao)
    } else if (t < HIT) {
      // Voa em arco, girando, até o "!" do título; diminui como quem vai para o
      // fundo da cena, para não cobrir as letras.
      const k = janela(t, 2600, HIT)
      const alvoY = joiaPos.base - L.fsTitulo * 0.1 + ALTURA_BONECO * E * 0.21
      const x = lerp(L.xNerd, joiaPos.x, k)
      const y = lerp(chao, alvoY, k) - L.h * 0.18 * 4 * k * (1 - k)
      const pose = com(molenga(POSES.voando, t - 2600, 1, 7), { giro: -30 - 540 * k })
      plano.cena += rastro(x + 30 * E, y - 80 * E, 120 * E, -35, 0.6)
      plano.cena += boneco('nerd', pose, { ...opcoesNerd(x), y, escala: E * (1 - 0.4 * k), sombra: false })
    } else {
      // Cai do "!" até o chão, logo abaixo dele, e fica tonto.
      const k = janela(t, HIT, HIT + 420)
      const yTopo = joiaPos.base - L.fsTitulo * 0.1 + ALTURA_BONECO * E * 0.21
      const escalaQueda = E * lerp(0.6, 1, saida(k))
      const y = lerp(yTopo, chao, k * k)
      const x = lerp(joiaPos.x, xQueda, k)
      const quique = t > HIT + 420 ? Math.abs(Math.sin((t - HIT - 420) / 70)) * Math.exp(-(t - HIT - 420) / 120) * 18 : 0
      let pose = com(mistura(com(POSES.voando, { giro: -570 }), com(POSES.tonto, { giro: -720 }), saida(k)), { alto: quique })
      pose = molenga(pose, t - HIT, 0.7, 11)
      if (k >= 1) pose = com(molenga(com(POSES.tonto, { alto: quique }), t - HIT, 0.5, 11), { t: POSES.tonto.t + Math.sin(t / 300) * 6 })
      plano.cena += boneco('nerd', pose, { ...opcoesNerd(x), y, escala: escalaQueda, sombra: k > 0.6 })
      if (k >= 1) {
        const [cx, cy] = pontoDoCorpo(pose, 'cabeca', { ...opcoesNerd(x), y })
        plano.cena += estrelasTontura(cx, cy - 36 * E, 34 * E, t)
      }
    }

    // A câmera se aproxima enquanto o monge se prepara.
    if (t >= 1000 && t < 1600) plano.zoom = 1 + 0.16 * suave(janela(t, 1000, 1550))
  }

  // Faixas de cinema: entram no corte e saem já no plano aberto.
  const kFaixa = t < 2600 ? janela(t, 1600, 1700) : 1 - janela(t, 2600, 2750)
  if (kFaixa > 0) plano.frente += faixas(L.w, L.h, kFaixa)
  return plano
}

// --------------------------------------------------------------- cena B: torta

function cenaB(t: number, L: Layout, joia: number): Plano {
  const { escala: E, chao } = L
  const opcoesMonge = (x: number) => ({ x, y: chao, escala: E })
  const opcoesNerd = (x: number) => ({ x, y: chao, escala: E, espelho: true })
  const SPLAT = 2250
  const plano: Plano = { cena: '', frente: '', zoom: 1, foco: [L.cx, chao - ALTURA_BONECO * E * 0.5] }

  if (t >= 1450 && t < 2500) {
    if (t < SPLAT) {
      // Câmera atrás da torta: o rosto do monge cresce até encher a tela.
      const k = janela(t, 1450, SPLAT)
      const avanco = k < 0.7 ? (k / 0.7) ** 1.6 * 0.8 : 0.8 + 0.2 * ((k - 0.7) / 0.3)
      const headPx = L.base * lerp(0.1, 0.42, avanco)
      const hx = L.cx
      const hy = L.h * 0.38
      plano.frente += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.7, { giro: -t / 700, semente: 11 })
      plano.frente += cabecaGrande('monge', 'susto', hx, hy, headPx / 46)
      const sTorta = L.base / 78
      const tx = L.cx + Math.sin(t / 90) * L.base * 0.008
      const ty = L.h * 0.74 + Math.cos(t / 110) * L.base * 0.006
      plano.frente += `<g opacity=".35">${torta(tx, ty + L.base * 0.03, sTorta * 1.08, 0)}</g>`
      plano.frente += torta(tx, ty, sTorta, Math.sin(t / 200) * 6)
      plano.frente += flash(L, 1 - janela(t, 1450, 1540))
    } else {
      // Splat congelado: creme abrindo no rosto, respingos e tremida.
      const k = janela(t, SPLAT, 2500)
      const headPx = L.base * 0.5
      const hx = L.cx - headPx * 0.15
      const hy = L.h * 0.46
      plano.frente += fundoFechado(L) + tunel(hx, hy, L.w, L.h, headPx * 0.6, { opacidade: 0.6, semente: 4 })
      plano.frente += cabecaGrande('monge', 'susto', hx, hy, headPx / 46, { giro: -8 * k })
      const cx = hx + headPx * 0.32
      plano.frente += impacto(cx, hy, headPx * (0.45 + 0.4 * k), '#fff6e8', 0.65 - k * 0.35)
      plano.frente += creme(cx, hy, (headPx / 80) * (0.5 + 0.7 * saida(k)), 8, 0.4 + 1.2 * k)
      plano.frente += creme(cx + headPx * 0.05, hy - headPx * 0.04, (headPx / 110) * (0.5 + 0.6 * saida(k)), 2, 0.3 + k)
      plano.frente += flash(L, (1 - k) ** 2 * 0.4, '#fff6e8')
      const [tx, ty] = tremer(t, L.base * 0.03 * (1 - k))
      plano.frente = `<g transform="translate(${n(tx)} ${n(ty)})">${plano.frente}</g>`
    }
  } else {
    plano.cena += chaoSombra(L)
    const pulso = t >= 2500 ? 1 + 0.1 * Math.sin(Math.PI * janela(t, 2500, 2800)) : 1
    const brilho = Math.max(joia, t >= 2500 ? Math.max(0, 1 - (t - 2500) / 700) : 0)
    plano.cena += `<g transform="translate(${n(L.cx)} ${n(L.baseTitulo)}) scale(${n(pulso)}) translate(${n(-L.cx)} ${n(-L.baseTitulo)})">${titulo(L.cx, L.baseTitulo, L.fsTitulo, brilho)}</g>`

    // Monge.
    let poseMonge: Pose
    let xMonge = L.xMonge
    if (t < 1000) poseMonge = respira(POSES.provoca, t)
    else if (t < 1450) poseMonge = com(mistura(POSES.provoca, POSES.guarda, suave(janela(t, 1000, 1300))), { rosto: t > 1250 ? 'susto' : 'debochado' })
    else {
      // Recua com o golpe, ainda molenga, e fica com a cara melada.
      const k = janela(t, 2500, 2850)
      xMonge = L.xMonge - 30 * E * saida(k)
      const pose = com(POSES.melado, { alto: 30 * Math.sin(Math.PI * k), t: POSES.melado.t + Math.sin(t / 340) * 4 })
      poseMonge = molenga(pose, t - 2500, 0.8, 5)
    }
    plano.cena += boneco('monge', poseMonge, opcoesMonge(xMonge))
    if (t < 1000) {
      const kBalao = t < 950 ? mola(janela(t, 120, 380)) : 1 - janela(t, 950, 1050)
      const [bx, by] = pontoDoCorpo(poseMonge, 'cabeca', opcoesMonge(xMonge))
      plano.cena += balao(bx + 20 * E, by - 70 * E, 'Duvido!', E * 1.1, 1, kBalao)
    }
    if (t >= 2500) {
      // Gotas de creme escorrendo do rosto.
      const [cx, cy] = pontoDoCorpo(poseMonge, 'cabeca', opcoesMonge(xMonge))
      const rnd = aleatorio(21)
      for (let i = 0; i < 4; i++) {
        const atraso = i * 260 + rnd() * 120
        const d = ((t - 2500 - atraso) % 1100 + 1100) % 1100
        const y = cy + 18 * E + (d / 1000) ** 2 * 140 * E
        if (y < chao) plano.cena += `<circle cx="${n(cx + (rnd() * 30 - 8) * E)}" cy="${n(y)}" r="${n((3 + rnd() * 2) * E)}" fill="#fff6e8"/>`
      }
    }

    // Nerd.
    let poseNerd: Pose
    if (t < 1000) poseNerd = respira(mistura(POSES.guarda, POSES.pegaTorta, suave(janela(t, 300, 700))), t, 1)
    else if (t < 1450) poseNerd = mistura(POSES.pegaTorta, POSES.arremessa, suave(janela(t, 1000, 1250)))
    else {
      const k = janela(t, 2600, 2850)
      poseNerd = com(mistura(POSES.arremessa, POSES.vitoria, mola(k)), { alto: k >= 1 ? pulinho(t, 10) : 0 })
    }
    plano.cena += boneco('nerd', poseNerd, opcoesNerd(L.xNerd))

    // A torta: aparece na mão, é lançada e some no corte de câmera.
    if (t >= 500 && t < 1450) {
      const mao = pontoDoCorpo(poseNerd, 'mao', opcoesNerd(L.xNerd))
      const kVoo = janela(t, 1250, 1450)
      const alvo = pontoDoCorpo(poseMonge, 'cabeca', opcoesMonge(xMonge))
      const x = lerp(mao[0], lerp(mao[0], alvo[0], 0.6), kVoo)
      const y = lerp(mao[1], lerp(mao[1], alvo[1], 0.6), kVoo) - 30 * E * Math.sin(Math.PI * kVoo)
      const aparece = mola(janela(t, 500, 750))
      if (kVoo > 0) plano.cena += rastro(x + 50 * E, y, 60 * E, 0, kVoo)
      plano.cena += torta(x, y - 6 * E, E * 0.85 * aparece, -kVoo * 20)
    }

    if (t >= 1000 && t < 1450) {
      plano.zoom = 1 + 0.14 * suave(janela(t, 1000, 1400))
      plano.foco = [L.xNerd, chao - ALTURA_BONECO * E * 0.55]
    }
  }

  const kFaixa = t < 2500 ? janela(t, 1450, 1550) : 1 - janela(t, 2500, 2650)
  if (kFaixa > 0) plano.frente += faixas(L.w, L.h, kFaixa)
  return plano
}

// ------------------------------------------------------------------- quadro

/** SVG do instante `tempo` (ms desde o início), já no tamanho do palco. */
export function quadro(tempo: number, palco: Palco, { brilho = true } = {}) {
  const L = medir(palco)
  const tempoCiclo = ((tempo % CICLO) + CICLO) % CICLO
  const naCenaA = tempoCiclo < DURACAO_CENA
  const t = naCenaA ? tempoCiclo : tempoCiclo - DURACAO_CENA
  const joia = brilho ? brilhoDaJoia(tempo) : 0
  const plano = naCenaA ? cenaA(t, L, joia) : cenaB(t, L, joia)

  const [fx, fy] = plano.foco
  const camera = plano.zoom !== 1
    ? `translate(${n(fx)} ${n(fy)}) scale(${plano.zoom.toFixed(3)}) translate(${n(-fx)} ${n(-fy)})`
    : ''
  // Escurece rápido na troca de cena.
  const troca = Math.max(1 - janela(t, 0, 260), janela(t, DURACAO_CENA - 260, DURACAO_CENA))
  return `<g transform="${camera}">${plano.cena}</g>${plano.frente}` +
    (troca > 0.01 ? `<rect width="${n(L.w)}" height="${n(L.h)}" fill="#120c33" opacity="${n(troca)}"/>` : '')
}

