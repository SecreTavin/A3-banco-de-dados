import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  titulo: string
  contagem?: number
  children: ReactNode
}

export function Secao({ titulo, contagem, children }: Props) {
  return (
    <section className={estilos.secao}>
      <h2 className={estilos.secaoTitulo}>
        {titulo}
        {contagem !== undefined && <span className={estilos.secaoContagem}>{contagem}</span>}
      </h2>
      {children}
    </section>
  )
}
