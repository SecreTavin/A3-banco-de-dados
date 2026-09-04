import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  children: ReactNode
  cor?: string
  comPonto?: boolean
}

export function Badge({ children, cor = 'var(--texto-suave)', comPonto = true }: Props) {
  return (
    <span
      className={[estilos.badge, !comPonto && estilos.badgeSemPonto].filter(Boolean).join(' ')}
      style={{ color: cor }}
    >
      {children}
    </span>
  )
}
