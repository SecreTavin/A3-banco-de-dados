import { Avatar, SaldoCp } from '../../../shared/ui'
import type { PosicaoRanking } from '../../../shared/api/tipos'
import estilos from '../ranking.module.css'

interface Props {
  posicao: number
  linha: PosicaoRanking
}

const MEDALHAS = ['🥇', '🥈', '🥉']

export function LinhaRanking({ posicao, linha }: Props) {
  const decididas = linha.acertos + linha.erros
  const aproveitamento = decididas > 0 ? Math.round((linha.acertos / decididas) * 100) : null

  return (
    <li className={estilos.linha}>
      <span className={estilos.posicao}>{MEDALHAS[posicao - 1] ?? posicao}</span>
      <Avatar apelido={linha.apelido} url={linha.avatarUrl} />

      <div className={estilos.identidade}>
        <span className={estilos.apelido}>{linha.apelido}</span>
        <span className={estilos.numeros}>
          {linha.desafiosParticipadas} desafios · {linha.acertos}A/{linha.erros}E
          {aproveitamento !== null && ` · ${aproveitamento}%`}
        </span>
      </div>

      <div className={estilos.saldos}>
        <SaldoCp valor={linha.saldoCp} />
        <span className={estilos.premios}>+{linha.cpGanhoEmPremios} em prêmios</span>
      </div>
    </li>
  )
}
