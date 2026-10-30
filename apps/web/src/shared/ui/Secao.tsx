import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  titulo: string
  contagem?: number
  className?: string
  children: ReactNode
}

export function Secao({ titulo, contagem, className, children }: Props) {
  return (
    <section className={[estilos.secao, className].filter(Boolean).join(' ')}>
      <h2 className={estilos.secaoTitulo}>
        {titulo}
        {contagem !== undefined && <span className={estilos.secaoContagem}>{contagem}</span>}
      </h2>
      {children}
    </section>
  )
}
