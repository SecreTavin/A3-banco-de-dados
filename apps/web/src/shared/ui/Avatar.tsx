import estilos from './ui.module.css'

interface Props {
  apelido: string
  url?: string | null
  grande?: boolean
}

export function Avatar({ apelido, url, grande = false }: Props) {
  const classes = [estilos.avatar, grande && estilos.avatarGrande].filter(Boolean).join(' ')

  if (url) return <img className={classes} src={url} alt={apelido} />

  return <span className={classes}>{apelido.slice(0, 2).toUpperCase()}</span>
}
