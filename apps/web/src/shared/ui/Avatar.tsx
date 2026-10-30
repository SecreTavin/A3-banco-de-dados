import { useState } from 'react'
import estilos from './ui.module.css'

interface Props {
  apelido: string
  url?: string | null
  grande?: boolean
  /** Só cresce no desktop (cartões de login); no celular fica do tamanho normal. */
  enorme?: boolean
}

export function Avatar({ apelido, url, grande = false, enorme = false }: Props) {
  const [falhou, setFalhou] = useState<string | null>(null)
  const classes = [estilos.avatar, grande && estilos.avatarGrande, enorme && estilos.avatarEnorme].filter(Boolean).join(' ')

  // Foto que não carrega (URL do seed, link morto) cai nas iniciais em vez de mostrar o alt quebrado.
  if (url && falhou !== url) {
    return <img className={classes} src={url} alt={apelido} onError={() => setFalhou(url)} />
  }

  return <span className={classes}>{apelido.slice(0, 2).toUpperCase()}</span>
}
