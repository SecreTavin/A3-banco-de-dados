// Peças de cena da abertura, como strings SVG: título dourado com o "!" de
// joia, túnel de velocidade, impacto, torta, creme e o pé em primeiro plano.
// Os gradientes citados aqui (ouro, joiaA, joiaB, brilho, flash) ficam no
// <defs> do AberturaView.

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
 * o "!" não encosta no "o" qualquer que seja a fonte carregada.
 */
export function titulo(cx: number, base: number, fs: number, brilho: number) {
  const { x: xJoia } = posicaoJoia(cx, base, fs)
  const xFim = cx + fs * 2.25 - (fs * 0.42) / 2
  const texto = (extra: string) =>
    `<text x="${n(xFim)}" y="${n(base)}" text-anchor="end" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="900" font-size="${n(fs)}" letter-spacing="${n(-fs * 0.03)}" ${extra}>Eu Duvido</text>`
  return texto(`fill="none" stroke="#2a1f6b" stroke-width="${n(fs * 0.24)}" stroke-linejoin="round"`) +
    texto(`fill="none" stroke="url(#ab-ouro)" stroke-width="${n(fs * 0.12)}" stroke-linejoin="round"`) +
    texto('fill="#fff"') +
    exclamacao(xJoia, base, fs, brilho)
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

export function torta(x: number, y: number, escala: number, giro = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)}) scale(${n(escala)})">` +
    '<ellipse cx="0" cy="7" rx="25" ry="8" fill="#fff"/><ellipse cx="0" cy="6" rx="22" ry="7" fill="#c9852f"/>' +
    '<ellipse cx="0" cy="0" rx="21" ry="9" fill="#fff6e8"/><ellipse cx="-6" cy="-2" rx="9" ry="3" fill="#fff" opacity=".8"/>' +
    '<circle cx="0" cy="-6" r="5" fill="#ff5d73"/><circle cx="-1.5" cy="-7.5" r="1.6" fill="#fff" opacity=".8"/></g>'
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

/** Pé do monge em primeiro plano: a câmera do chute vem atrás dele. */
export function peGrande(x: number, y: number, escala: number, giro: number) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)}) scale(${n(escala)})">` +
    '<rect x="-260" y="-22" width="250" height="44" rx="14" fill="#fff"/>' +
    '<rect x="-256" y="-18" width="246" height="36" rx="12" fill="#b8521b"/><rect x="-256" y="4" width="246" height="14" rx="7" fill="#933f12"/>' +
    '<rect x="-20" y="-20" width="20" height="40" rx="6" fill="#f4efe6" stroke="#fff" stroke-width="4"/>' +
    '<rect x="-4" y="-26" width="58" height="52" rx="18" fill="#1d1a22" stroke="#fff" stroke-width="5"/>' +
    '<rect x="40" y="-24" width="12" height="48" rx="6" fill="#f4efe6"/>' +
    '<path d="M 6 -14 Q 22 -20 34 -12" stroke="#3a3542" stroke-width="4" fill="none" stroke-linecap="round"/></g>'
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

export function balao(x: number, y: number, texto: string, escala: number, lado: 1 | -1, k: number) {
  if (k <= 0) return ''
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(escala * k)})">` +
    '<rect x="-46" y="-21" width="92" height="36" rx="13" fill="#fff"/>' +
    `<path d="M ${-6 * lado} 13 L ${-18 * lado} 28 L ${8 * lado} 14 Z" fill="#fff"/>` +
    `<text x="0" y="4" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="900" font-size="17" fill="#1d1a22" text-anchor="middle">${texto}</text></g>`
}

/** Estrelinhas girando em volta da cabeça de quem ficou tonto. */
export function estrelasTontura(x: number, y: number, raio: number, tempo: number) {
  let s = ''
  for (let i = 0; i < 3; i++) {
    const a = tempo / 380 + (i * Math.PI * 2) / 3
    s += estrela(x + Math.cos(a) * raio, y + Math.sin(a) * raio * 0.35, raio * 0.28, 0.9)
  }
  return s
}
