import estilos from './ui.module.css'

interface Props {
  valor: number
  grande?: boolean
  comSinal?: boolean
}

export function SaldoCp({ valor, grande = false, comSinal = false }: Props) {
  const prefixo = comSinal && valor > 0 ? '+' : ''
  const cor = comSinal ? (valor >= 0 ? 'var(--cumpriu)' : 'var(--perdeu)') : undefined

  return (
    <span
      className={[estilos.cp, grande && estilos.cpGrande].filter(Boolean).join(' ')}
      style={cor ? { color: cor, borderColor: cor, background: 'transparent' } : undefined}
    >
      {prefixo}
      {valor}
      <span className={estilos.cpUnidade}>CP</span>
    </span>
  )
}
