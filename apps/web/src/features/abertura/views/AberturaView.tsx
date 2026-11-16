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
 */
export function AberturaView({ aoContinuar }: Props) {
  const telaRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cenaRef = useRef<SVGGElement>(null)
  const fundoRef = useRef<SVGGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inicio = useRef<number | null>(null)
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

    const k = pixelDoPalco(palco)
    const largura = Math.max(1, Math.round(palco.w / k)), altura = Math.max(1, Math.round(palco.h / k))
    canvas.width = largura
    canvas.height = altura
    ctx.imageSmoothingEnabled = false
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

    // Versão em pixels no canvas. O corredor é pintado à parte, uma vez.
    let corredorTexto = ''
    const corredor = document.createElement('canvas')
    corredor.width = largura
    corredor.height = altura
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
        const [s, dx, dy] = q.cameraNumeros
        ctx.setTransform(s, 0, 0, s, dx / k, dy / k)
        ctx.drawImage(corredor, 0, 0)
      }
      ctx.setTransform(1 / k, 0, 0, 1 / k, 0, 0)
      pintarSvg(ctx, q.cena)
    }
    const tentarPintar = (q: Quadro) => {
      try { pintar(q) } catch { usarSvg() }
    }

    // Quem pede menos movimento vê o quadro final, parado.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const q = quadro(QUADRO_ESTATICO, palco, { brilho: false })
      aplicar(q)
      tentarPintar(q)
      return
    }

    let pedido = 0, contador = 0
    const desenhar = (agora: number) => {
      inicio.current ??= agora
      const q = quadro(agora - inicio.current, palco)
      if (!usarCanvas || contador++ % 6 === 0) aplicar(q)
      if (usarCanvas) tentarPintar(q)
      pedido = requestAnimationFrame(desenhar)
    }
    pedido = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(pedido)
  }, [palco])

  useEffect(() => {
    let seguiu = false
    const seguir = () => {
      if (seguiu) return
      seguiu = true
      aoContinuar()
    }
    window.addEventListener('keydown', seguir)
    window.addEventListener('pointerdown', seguir)
    return () => {
      window.removeEventListener('keydown', seguir)
      window.removeEventListener('pointerdown', seguir)
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
