// Plateia da abertura: dez alunos em roda, todos olhando para a briga, com
// roupa de colégio americano de filme dos anos 90. Mesmo esqueleto dos
// protagonistas; cada aluno torce do seu jeito e todos reagem aos golpes.

import { POSES } from './boneco'
import type { OpcoesBoneco, Pose, Rosto, Visual } from './boneco'

type Tipo = 'torce' | 'maos' | 'aponta' | 'grita'

interface Aluno {
  /** posição na roda: x em múltiplos da distância entre os lutadores; z no fundo, < 0 */
  dx: number
  z: number
  yaw: number
  escala: number
  espelho?: boolean
  tipo: Tipo
  /** desencontro, em ms, para ninguém se mexer igual */
  fase: number
  rosto: Rosto
  visual: Visual
}

const PELES: [string, string][] = [['#f1c49b', '#d9a275'], ['#e0a676', '#c4875a'], ['#b97a4f', '#9a6440'], ['#8a5636', '#6e4229'], ['#f3d0b0', '#dcb08c']]
const aluno = (pele: number, roupa: Omit<Visual, 'pele' | 'peleSombra'>): Visual => ({ pele: PELES[pele][0], peleSombra: PELES[pele][1], ...roupa })

const ALUNOS: Aluno[] = [
  // jaqueta de time (letterman), jeans e franja repartida
  { dx: -2.58, z: -80, yaw: -58, escala: 0.96, tipo: 'torce', fase: 0, rosto: 'feliz',
    visual: aluno(0, { camisa: '#1f3a7a', manga: '#efe9d8', antebraco: '#efe9d8', calca: '#4a6fa5', sapato: '#f2f2f2', cabelo: '#6b4423', penteado: 'repartido', estampa: 'jaqueta', detalhe: '#efe9d8' }) },
  // saia xadrez, cardigã, meião e cabelo comprido
  { dx: -2.13, z: -240, yaw: -66, escala: 0.92, tipo: 'maos', fase: 700, rosto: 'susto',
    visual: aluno(4, { menina: true, camisa: '#c94a5a', calca: '#7a1f2b', saia: '#7a1f2b', coxa: '#f3d0b0', canela: '#f4f2ea', sapato: '#1d1a22', cabelo: '#e2c070', penteado: 'longo', estampa: 'cardiga' }) },
  // flanela xadrez, grunge
  { dx: -1.64, z: -240, yaw: -68, escala: 0.97, tipo: 'aponta', fase: 300, rosto: 'debochado',
    visual: aluno(2, { camisa: '#8e2b2b', calca: '#5b7fae', sapato: '#3a2a1e', cabelo: '#2a1d14', penteado: 'chanel', estampa: 'xadrez', detalhe: '#1d1a22' }) },
  // jardineira jeans e rabo de cavalo
  { dx: -0.2, z: -245, yaw: -66, escala: 0.9, tipo: 'torce', fase: 1200, rosto: 'feliz',
    visual: aluno(3, { menina: true, camisa: '#f2d84a', antebraco: '#8a5636', calca: '#5a7fb8', sapato: '#f2f2f2', cabelo: '#2a1a12', penteado: 'rabo', laco: '#e0457b', estampa: 'macacao', detalhe: '#5a7fb8' }) },
  // líder de torcida
  { dx: 0.35, z: -245, yaw: 20, escala: 0.9, espelho: true, tipo: 'torce', fase: 400, rosto: 'feliz',
    visual: aluno(4, { menina: true, camisa: '#b5142a', antebraco: '#f3d0b0', calca: '#b5142a', saia: '#b5142a', coxa: '#f3d0b0', canela: '#f3d0b0', sapato: '#f2f2f2', cabelo: '#1d1410', penteado: 'rabo', laco: '#f2f2f2', estampa: 'listras', detalhe: '#f2f2f2' }) },
  // colete de tricô e boné virado
  { dx: 2.23, z: -240, yaw: 40, escala: 0.97, espelho: true, tipo: 'aponta', fase: 900, rosto: 'debochado',
    visual: aluno(1, { camisa: '#f2f2ee', calca: '#c8b38a', sapato: '#6b4420', cabelo: '#1d1410', penteado: 'bone', bone: '#c0392b', estampa: 'colete', detalhe: '#2e5e3a' }) },
  // jaqueta jeans e cabelo chanel
  { dx: 2.73, z: -240, yaw: 38, escala: 0.92, espelho: true, tipo: 'maos', fase: 200, rosto: 'susto',
    visual: aluno(0, { menina: true, camisa: '#6f8fc0', calca: '#1d1a22', saia: '#1d1a22', coxa: '#f1c49b', canela: '#1d1a22', sapato: '#1d1a22', cabelo: '#a3432a', penteado: 'chanel', estampa: 'cardiga' }) },
  // corta-vento colorido
  { dx: 3.17, z: -80, yaw: 30, escala: 0.96, espelho: true, tipo: 'torce', fase: 500, rosto: 'feliz',
    visual: aluno(3, { camisa: '#2aa198', manga: '#6c3fa0', antebraco: '#6c3fa0', calca: '#4a6fa5', sapato: '#f2f2f2', cabelo: '#1d1410', penteado: 'curto', estampa: 'ziper', detalhe: '#f2d84a' }) },
  // moletom cinza e boné azul, de lado na beira da cena
  { dx: -3.08, z: 150, yaw: -36, escala: 1.02, tipo: 'grita', fase: 1500, rosto: 'debochado',
    visual: aluno(2, { camisa: '#8a8d93', calca: '#4a6fa5', sapato: '#f2f2f2', cabelo: '#1d1410', penteado: 'bone', bone: '#1f3a7a', estampa: 'ziper', detalhe: '#6e7178' }) },
  // suéter roxo e saia xadrez azul
  { dx: 3.27, z: 150, yaw: 8, escala: 1, espelho: true, tipo: 'maos', fase: 1100, rosto: 'susto',
    visual: aluno(1, { menina: true, camisa: '#7b5ea7', calca: '#2f4f7f', saia: '#2f4f7f', coxa: '#e0a676', canela: '#f4f2ea', sapato: '#6b4420', cabelo: '#3a2618', penteado: 'longo', estampa: 'cardiga' }) },
]

const POSES_ALUNO: Record<Tipo, Pose> = {
  torce: { t: 0, h: -6, bt: [-140, -165], bf: [140, 165], pt: [-14, -3], pf: [14, 3], rosto: 'feliz' },
  maos: { t: 6, h: 4, bt: [150, 80], bf: [165, 70], pt: [-12, -3], pf: [12, 3], rosto: 'susto' },
  aponta: { t: -4, h: -4, bt: [25, 15], bf: [92, 88], pt: [-16, -4], pf: [16, 4], rosto: 'debochado' },
  grita: { t: 4, h: -8, bt: [60, 150], bf: [62, 160], pt: [-14, -3], pf: [14, 3], rosto: 'debochado' },
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
function mistura(a: Pose, b: Pose, k: number): Pose {
  const par = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)]
  return { t: lerp(a.t, b.t, k), h: lerp(a.h, b.h, k), bt: par(a.bt, b.bt), bf: par(a.bf, b.bf), pt: par(a.pt, b.pt), pf: par(a.pf, b.pf), rosto: k < 0.5 ? a.rosto : b.rosto }
}

/** Pose de um aluno no instante t: torcida contínua e reação a cada golpe. */
function poseAluno(a: Aluno, t: number, golpes: number[]): Pose {
  let ultimo = -1e9
  for (const g of golpes) if (t >= g) ultimo = g
  const desde = t - ultimo, tt = t + a.fase
  const base = POSES_ALUNO[a.tipo], r = Math.sin(tt / 420 + a.fase / 300), r2 = Math.sin(tt / 420 + a.fase / 300 - 0.8)
  let p: Pose = {
    ...base, t: base.t + r * 1.5, h: base.h - r2 * 2.5,
    bt: [base.bt[0] + r * 3, base.bt[1] + r * 4], bf: [base.bf[0] - r * 3, base.bf[1] - r * 4],
    pt: [base.pt[0] + r2 * 2, base.pt[1]], pf: [base.pf[0] - r2 * 2, base.pf[1] + r2 * 2],
  }
  let alto = 0, rosto = a.rosto
  const s = Math.sin(tt / 170)
  if (a.tipo === 'torce') { p = { ...p, bt: [p.bt[0] - s * 14, p.bt[1] - s * 8], bf: [p.bf[0] + s * 14, p.bf[1] + s * 8] }; alto = Math.max(0, Math.sin(tt / 210)) * 7 }
  if (a.tipo === 'aponta') p = { ...p, bf: [p.bf[0] + Math.sin(tt / 120) * 5, p.bf[1]], h: p.h + Math.sin(tt / 140) * 4 }
  if (a.tipo === 'grita') p = { ...p, t: p.t + Math.sin(tt / 260) * 5 }
  if (desde < 900) {
    // Golpe: todos levam um susto, pulam e comemoram (ou cobrem a cabeça).
    const k = desde / 900, env = Math.sin(Math.PI * Math.min(1, desde / 500))
    p = mistura(p, a.tipo === 'maos' ? POSES_ALUNO.maos : POSES.vitoria, env * 0.85)
    alto = Math.max(alto, Math.abs(Math.sin(desde / 120)) * (1 - k) * 24)
    rosto = desde < 300 || a.tipo === 'maos' ? 'susto' : 'feliz'
  }
  return { ...p, alto, rosto }
}

export interface AlunoNaCena {
  pose: Pose
  opcoes: OpcoesBoneco
}

/** A roda inteira no instante t da cena, em volta do centro (cx) da briga. */
export function plateia(t: number, golpes: number[], { cx, dx, chao, escala, u }: { cx: number; dx: number; chao: number; escala: number; u: number }): AlunoNaCena[] {
  return ALUNOS.map((a) => ({
    pose: poseAluno(a, t, golpes),
    opcoes: {
      x: cx + a.dx * dx, y: chao, z: a.z * u, yaw: a.yaw, escala: escala * a.escala, espelho: a.espelho,
      visual: a.visual, piscando: ((t + a.fase * 3) % 3100) < 110,
    },
  }))
}
