import type { ReactNode } from 'react'
import estilos from './ui.module.css'

interface Props {
  titulo: string
  descricao?: string
  acao?: ReactNode
}

export function CabecalhoPagina({ titulo, descricao, acao }: Props) {
  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.cabecalhoTextos}>
        <h1 className={estilos.cabecalhoTitulo}>{titulo}</h1>
        {descricao && <p className={estilos.cabecalhoDescricao}>{descricao}</p>}
      </div>
      {acao}
    </header>
  )
}
