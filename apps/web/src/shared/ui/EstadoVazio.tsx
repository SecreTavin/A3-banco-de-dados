import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  titulo: string
  descricao?: string
  acao?: ReactNode
}

export function EstadoVazio({ titulo, descricao, acao }: Props) {
  return (
    <div className={estilos.vazio}>
      <span className={estilos.vazioTitulo}>{titulo}</span>
      {descricao && <span>{descricao}</span>}
      {acao}
    </div>
  )
}
