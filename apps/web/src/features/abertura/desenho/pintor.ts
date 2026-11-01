// Pintor: desenha num canvas o SVG que o roteiro gera, sem passar pelo DOM.
//
// O roteiro produz um subconjunto pequeno e conhecido de SVG: g, polygon, rect,
// circle, ellipse, path e text, com transform, opacity, cor sólida ou um dos
// gradientes ab-*. Ler esse texto e pintar com a API do canvas custa poucos
// milissegundos; converter o mesmo SVG em imagem custaria mais que um quadro.

type Atributos = Record<string, string>

const RE_TAG = /<(\/?)([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g
const RE_ATRIBUTO = /([\w:-]+)="([^"]*)"/g
const numeros = (s: string) => s.trim().split(/[\s,]+/).map(Number)

function atributos(texto: string): Atributos {
  const a: Atributos = {}
  for (const m of texto.matchAll(RE_ATRIBUTO)) a[m[1]] = m[2]
  return a
}

/** Aplica um `transform` do SVG; o canvas compõe na mesma ordem, da esquerda para a direita. */
function transformar(ctx: CanvasRenderingContext2D, transform: string) {
  for (const m of transform.matchAll(/(translate|rotate|scale|matrix)\(([^)]*)\)/g)) {
    const v = numeros(m[2])
    if (m[1] === 'translate') ctx.translate(v[0], v[1] ?? 0)
    else if (m[1] === 'scale') ctx.scale(v[0], v[1] ?? v[0])
    else if (m[1] === 'matrix') ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5])
    else if (v.length === 3) { ctx.translate(v[1], v[2]); ctx.rotate((v[0] * Math.PI) / 180); ctx.translate(-v[1], -v[2]) }
    else ctx.rotate((v[0] * Math.PI) / 180)
  }
}

type Caixa = [number, number, number, number]

/** Os gradientes de AberturaView, em coordenadas da caixa do elemento (objectBoundingBox). */
const GRADIENTES: Record<string, { radial: boolean; de: [number, number]; ate: [number, number]; paradas: [number, string][] }> = {
  'ab-ouro': { radial: false, de: [0, 0], ate: [0, 1], paradas: [[0, '#fff3b8'], [0.45, '#f6c453'], [1, '#b9780f']] },
  'ab-joia-clara': { radial: false, de: [0, 0], ate: [1, 1], paradas: [[0, '#fff6cf'], [1, '#f6c453']] },
  'ab-joia-escura': { radial: false, de: [0, 0], ate: [1, 1], paradas: [[0, '#f2b33a'], [1, '#a8650a']] },
  'ab-brilho': { radial: true, de: [0, 0], ate: [0, 0], paradas: [[0, '#ffffff'], [0.35, 'rgba(255,246,207,.9)'], [1, 'rgba(246,196,83,0)']] },
  'ab-flash': { radial: true, de: [0, 0], ate: [0, 0], paradas: [[0, '#fff1a8'], [0.45, '#ffb347'], [1, 'rgba(255,77,26,0)']] },
}

function tinta(ctx: CanvasRenderingContext2D, valor: string, caixa: () => Caixa): string | CanvasGradient {
  const m = /^url\(#([\w-]+)\)$/.exec(valor)
  if (!m) return valor
  const g = GRADIENTES[m[1]]
  if (!g) return '#000'
  const [x, y, w, h] = caixa()
  if (![x, y, w, h].every(Number.isFinite)) return '#000'
  const grad = g.radial
    ? ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) / 2)
    : ctx.createLinearGradient(x + g.de[0] * w, y + g.de[1] * h, x + g.ate[0] * w, y + g.ate[1] * h)
  for (const [o, cor] of g.paradas) grad.addColorStop(o, cor)
  return grad
}

/** Caixa de um caminho: basta para os gradientes, que só aparecem em caminhos absolutos. */
function caixaDosPontos(v: number[]): Caixa {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i + 1 < v.length; i += 2) {
    x0 = Math.min(x0, v[i]); x1 = Math.max(x1, v[i]); y0 = Math.min(y0, v[i + 1]); y1 = Math.max(y1, v[i + 1])
  }
  return [x0, y0, x1 - x0, y1 - y0]
}

function pintarForma(ctx: CanvasRenderingContext2D, tag: string, a: Atributos) {
  let forma: Path2D, caixa: () => Caixa
  switch (tag) {
    case 'polygon': {
      const v = numeros(a.points)
      forma = new Path2D()
      forma.moveTo(v[0], v[1])
      for (let i = 2; i + 1 < v.length; i += 2) forma.lineTo(v[i], v[i + 1])
      forma.closePath()
      caixa = () => caixaDosPontos(v)
      break
    }
    case 'rect': {
      const x = +(a.x ?? 0), y = +(a.y ?? 0), w = +a.width, h = +a.height, rx = +(a.rx ?? 0)
      forma = new Path2D()
      if (rx > 0) forma.roundRect(x, y, w, h, Math.min(rx, w / 2, h / 2))
      else forma.rect(x, y, w, h)
      caixa = () => [x, y, w, h]
      break
    }
    case 'circle': {
      const cx = +(a.cx ?? 0), cy = +(a.cy ?? 0), r = +(a.r ?? 0)
      forma = new Path2D()
      forma.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2)
      caixa = () => [cx - r, cy - r, 2 * r, 2 * r]
      break
    }
    case 'ellipse': {
      const cx = +(a.cx ?? 0), cy = +(a.cy ?? 0), rx = +(a.rx ?? 0), ry = +(a.ry ?? 0)
      forma = new Path2D()
      forma.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2)
      caixa = () => [cx - rx, cy - ry, 2 * rx, 2 * ry]
      break
    }
    case 'path':
      forma = new Path2D(a.d)
      caixa = () => caixaDosPontos(numeros(a.d.replace(/[a-zA-Z]/g, ' ')))
      break
    default:
      return
  }
  const fill = a.fill ?? '#000', stroke = a.stroke ?? 'none'
  if (fill !== 'none') { ctx.fillStyle = tinta(ctx, fill, caixa); ctx.fill(forma) }
  if (stroke !== 'none') {
    ctx.strokeStyle = tinta(ctx, stroke, caixa)
    ctx.lineWidth = +(a['stroke-width'] ?? 1)
    ctx.lineCap = (a['stroke-linecap'] as CanvasLineCap) ?? 'butt'
    ctx.lineJoin = (a['stroke-linejoin'] as CanvasLineJoin) ?? 'miter'
    ctx.stroke(forma)
  }
}

function pintarTexto(ctx: CanvasRenderingContext2D, a: Atributos, texto: string) {
  const x = +(a.x ?? 0), y = +(a.y ?? 0), fs = +(a['font-size'] ?? 16)
  ctx.font = `${a['font-weight'] ?? 'normal'} ${fs}px ${a['font-family'] ?? 'sans-serif'}`
  const ancora = a['text-anchor']
  ctx.textAlign = ancora === 'end' ? 'right' : ancora === 'middle' ? 'center' : 'left'
  ctx.textBaseline = a['dominant-baseline'] === 'middle' ? 'middle' : 'alphabetic'
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${a['letter-spacing'] ?? 0}px`
  const largura = ctx.measureText(texto).width
  const x0 = ancora === 'end' ? x - largura : ancora === 'middle' ? x - largura / 2 : x
  const caixa = (): Caixa => [x0, y - fs * 0.8, largura, fs]
  const fill = a.fill ?? '#000', stroke = a.stroke ?? 'none'
  const pintaStroke = () => {
    if (stroke === 'none') return
    ctx.strokeStyle = tinta(ctx, stroke, caixa)
    ctx.lineWidth = +(a['stroke-width'] ?? 1)
    ctx.lineJoin = (a['stroke-linejoin'] as CanvasLineJoin) ?? 'miter'
    ctx.strokeText(texto, x, y)
  }
  if (a['paint-order'] === 'stroke') pintaStroke()
  if (fill !== 'none') { ctx.fillStyle = tinta(ctx, fill, caixa); ctx.fillText(texto, x, y) }
  if (a['paint-order'] !== 'stroke') pintaStroke()
}

/** Pinta o SVG `svg` no contexto, a partir da transformação que o contexto já tem. */
export function pintarSvg(ctx: CanvasRenderingContext2D, svg: string) {
  let texto: Atributos | null = null, conteudo = ''
  for (const m of svg.matchAll(RE_TAG)) {
    if (m[5] !== undefined) { if (texto) conteudo += m[5]; continue }
    const [, fecha, tag, resto, sozinho] = m
    if (fecha) {
      if (tag === 'g') ctx.restore()
      else if (tag === 'text' && texto) { pintarTexto(ctx, texto, conteudo); ctx.restore(); texto = null }
      continue
    }
    const a = atributos(resto)
    ctx.save()
    if (a.transform) transformar(ctx, a.transform)
    if (a.opacity) ctx.globalAlpha *= +a.opacity
    if (tag === 'g') { if (sozinho) ctx.restore(); continue }
    if (tag === 'text') { texto = a; conteudo = ''; continue }
    pintarForma(ctx, tag, a)
    ctx.restore()
  }
}
