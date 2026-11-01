// Motor 3D mínimo da abertura, no estilo PS1, gerando string SVG.
//
// Câmera em perspectiva, caixas com luz chapada por face, ordem do fundo para a
// frente (algoritmo do pintor) e vértices presos a uma grade, que dá o tremido
// típico do PS1. Rosto e roupa continuam sendo desenho 2D, aplicado na face da
// frente da caixa por textura afim. Tudo é função pura: nada guarda estado.

export type V3 = [number, number, number]
export type P2 = [number, number]

/** Uma face pronta para desenhar; `k` é a distância até a câmera (maior = mais longe). */
export interface Face {
  k: number
  svg: string
}

export interface Camera {
  f: number
  /** gira uma direção para o espaço da câmera */
  dir(n: V3): V3
  /** leva um ponto para o espaço da câmera (câmera em z = f) */
  cam(p: V3): V3
  /** projeta na tela, preso à grade */
  tela(p: V3): P2
  /** projeta na tela, sem grade */
  lisa(p: V3): P2
}

export interface OpcoesCamera {
  yaw: number
  pitch: number
  f: number
  /** ponto da tela em volta do qual a câmera gira */
  px: number
  py: number
  /** tamanho da grade dos vértices; 0 desliga */
  grade?: number
}

const RAD = Math.PI / 180
const n = (v: number) => v.toFixed(1)

export function fazCamera({ yaw, pitch, f, px, py, grade = 0 }: OpcoesCamera): Camera {
  const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD)
  const rot = (x: number, y: number, z: number): V3 => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy
    return [x1, y * cp + z1 * sp, -y * sp + z1 * cp]
  }
  const projeta = (p: V3, g: number): P2 => {
    const q = rot(p[0] - px, p[1] - py, p[2]), k = f / (f - q[2])
    let x = px + q[0] * k, y = py + q[1] * k
    if (g) { x = Math.round(x / g) * g; y = Math.round(y / g) * g }
    return [x, y]
  }
  return {
    f,
    dir: (v) => rot(v[0], v[1], v[2]),
    cam: (p) => rot(p[0] - px, p[1] - py, p[2]),
    tela: (p) => projeta(p, grade),
    lisa: (p) => projeta(p, 0),
  }
}

/** O plano z = 0 visto pela câmera, como transformação afim em volta de (cx, cy). */
export function afimDoPlano(cam: Camera, cx: number, cy: number) {
  const d = 200, a = cam.lisa([cx, cy, 0]), b = cam.lisa([cx + d, cy, 0]), c = cam.lisa([cx, cy + d, 0])
  const ax = (b[0] - a[0]) / d, ay = (b[1] - a[1]) / d, bx = (c[0] - a[0]) / d, by = (c[1] - a[1]) / d
  return `matrix(${[ax, ay, bx, by, a[0] - cx * ax - cy * bx, a[1] - cx * ay - cy * by].map((v) => v.toFixed(4)).join(' ')})`
}

const LUZ: V3 = (() => {
  const v: V3 = [0, -0.6, 0.8], m = Math.hypot(...v)
  return [v[0] / m, v[1] / m, v[2] / m]
})()

const tons = new Map<string, string>()
/** Cor escurecida pela luz: b = 1 mantém, b < 1 escurece. */
export function tom(hex: string, b: number) {
  const chave = hex + b.toFixed(2)
  let cor = tons.get(chave)
  if (!cor) {
    const v = parseInt(hex.slice(1), 16), f = (c: number) => Math.min(255, Math.round(c * b))
    cor = `rgb(${f((v >> 16) & 255)},${f((v >> 8) & 255)},${f(v & 255)})`
    tons.set(chave, cor)
  }
  return cor
}

export const pontos = (pts: P2[]) => pts.map((p) => `${n(p[0])},${n(p[1])}`).join(' ')
const opacidade = (op: number) => (op < 1 ? ` opacity="${Math.max(0, op).toFixed(2)}"` : '')

/** Desenho 2D aplicado numa face da caixa (por padrão, a +C). P00, P10 e P01 são cantos no mundo. */
export interface Textura {
  svg: string
  /** face que recebe o desenho: eixo 0, 1 ou 2 (A, B, C) e lado +1 ou -1 */
  eixo?: number
  lado?: number
  P00: V3
  P10: V3
  P01: V3
  u0: number
  v0: number
  w: number
  h: number
}

function matrizTextura(cam: Camera, t: Textura) {
  const a = cam.tela(t.P00), b = cam.tela(t.P10), c = cam.tela(t.P01)
  const m = [(b[0] - a[0]) / t.w, (b[1] - a[1]) / t.w, (c[0] - a[0]) / t.h, (c[1] - a[1]) / t.h]
  return `matrix(${[m[0], m[1], m[2], m[3], a[0] - m[0] * t.u0 - m[2] * t.v0, a[1] - m[1] * t.u0 - m[3] * t.v0].map((v) => v.toFixed(3)).join(' ')})`
}

export type CorDaFace = string | ((eixo: number, lado: number) => string)

/**
 * Caixa de centro `o` e semieixos A, B e C no mundo. Só entram as faces viradas
 * para a câmera, cada uma com a cor escurecida pela luz.
 */
export function caixa(out: Face[], o: V3, A: V3, B: V3, C: V3, cor: CorDaFace, op: number, cam: Camera, tex?: Textura) {
  const eixos = [A, B, C]
  for (let i = 0; i < 3; i++) {
    for (const lado of [1, -1]) {
      const nn = eixos[i].map((v) => v * lado) as V3, j = eixos[(i + 1) % 3], k = eixos[(i + 2) % 3]
      const c: V3 = [o[0] + nn[0], o[1] + nn[1], o[2] + nn[2]]
      const pc = cam.cam(c), nc = cam.dir(nn)
      if (-nc[0] * pc[0] - nc[1] * pc[1] + nc[2] * (cam.f - pc[2]) <= 0) continue
      const len = Math.hypot(...nc) || 1
      const b = 0.48 + 0.52 * Math.max(0, (nc[0] * LUZ[0] + nc[1] * LUZ[1] + nc[2] * LUZ[2]) / len)
      const pts = pontos([[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([s, t]) =>
        cam.tela([c[0] + s * j[0] + t * k[0], c[1] + s * j[1] + t * k[1], c[2] + s * j[2] + t * k[2]])))
      const base = typeof cor === 'function' ? cor(i, lado) : cor
      const dist = cam.f - pc[2]
      out.push({ k: dist, svg: `<polygon points="${pts}" fill="${tom(base, b)}"${opacidade(op)}/>` })
      if (tex && i === (tex.eixo ?? 2) && lado === (tex.lado ?? 1)) {
        out.push({ k: dist - 1e-6, svg: `<g transform="${matrizTextura(cam, tex)}"${opacidade(op)}>${tex.svg}</g>` })
        if (b < 0.98) out.push({ k: dist - 2e-6, svg: `<polygon points="${pts}" fill="#000"${opacidade((1 - b) * 0.5 * op)}/>` })
      }
    }
  }
}

/** Desenha as faces do fundo para a frente. */
export function juntar(faces: Face[]) {
  return faces.sort((a, b) => b.k - a.k).map((f) => f.svg).join('')
}
