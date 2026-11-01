// Peças de cena da abertura, como strings SVG: título dourado com o "!" de
// joia, túnel de velocidade, impacto, torta, creme, o pé em primeiro plano, o
// corredor da universidade e a legenda. Os gradientes citados aqui (ouro,
// joiaA, joiaB, brilho, flash) ficam no <defs> do AberturaView.

import { caixa, fazCamera, juntar, pontos, tom } from './motor3d'
import type { Camera, Face, P2, V3 } from './motor3d'

const n = (v: number) => v.toFixed(1)

/** Gerador pseudoaleatório fixo: o mesmo desenho a cada quadro. */
export function aleatorio(semente: number) {
  let s = semente
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

/** Estrela de quatro pontas: o brilho de joia que passa pelo "!". */
export function estrela(x: number, y: number, r: number, opacidade = 1) {
  const f = r * 0.18
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(opacidade)}"><circle r="${n(r * 0.9)}" fill="url(#ab-brilho)"/>` +
    `<path d="M 0 ${n(-r)} Q ${n(f)} ${n(-f)} ${n(r)} 0 Q ${n(f)} ${n(f)} 0 ${n(r)} Q ${n(-f)} ${n(f)} ${n(-r)} 0 Q ${n(-f)} ${n(-f)} 0 ${n(-r)} Z" fill="#fff"/></g>`
}

// "!" lapidado: barra afunilada e ponto em losango, cada um com facetas.
function exclamacao(x: number, base: number, fs: number, brilho: number) {
  const topo = base - fs * 0.72
  const fimBarra = base - fs * 0.25
  const wT = fs * 0.15
  const wB = fs * 0.08
  const cy = base - fs * 0.08
  const r = fs * 0.1
  const barra = `M ${n(x - wT)} ${n(topo)} L ${n(x + wT)} ${n(topo)} L ${n(x + wB)} ${n(fimBarra)} L ${n(x - wB)} ${n(fimBarra)} Z`
  const ponto = `M ${n(x)} ${n(cy - r)} L ${n(x + r)} ${n(cy)} L ${n(x)} ${n(cy + r)} L ${n(x - r)} ${n(cy)} Z`
  const contorno = (d: string) =>
    `<path d="${d}" fill="none" stroke="#2a1f6b" stroke-width="${n(fs * 0.2)}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="url(#ab-ouro)" stroke-width="${n(fs * 0.1)}" stroke-linejoin="round"/>`
  return contorno(barra) + contorno(ponto) +
    `<path d="M ${n(x - wT)} ${n(topo)} L ${n(x)} ${n(topo)} L ${n(x)} ${n(fimBarra)} L ${n(x - wB)} ${n(fimBarra)} Z" fill="url(#ab-joia-clara)"/>` +
    `<path d="M ${n(x)} ${n(topo)} L ${n(x + wT)} ${n(topo)} L ${n(x + wB)} ${n(fimBarra)} L ${n(x)} ${n(fimBarra)} Z" fill="url(#ab-joia-escura)"/>` +
    `<path d="M ${n(x - wT * 0.55)} ${n(topo + fs * 0.05)} L ${n(x - wT * 0.2)} ${n(topo + fs * 0.05)} L ${n(x - wB * 0.3)} ${n(fimBarra - fs * 0.06)} Z" fill="#fff" opacity=".7"/>` +
    `<path d="M ${n(x)} ${n(cy - r)} L ${n(x)} ${n(cy + r)} L ${n(x - r)} ${n(cy)} Z" fill="url(#ab-joia-clara)"/>` +
    `<path d="M ${n(x)} ${n(cy - r)} L ${n(x + r)} ${n(cy)} L ${n(x)} ${n(cy + r)} Z" fill="url(#ab-joia-escura)"/>` +
    (brilho > 0.01 ? estrela(x + wT * 0.6, topo + fs * 0.12, fs * 0.32, brilho) : '')
}

/** Posição do "!" do título, para o nerd mirar nele na cena A. */
export function posicaoJoia(cx: number, base: number, fs: number) {
  const joia = fs * 0.42
  const xFim = cx + fs * 2.25 - joia / 2
  return { x: xFim + joia * 0.62, topo: base - fs * 0.72, base }
}

/**
 * Título "Eu Duvido!": letras brancas com borda dourada e o "!" de joia.
 * A palavra termina em xFim (text-anchor end) e a joia vem logo depois, então
 * o "!" não encosta no "o" qualquer que seja a fonte carregada. `achata` (de 0
 * a ~0,3) amassa o "!" para baixo, como mola, quando o nerd bate nele.
 */
export function titulo(cx: number, base: number, fs: number, brilho: number, achata = 0) {
  const { x: xJoia } = posicaoJoia(cx, base, fs)
  const xFim = cx + fs * 2.25 - (fs * 0.42) / 2
  const texto = (extra: string) =>
    `<text x="${n(xFim)}" y="${n(base)}" text-anchor="end" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="900" font-size="${n(fs)}" letter-spacing="${n(-fs * 0.03)}" ${extra}>Eu Duvido</text>`
  const joia = exclamacao(xJoia, base, fs, brilho)
  return texto(`fill="none" stroke="#2a1f6b" stroke-width="${n(fs * 0.24)}" stroke-linejoin="round"`) +
    texto(`fill="none" stroke="url(#ab-ouro)" stroke-width="${n(fs * 0.12)}" stroke-linejoin="round"`) +
    texto('fill="#fff"') +
    (Math.abs(achata) > 0.001
      ? `<g transform="translate(${n(xJoia)} ${n(base)}) scale(${(1 + achata * 0.7).toFixed(3)} ${(1 - achata).toFixed(3)}) translate(${n(-xJoia)} ${n(-base)})">${joia}</g>`
      : joia)
}

/** Linhas de velocidade convergindo para (cx, cy): o túnel dos planos fechados. */
export function tunel(cx: number, cy: number, w: number, h: number, r0: number, { cor = '#fff', opacidade = 0.55, semente = 3, giro = 0, quantidade = 46 } = {}) {
  const rnd = aleatorio(semente)
  const r2 = Math.hypot(w, h)
  let s = ''
  for (let i = 0; i < quantidade; i++) {
    const a = rnd() * Math.PI * 2 + giro
    const r1 = r0 + rnd() * r0 * 1.2
    const largura = 0.6 + rnd() * 2.6
    const ponto = (r: number, d: number) => `${n(cx + Math.cos(a + d) * r)} ${n(cy + Math.sin(a + d) * r)}`
    s += `<path d="M ${ponto(r1, 0)} L ${ponto(r2, largura / 120)} L ${ponto(r2, -largura / 120)} Z" fill="${cor}" opacity="${n(opacidade * (0.4 + rnd() * 0.6))}"/>`
  }
  return s
}

/** Faixas pretas de cinema; `k` de 0 a 1 entra e sai. */
export function faixas(w: number, h: number, k: number) {
  const altura = h * 0.11 * k
  return `<rect width="${n(w)}" height="${n(altura)}" fill="#000"/><rect y="${n(h - altura)}" width="${n(w)}" height="${n(altura)}" fill="#000"/>`
}

export function impacto(x: number, y: number, r: number, cor = '#fff', opacidade = 1) {
  let s = `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(opacidade)}"><circle r="${n(r * 1.5)}" fill="url(#ab-flash)" opacity=".9"/>` +
    `<circle r="${n(r)}" fill="none" stroke="${cor}" stroke-width="${n(r * 0.12)}" opacity=".9"/>` +
    `<circle r="${n(r * 1.35)}" fill="none" stroke="${cor}" stroke-width="${n(r * 0.05)}" opacity=".6"/>`
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2
    const L = i % 2 ? r * 0.5 : r * 0.9
    s += `<path d="M ${n(Math.cos(a - 0.06) * r * 1.1)} ${n(Math.sin(a - 0.06) * r * 1.1)} L ${n(Math.cos(a) * (r * 1.2 + L))} ${n(Math.sin(a) * (r * 1.2 + L))} L ${n(Math.cos(a + 0.06) * r * 1.1)} ${n(Math.sin(a + 0.06) * r * 1.1)} Z" fill="${cor}"/>`
  }
  return s + '</g>'
}

/** Torta como prisma de 14 lados: prato, lateral com luz por face, creme e cereja. */
export function torta(x: number, y: number, escala: number, giro = 0, opacidade = 1, achata: [number, number] = [1, 1]) {
  const g = (giro * Math.PI) / 180, cg = Math.cos(g), sg = Math.sin(g), inclina = 0.42
  const tela = ([u, v]: P2): P2 => { const a = u * escala * achata[0], b = v * escala * achata[1]; return [x + a * cg - b * sg, y + a * sg + b * cg] }
  const anel = (r: number, h: number, du = 0): P2[] => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    return [du + Math.cos(a) * r, h + Math.sin(a) * r * inclina]
  })
  const op = opacidade < 1 ? ` opacity="${n(opacidade)}"` : ''
  const poli = (pts: P2[], cor: string, extra = op) => `<polygon points="${pontos(pts.map(tela))}" fill="${cor}"${extra}/>`
  let s = poli(anel(26, 9), '#e8e4dc')
  const topo = anel(21, 0), fundo = anel(22, 7)
  for (let i = 0; i < 14; i++) {
    const j = (i + 1) % 14, a = ((i + 0.5) / 14) * Math.PI * 2
    if (Math.sin(a) > 0) s += poli([topo[i], topo[j], fundo[j], fundo[i]], tom('#c9852f', 0.55 + 0.45 * Math.max(0, Math.cos(a - 2.2))))
  }
  s += poli(topo, '#fff6e8') + poli(anel(8, -2, -6), '#ffffff', ` opacity="${n(0.6 * opacidade)}"`)
  return s + poli(Array.from({ length: 8 }, (_, i): P2 => [Math.cos((i / 8) * Math.PI * 2) * 5, -7 + Math.sin((i / 8) * Math.PI * 2) * 5]), '#ff5d73')
}

/** Mancha de creme: miolo e respingos, que se afastam conforme `abertura` cresce. */
export function creme(x: number, y: number, escala: number, semente: number, abertura = 1) {
  const rnd = aleatorio(semente)
  let p = `<g transform="translate(${n(x)} ${n(y)}) scale(${n(escala)})">`
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2
    const d = rnd() * 22
    p += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(Math.sin(a) * d)}" r="${n(10 + rnd() * 12)}" fill="#fff6e8"/>`
  }
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2
    const d = (40 + rnd() * 26) * abertura
    p += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(Math.sin(a) * d)}" r="${n(2 + rnd() * 5)}" fill="#fff6e8"/>`
  }
  return p + '<circle cx="-4" cy="-6" r="6" fill="#ff5d73"/></g>'
}

/** Ponta do pé em coordenadas locais do peGrande (antes de girar e escalar). */
export const PONTA_DO_PE = 54

/** Pé do monge em primeiro plano, em caixas: canela, meia, sapato e biqueira. */
export function peGrande(x: number, y: number, escala: number, giro: number, opacidade = 1, base = 720) {
  const g = (giro * Math.PI) / 180, cg = Math.cos(g), sg = Math.sin(g), faces: Face[] = []
  const cam = fazCamera({ yaw: 28, pitch: -12, f: base * 2.2, px: x, py: y, grade: 4 })
  const L = (u: number, v: number, z: number): V3 => [escala * (u * cg - v * sg), escala * (u * sg + v * cg), escala * z]
  const bloco = (cu: number, hu: number, hv: number, hz: number, cor: string) => {
    const c = L(cu, 0, 0)
    caixa(faces, [x + c[0], y + c[1], 0], L(hu, 0, 0), L(0, hv, 0), L(0, 0, hz), cor, opacidade, cam)
  }
  bloco(-135, 125, 20, 20, '#b8521b'); bloco(-10, 10, 19, 19, '#f4efe6'); bloco(25, 29, 26, 24, '#1d1a22'); bloco(48, 6, 24, 22, '#f4efe6')
  return juntar(faces)
}

/** Rastro de movimento: traços paralelos atrás de quem se move. */
export function rastro(x: number, y: number, comprimento: number, giro: number, opacidade = 1, quantidade = 5) {
  let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)})" opacity="${n(opacidade)}">`
  for (let i = 0; i < quantidade; i++) {
    const yy = (i - (quantidade - 1) / 2) * comprimento * 0.1
    s += `<rect x="${n(-comprimento + i * comprimento * 0.08)}" y="${n(yy - 2)}" width="${n(comprimento * (1 - i * 0.15))}" height="4" rx="2" fill="#fff" opacity="${n(0.55 - i * 0.07)}"/>`
  }
  return s + '</g>'
}

export function oculosVoando(x: number, y: number, escala: number, giro: number) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)}) scale(${n(escala)})">` +
    '<circle cx="-9" cy="0" r="8" fill="rgba(255,255,255,.3)" stroke="#1d1a22" stroke-width="3"/>' +
    '<circle cx="9" cy="0" r="8" fill="rgba(255,255,255,.3)" stroke="#1d1a22" stroke-width="3"/>' +
    '<path d="M -1 0 L 1 0 M -17 -1 L -26 -4" stroke="#1d1a22" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M 5 -6 L 9 -1 L 6 3 L 11 7" stroke="#fff" stroke-width="1.6" fill="none"/></g>'
}

/** Legenda da provocação, embaixo e no centro, como nos jogos de PS1, logo acima do convite para continuar. */
export function legenda(texto: string, opacidade: number, w: number, h: number) {
  if (!texto || opacidade <= 0) return ''
  const fs = Math.max(22, Math.min(w, h) * 0.06)
  return `<text x="${n(w / 2)}" y="${n(h - 110 - fs * 0.4)}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="900" font-size="${n(fs)}" letter-spacing="${n(fs * 0.08)}" fill="#ffe14a" stroke="#1a0d00" stroke-width="${n(fs * 0.24)}" stroke-linejoin="round" paint-order="stroke" opacity="${n(opacidade)}">${texto}</text>`
}

/** Estrelinhas girando em volta da cabeça de quem ficou tonto; as de trás ficam menores e apagadas. */
export function estrelasTontura(x: number, y: number, raio: number, tempo: number) {
  let s = ''
  for (let i = 0; i < 3; i++) {
    const a = tempo / 380 + (i * Math.PI * 2) / 3, z = Math.sin(a)
    s += estrela(x + Math.cos(a) * raio, y + z * raio * 0.35, raio * 0.28 * (0.75 + 0.3 * z), 0.55 + 0.2 * (z + 1))
  }
  return s
}

/** Poeira que levanta quando alguém pousa: seis bolinhas que se abrem e somem. */
export function poeira(x: number, chao: number, desde: number, escala: number) {
  if (desde < 0 || desde > 520) return ''
  const k = desde / 520, sk = 1 - (1 - k) ** 3
  let s = ''
  for (let i = 0; i < 6; i++) {
    const lado = i % 2 ? 1 : -1, fila = Math.floor(i / 2)
    s += `<circle cx="${n(x + lado * (10 + fila * 14) * escala * (0.4 + 0.6 * sk))}" cy="${n(chao - (3 + 8 * sk * (1 + fila * 0.3)) * escala)}" r="${n((4 + 9 * sk) * escala)}" fill="#d9d2f5" opacity="${n(0.45 * (1 - k))}"/>`
  }
  return s
}

export interface Corredor {
  w: number
  h: number
  cx: number
  chao: number
  /** unidade do mundo: 1 no palco de 1120x720 */
  u: number
  cam: Camera
  /** altura do topo do título: cartazes e relógio ficam acima dela */
  tituloTopo: number
}

const corredores = new Map<string, string>()

/**
 * Corredor da universidade: parede creme com faixa bordô, rodapé, piso em
 * xadrez, armários escolares, cartazes e relógio. Fixo: calculado uma vez por
 * tamanho de palco.
 */
export function corredor({ w, h, cx, chao, u, cam, tituloTopo }: Corredor) {
  const chave = `${w}x${h}`
  const pronto = corredores.get(chave)
  if (pronto) return pronto
  const zp = -260 * u, zf = zp + 48.5 * u, largo = Math.max(w, h) * 1.8
  const poli = (pts: V3[], cor: string, op = 1) => `<polygon points="${pontos(pts.map(cam.lisa))}" fill="${cor}"${op < 1 ? ` opacity="${op}"` : ''}/>`
  const ret = (x0: number, y0: number, x1: number, y1: number, z: number, cor: string, op = 1) => poli([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], cor, op)

  let s = ret(cx - largo, -h, cx + largo, chao, zp, '#cdbf9f')
  s += ret(cx - largo, chao - 430 * u, cx + largo, chao - 384 * u, zp, '#7a2a3a')
  s += ret(cx - largo, chao - 384 * u, cx + largo, chao - 378 * u, zp, '#c9a24a')
  s += ret(cx - largo, chao - 26 * u, cx + largo, chao, zp, '#5a4334')
  // O piso para antes de chegar perto demais da câmera, onde a perspectiva estoura.
  const zMax = Math.min(800 * u, cam.f * 0.55), lt = 120 * u, pt = 110 * u
  for (let zi = 0, z = zp; z < zMax; z += pt, zi++) {
    for (let xi = 0, x = cx - largo; x < cx + largo; x += lt, xi++) {
      s += poli([[x, chao, z], [x + lt, chao, z], [x + lt, chao, Math.min(z + pt, zMax)], [x, chao, Math.min(z + pt, zMax)]], (xi + zi) % 2 ? '#cfc6b2' : '#9a917e')
    }
  }

  // Cartazes e relógio acima dos armários, entre o topo da tela e o título;
  // quando não cabem inteiros nessa faixa, ficam de fora.
  const topoCartaz = Math.min(chao - 560 * u, tituloTopo - 150 * u)
  if (cam.lisa([cx, topoCartaz, zp])[1] > 8) {
    for (const [dx, cor] of [[-680, '#d94f3d'], [-380, '#3e8f6a'], [130, '#e0a53a']] as [number, string][]) {
      const x0 = cx + dx * u
      s += ret(x0, topoCartaz, x0 + 110 * u, topoCartaz + 105 * u, zp + 1, cor)
      for (let l = 0; l < 3; l++) s += ret(x0 + 14 * u, topoCartaz + (25 + l * 22) * u, x0 + (96 - l * 18) * u, topoCartaz + (33 + l * 22) * u, zp + 2, '#f4efe6', 0.85)
    }
    const rx = cx + 470 * u, ry = topoCartaz + 55 * u
    const roda = (r: number, z: number) => Array.from({ length: 16 }, (_, i): V3 => [rx + Math.cos((i / 16) * Math.PI * 2) * r, ry + Math.sin((i / 16) * Math.PI * 2) * r, z])
    s += poli(roda(46 * u, zp + 1), '#7a2a3a') + poli(roda(37 * u, zp + 2), '#f4efe6')
    const [a, b, c] = [cam.lisa([rx, ry - 28 * u, zp + 3]), cam.lisa([rx, ry, zp + 3]), cam.lisa([rx + 20 * u, ry + 6 * u, zp + 3])]
    s += `<path d="M ${n(a[0])} ${n(a[1])} L ${n(b[0])} ${n(b[1])} L ${n(c[0])} ${n(c[1])}" stroke="#1d1a22" stroke-width="${n(5 * u)}" fill="none" stroke-linecap="round"/>`
  }

  // Armários: caixas na parede, com venezianas, plaquinha e puxador.
  const caixas: Face[] = []
  let detalhes = ''
  for (let i = 0, x = cx - largo; x < cx + largo; x += 70 * u, i++) {
    const topo = chao - 326 * u
    caixa(caixas, [x + 32 * u, topo + 150 * u, zp + 24 * u], [32 * u, 0, 0], [0, 150 * u, 0], [0, 0, 24 * u], i % 2 ? '#3e6db0' : '#3866a6', 1, cam)
    for (const y0 of [18, 31, 44, 250, 263, 276]) detalhes += ret(x + 14 * u, topo + y0 * u, x + 50 * u, topo + (y0 + 6) * u, zf, '#1c2a44')
    detalhes += ret(x + 22 * u, topo + 66 * u, x + 42 * u, topo + 78 * u, zf, '#d9dde3')
    detalhes += ret(x + 50 * u, topo + 130 * u, x + 56 * u, topo + 170 * u, zf, '#c9ced6')
  }
  s += juntar(caixas) + detalhes
  corredores.set(chave, s)
  return s
}
