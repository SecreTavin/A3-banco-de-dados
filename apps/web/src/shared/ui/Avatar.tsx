import { useState } from 'react'
import estilos from './ui.module.css'

interface Props {
  apelido: string
  url?: string | null
  grande?: boolean
}

export function Avatar({ apelido, url, grande = false }: Props) {
  const [falhou, setFalhou] = useState<string | null>(null)
  const classes = [estilos.avatar, grande && estilos.avatarGrande].filter(Boolean).join(' ')

  // Foto que não carrega (URL do seed, link morto) cai nas iniciais em vez de mostrar o alt quebrado.
  if (url && falhou !== url) {
    return <img className={classes} src={url} alt={apelido} onError={() => setFalhou(url)} />
  }

  return <span className={classes}>{apelido.slice(0, 2).toUpperCase()}</span>
}
