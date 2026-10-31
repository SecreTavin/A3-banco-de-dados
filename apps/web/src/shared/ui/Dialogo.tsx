import { useEffect } from 'react'
import type { ReactNode } from 'react'
import estilos from './dialogo.module.css'

interface Props {
  titulo: ReactNode
  aoFechar: () => void
  children: ReactNode
}

/** Confirmação por cima da tela: no celular sobe como folha, no desktop fica centrada. */
export function Dialogo({ titulo, aoFechar, children }: Props) {
  useEffect(() => {
    const fecharEsc = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', fecharEsc)
    return () => document.removeEventListener('keydown', fecharEsc)
  }, [aoFechar])

  return (
    <div className={estilos.fundo} onMouseDown={aoFechar}>
      <section
        className={estilos.folha}
        role="dialog"
        aria-modal="true"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <span className={estilos.alca} aria-hidden="true" />
        <h2 className={estilos.titulo}>{titulo}</h2>
        {children}
      </section>
    </div>
  )
}
