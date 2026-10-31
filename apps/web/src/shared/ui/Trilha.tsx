import estilos from './trilha.module.css'

export interface EtapaTrilha {
  rotulo: string
  detalhe?: string
}

interface Props {
  etapas: EtapaTrilha[]
  /** Índice da etapa em curso; as anteriores aparecem como feitas. -1 = nenhuma começou. */
  atual: number
  /** Cor da etapa em curso — a do status do desafio. */
  cor: string
  /** Só os pontos, sem rótulos: para caber numa linha da lista. */
  compacta?: boolean
}

/** Linha do tempo do desafio: em que etapa ele está e o que já passou. */
export function Trilha({ etapas, atual, cor, compacta = false }: Props) {
  return (
    <ol
      className={[estilos.trilha, compacta && estilos.compacta].filter(Boolean).join(' ')}
      style={{ ['--cor-atual' as string]: cor }}
    >
      {etapas.map((etapa, indice) => (
        <li
          key={etapa.rotulo}
          className={[
            estilos.etapa,
            indice < atual && estilos.feita,
            indice === atual && estilos.atual,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={indice === atual ? 'step' : undefined}
          title={compacta ? etapa.rotulo : undefined}
        >
          <span className={estilos.ponto} />
          {!compacta && (
            <span className={estilos.textos}>
              <span className={estilos.rotulo}>{etapa.rotulo}</span>
              {etapa.detalhe && <span className={estilos.detalhe}>{etapa.detalhe}</span>}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
