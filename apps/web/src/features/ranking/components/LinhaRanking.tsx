import { Avatar, SaldoCp } from '../../../shared/ui'
import type { PosicaoRanking } from '../../../shared/api/tipos'
import estilos from '../ranking.module.css'

interface Props {
  posicao: number
  linha: PosicaoRanking
  souEu: boolean
}

/** Acerto entre os desafios já decididos: "1 de 2", com a barra. */
export function Acerto({ linha }: { linha: PosicaoRanking }) {
  const decididos = linha.acertos + linha.erros
  if (decididos === 0) {
    return <span className={estilos.semDecisao}>{linha.desafiosParticipadas > 0 ? 'nada decidido' : '—'}</span>
  }
  return (
    <span className={estilos.acerto}>
      <span className={estilos.barra} aria-hidden="true">
        <span style={{ width: `${(linha.acertos / decididos) * 100}%` }} />
      </span>
      {linha.acertos} de {decididos}
    </span>
  )
}

export function LinhaRanking({ posicao, linha, souEu }: Props) {
  return (
    <li className={[estilos.linha, souEu && estilos.eu].filter(Boolean).join(' ')}>
      <span className={estilos.posicao}>{posicao}</span>
      <span className={estilos.jogador}>
        <Avatar apelido={linha.apelido} url={linha.avatarUrl} />
        {linha.apelido}
        {souEu && <span className={estilos.voce}>você</span>}
      </span>
      <Acerto linha={linha} />
      <span className={estilos.premios}>{linha.cpGanhoEmPremios > 0 ? `+${linha.cpGanhoEmPremios}` : '—'}</span>
      <span className={estilos.saldo}>
        <SaldoCp valor={linha.saldoCp} />
      </span>
    </li>
  )
}
