import type { ButtonHTMLAttributes, ReactNode } from 'react'
import estilos from './ui.module.css'
import { Spinner } from './Spinner'

type Variante = 'primaria' | 'secundaria' | 'fantasma' | 'perigo' | 'sucesso' | 'recusa'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variante?: Variante
  tamanho?: 'normal' | 'pequeno'
  bloco?: boolean
  carregando?: boolean
}

export function Botao({
  children,
  variante = 'primaria',
  tamanho = 'normal',
  bloco = false,
  carregando = false,
  disabled,
  className,
  ...resto
}: Props) {
  const classes = [
    estilos.botao,
    variante !== 'primaria' && estilos[variante],
    tamanho === 'pequeno' && estilos.pequeno,
    bloco && estilos.blocao,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={disabled || carregando} {...resto}>
      {carregando && <Spinner tamanho={14} />}
      {children}
    </button>
  )
}
