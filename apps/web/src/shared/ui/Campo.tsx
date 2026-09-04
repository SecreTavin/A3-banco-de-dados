import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  rotulo: string
  children: ReactNode
  dica?: string
  erro?: string
}

export function Campo({ rotulo, children, dica, erro }: Props) {
  return (
    <label className={estilos.campo}>
      <span className={estilos.rotulo}>{rotulo}</span>
      {children}
      {erro ? (
        <span className={estilos.erroCampo}>{erro}</span>
      ) : dica ? (
        <span className={estilos.dica}>{dica}</span>
      ) : null}
    </label>
  )
}
