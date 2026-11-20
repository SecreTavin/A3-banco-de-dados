import { useState } from 'react'
import { aplicarEscala, escalaAtual } from './escala'
import type { Escala } from './escala'
import estilos from './shell.module.css'

/** Fonte 20% maior para apresentar num projetor de baixa resolução. */
export function BotaoEscala() {
  const [escala, setEscala] = useState<Escala>(escalaAtual)
  const maior = escala === 'maior'

  function alternar() {
    const proxima: Escala = maior ? 'normal' : 'maior'
    aplicarEscala(proxima)
    setEscala(proxima)
  }

  return (
    <button
      type="button"
      className={estilos.escala}
      onClick={alternar}
      aria-pressed={maior}
      title={maior ? 'Voltar a fonte ao normal' : 'Fonte maior, para projetor'}
      aria-label={maior ? 'Voltar a fonte ao tamanho normal' : 'Aumentar a fonte em 20%'}
    >
      <span aria-hidden="true">{maior ? 'A−' : 'A+'}</span>
    </button>
  )
}
