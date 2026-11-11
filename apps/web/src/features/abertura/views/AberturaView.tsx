import { useEffect, useRef, useState } from 'react'
import { pintarSvg } from '../desenho/pintor'
import { quadro, QUADRO_ESTATICO } from '../desenho/roteiro'
import type { Palco, Quadro } from '../desenho/roteiro'
import estilos from '../abertura.module.css'

interface Props {
  aoContinuar: () => void
}

// Gradientes usados pelas peças da cena no <svg> da página; o pintor do canvas
// tem os mesmos em desenho/pintor.ts.
const DEFS =
  '<linearGradient id="ab-ouro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".45" stop-color="#f6c453"/><stop offset="1" stop-color="#b9780f"/></linearGradient>' +
  '<linearGradient id="ab-joia-clara" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset="1" stop-color="#f6c453"/></linearGradient>' +
  '<linearGradient id="ab-joia-escura" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2b33a"/><stop offset="1" stop-color="#a8650a"/></linearGradient>' +
  '<radialGradient id="ab-brilho"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fff6cf" stop-opacity=".9"/><stop offset="1" stop-color="#f6c453" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="ab-flash"><stop offset="0" stop-color="#fff1a8"/><stop offset=".45" stop-color="#ffb347"/><stop offset="1" stop-color="#ff4d1a" stop-opacity="0"/></radialGradient>'

/**
 * Tamanho do pixel: a resolução interna fica perto de 720x450 pontos em
 * qualquer tela, como o PS1, que desenhava pequeno e ampliava. Assim o custo
 * por quadro não cresce com o monitor.
 */
const pixelDoPalco = ({ w, h }: Palco) => Math.max(2, Math.ceil(Math.sqrt((w * h) / 324000)))

/** Teclas que não contam como "qualquer tecla": sozinhas, só preparam um atalho. */
const MODIFICADORAS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Fn', 'ContextMenu'])

const menosMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Tela de abertura: as cenas A (voadora) e B (torta) se alternam sem parar até
 * qualquer toque, clique ou tecla, em 3D estilo PS1 num corredor de
 * universidade.
 *
 * Cada quadro sai de `quadro()` como SVG e o pintor o desenha num canvas
 * pequeno, ampliado sem suavizar: é o pixel do PS1, sem filtro caro. O <svg>
 * da página continua com a mesma cena, escondido: é a reserva se o canvas
 * falhar, e o que os roteiros de teste leem. Ele é atualizado a cada 6
 * quadros, que bastam para isso. O corredor, que não muda, é pintado uma vez
 * por tamanho de tela e só acompanha a câmera.
 *
 * A cena reage a quem assiste: a câmera desliza com o ponteiro (paralaxe), o
 * relógio para quando a aba some e, ao seguir, a última imagem se afasta com
 * um zoom por cima da tela seguinte, que já está carregada por baixo. Se o
 * aparelho não der conta, o pixel cresce sozinho até a animação ficar fluida.
 */
export function AberturaView({ aoContinuar }: Props) {
  const telaRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cenaRef = useRef<SVGGElement>(null)
  const fundoRef = useRef<SVGGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** tempo de animação, em ms: só anda enquanto a tela é desenhada */
  const tempo = useRef(0)
  /** onde o ponteiro está, de -1 a 1 em cada eixo */
  const ponteiro = useRef<[number, number]>([0, 0])
  /** pixels a mais que o aparelho pediu para manter a fluidez */
  const folga = useRef(0)
  const [palco, setPalco] = useState<Palco | null>(null)

  useEffect(() => {
    const tela = telaRef.current
    if (!tela) return
    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect
      setPalco({ w: Math.round(width), h: Math.round(height) })
    })
    observador.observe(tela)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const svg = svgRef.current, cena = cenaRef.current, fundo = fundoRef.current, canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!svg || !cena || !fundo || !canvas || !ctx || !palco) return

    // Versão em pixels no canvas. O corredor é pintado à parte, uma vez por tamanho.
    const corredor = document.createElement('canvas')
    let k = 1, largura = 1, altura = 1, corredorTexto = ''
    const montar = () => {
      k = pixelDoPalco(palco) + folga.current
      largura = Math.max(1, Math.round(palco.w / k))
      altura = Math.max(1, Math.round(palco.h / k))
      canvas.width = corredor.width = largura
      canvas.height = corredor.height = altura
      corredorTexto = ''
    }
    montar()
    let usarCanvas = true

    // Versão vetorial no <svg> da página.
    let fundoAtual = ''
    const aplicar = (q: Quadro) => {
      if (q.fundo !== fundoAtual) { fundo.innerHTML = q.fundo; fundoAtual = q.fundo }
      fundo.setAttribute('transform', q.camera)
      fundo.style.display = q.aberto ? '' : 'none'
      cena.innerHTML = q.cena
    }

    // Se o canvas falhar, volta para o <svg>, nítido.
    const usarSvg = () => {
      usarCanvas = false
      canvas.classList.add(estilos.oculto)
      svg.classList.remove(estilos.oculto)
    }

    const pintar = (q: Quadro) => {
      if (q.fundo !== corredorTexto) {
        corredorTexto = q.fundo
        const c = corredor.getContext('2d')
        if (!c) throw new Error('canvas sem contexto 2d')
        c.setTransform(1 / k, 0, 0, 1 / k, 0, 0)
        c.clearRect(0, 0, palco.w, palco.h)
        pintarSvg(c, q.fundo)
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#1d1550'
      ctx.fillRect(0, 0, largura, altura)
      if (q.aberto) {
        // Suavizado, o corredor desliza sem pular de pixel em pixel com a câmera.
        const [s, dx, dy] = q.cameraNumeros
        ctx.setTransform(s, 0, 0, s, dx / k, dy / k)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(corredor, 0, 0)
      }
      ctx.setTransform(1 / k, 0, 0, 1 / k, 0, 0)
      pintarSvg(ctx, q.cena)
    }
    const tentarPintar = (q: Quadro) => {
      try { pintar(q) } catch { usarSvg() }
    }

    // Quem pede menos movimento vê o quadro final, parado.
    if (menosMovimento()) {
      const q = quadro(QUADRO_ESTATICO, palco, { brilho: false })
      aplicar(q)
      tentarPintar(q)
      return
    }

    let pedido = 0, contador = 0, ultimo: number | null = null, custo = 0
    const olhar: [number, number] = [0, 0]
    const desenhar = (agora: number) => {
      // Um intervalo longo é a aba que ficou escondida: a cena retoma de onde parou.
      const passo = ultimo === null ? 0 : agora - ultimo
      tempo.current += passo > 120 ? 16.7 : passo
      ultimo = agora
      // A câmera persegue o ponteiro devagar, sem tranco.
      olhar[0] += (ponteiro.current[0] - olhar[0]) * 0.07
      olhar[1] += (ponteiro.current[1] - olhar[1]) * 0.07

      const antes = performance.now()
      const q = quadro(tempo.current, palco, { olhar })
      if (!usarCanvas || contador % 6 === 0) aplicar(q)
      if (usarCanvas) tentarPintar(q)
      custo += performance.now() - antes

      // Aparelho sem fôlego: se o quadro custa mais de 11 ms em média, o pixel cresce.
      if (++contador % 45 === 0) {
        if (usarCanvas && custo / 45 > 11 && folga.current < 3) { folga.current++; montar() }
        custo = 0
      }
      pedido = requestAnimationFrame(desenhar)
    }
    pedido = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(pedido)
  }, [palco])

  useEffect(() => {
    // Paralaxe só com mouse: no toque, o dedo já é o gesto de seguir.
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      ponteiro.current = [(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1]
    }
    const soltar = () => { ponteiro.current = [0, 0] }
    window.addEventListener('pointermove', mover)
    document.documentElement.addEventListener('pointerleave', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      document.documentElement.removeEventListener('pointerleave', soltar)
    }
  }, [])

  useEffect(() => {
    let seguiu = false

    // A última imagem fica por cima da tela seguinte e se afasta num zoom a
    // partir de onde a pessoa tocou. Não segura cliques nem atrasa a navegação.
    const despedir = (origem?: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas || canvas.width < 2 || canvas.classList.contains(estilos.oculto) || menosMovimento()) return
      try {
        const fantasma = document.createElement('canvas')
        fantasma.width = canvas.width
        fantasma.height = canvas.height
        fantasma.getContext('2d')?.drawImage(canvas, 0, 0)
        fantasma.className = estilos.fantasma
        fantasma.setAttribute('aria-hidden', 'true')
        if (origem) fantasma.style.transformOrigin = `${origem.x}px ${origem.y}px`
        document.body.appendChild(fantasma)
        const remover = () => fantasma.remove()
        fantasma.addEventListener('animationend', remover, { once: true })
        window.setTimeout(remover, 800)
      } catch {
        // Sem a transição, a tela seguinte só aparece direto.
      }
    }

    const seguir = (origem?: { x: number; y: number }) => {
      if (seguiu) return
      seguiu = true
      despedir(origem)
      aoContinuar()
    }
    const tecla = (e: KeyboardEvent) => {
      // Cmd+R, Ctrl+Tab e companhia são atalhos do navegador, não um "seguir".
      if (MODIFICADORAS.has(e.key) || e.metaKey || e.ctrlKey || e.altKey) return
      seguir()
    }
    const toque = (e: PointerEvent) => seguir({ x: e.clientX, y: e.clientY })
    window.addEventListener('keydown', tecla)
    window.addEventListener('pointerdown', toque)
    return () => {
      window.removeEventListener('keydown', tecla)
      window.removeEventListener('pointerdown', toque)
    }
  }, [aoContinuar])

  return (
    <main ref={telaRef} className={estilos.tela} aria-label="Eu Duvido! Toque ou aperte qualquer tecla para continuar.">
      {palco && (
        <>
          <canvas ref={canvasRef} className={estilos.pixels} aria-hidden="true" />
          <svg ref={svgRef} className={`${estilos.palco} ${estilos.oculto}`} width={palco.w} height={palco.h} viewBox={`0 0 ${palco.w} ${palco.h}`} aria-hidden="true">
            <defs dangerouslySetInnerHTML={{ __html: DEFS }} />
            <g>
              <g ref={fundoRef} />
              <g ref={cenaRef} />
            </g>
          </svg>
        </>
      )}

      <p className={estilos.convite}>
        <span className={estilos.conviteToque}>Toque para continuar</span>
        <span className={estilos.conviteTecla}>Clique ou aperte qualquer tecla</span>
      </p>
    </main>
  )
}
