import { useEffect, useRef, useState } from 'react'
import { Icone } from './Icone'
import estilos from './menu.module.css'

export interface ItemMenu {
  rotulo: string
  aoEscolher: () => void
  perigo?: boolean
  /** Item visível mas inativo, com o motivo logo abaixo. */
  indisponivel?: string
}

interface Props {
  itens: ItemMenu[]
  rotulo: string
}

/** Menu "⋯": guarda ações secundárias e destrutivas fora do caminho principal. */
export function Menu({ itens, rotulo }: Props) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return

    const fecharFora = (evento: MouseEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false)
    }
    const fecharEsc = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', fecharFora)
    document.addEventListener('keydown', fecharEsc)
    return () => {
      document.removeEventListener('mousedown', fecharFora)
      document.removeEventListener('keydown', fecharEsc)
    }
  }, [aberto])

  return (
    <div className={estilos.menu} ref={raiz}>
      <button
        type="button"
        className={[estilos.gatilho, aberto && estilos.gatilhoAberto].filter(Boolean).join(' ')}
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        <Icone nome="pontos" tamanho={20} />
      </button>

      {aberto && (
        <div className={estilos.lista} role="menu">
          {itens.map((item) => (
            <button
              key={item.rotulo}
              type="button"
              role="menuitem"
              className={[estilos.item, item.perigo && estilos.perigo].filter(Boolean).join(' ')}
              disabled={Boolean(item.indisponivel)}
              onClick={() => {
                setAberto(false)
                item.aoEscolher()
              }}
            >
              {item.rotulo}
              {item.indisponivel && <span className={estilos.motivo}>{item.indisponivel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
