import { useEffect, useRef, useState } from 'react'
import { quadro, QUADRO_ESTATICO } from '../desenho/roteiro'
import type { Palco } from '../desenho/roteiro'
import estilos from '../abertura.module.css'

interface Props {
  aoContinuar: () => void
}

/**
 * Tela de abertura: as cenas A (voadora) e B (torta) se alternam sem parar até
 * qualquer toque, clique ou tecla. Cada quadro é desenhado direto no <g> da
 * cena; passar pelo React a 60 quadros por segundo só custaria reconciliação.
 */
export function AberturaView({ aoContinuar }: Props) {
  const telaRef = useRef<HTMLElement>(null)
  const cenaRef = useRef<SVGGElement>(null)
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
    const cena = cenaRef.current
    if (!cena || !palco) return

    // Quem pede menos movimento vê o quadro final, parado.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cena.innerHTML = quadro(QUADRO_ESTATICO, palco, { brilho: false })
      return
    }

    let pedido = 0
    const desenhar = (agora: number) => {
      inicio.current ??= agora
      cena.innerHTML = quadro(agora - inicio.current, palco)
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
        <svg className={estilos.palco} width={palco.w} height={palco.h} viewBox={`0 0 ${palco.w} ${palco.h}`} aria-hidden="true">
          <defs>
            <linearGradient id="ab-ouro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff3b8" />
              <stop offset=".45" stopColor="#f6c453" />
              <stop offset="1" stopColor="#b9780f" />
            </linearGradient>
            <linearGradient id="ab-joia-clara" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff6cf" />
              <stop offset="1" stopColor="#f6c453" />
            </linearGradient>
            <linearGradient id="ab-joia-escura" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f2b33a" />
              <stop offset="1" stopColor="#a8650a" />
            </linearGradient>
            <radialGradient id="ab-brilho">
              <stop offset="0" stopColor="#fff" />
              <stop offset=".35" stopColor="#fff6cf" stopOpacity=".9" />
              <stop offset="1" stopColor="#f6c453" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ab-flash">
              <stop offset="0" stopColor="#fff" />
              <stop offset=".5" stopColor="#fff6cf" />
              <stop offset="1" stopColor="#f6c453" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g ref={cenaRef} />
        </svg>
      )}

      <p className={estilos.convite}>
        <span className={estilos.conviteToque}>Toque para continuar</span>
        <span className={estilos.conviteTecla}>Clique ou aperte qualquer tecla</span>
      </p>
    </main>
  )
}
