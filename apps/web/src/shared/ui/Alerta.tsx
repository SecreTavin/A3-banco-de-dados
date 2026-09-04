import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  children: ReactNode
  tom?: 'erro' | 'info' | 'ok'
}

export function Alerta({ children, tom = 'erro' }: Props) {
  const classes = [
    estilos.alerta,
    tom === 'info' && estilos.alertaInfo,
    tom === 'ok' && estilos.alertaOk,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
