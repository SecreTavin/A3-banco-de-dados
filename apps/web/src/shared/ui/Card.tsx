import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: Props) {
  return <div className={[estilos.card, className].filter(Boolean).join(' ')}>{children}</div>
}
