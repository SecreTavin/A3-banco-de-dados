import { useState } from 'react'
import { aplicarTema, temaAtual } from './tema'
import type { Tema } from './tema'
import estilos from './shell.module.css'

export function BotaoTema() {
  const [tema, setTema] = useState<Tema>(temaAtual)
  const proximo: Tema = tema === 'escuro' ? 'claro' : 'escuro'

  function alternar() {
    aplicarTema(proximo)
    setTema(proximo)
  }

  return (
    <button
      className={estilos.sair}
      onClick={alternar}
      title={`Tema ${proximo}`}
      aria-label={`Mudar para o tema ${proximo}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {tema === 'escuro' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  )
}
