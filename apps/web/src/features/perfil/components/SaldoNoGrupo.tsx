import { Link } from 'react-router-dom'
import { SaldoCp } from '../../../shared/ui'
import type { SaldoPorGrupo } from '../../../shared/api/tipos'
import { useRankingQuery } from '../../ranking/hooks/useRankingQuery'
import estilos from '../perfil.module.css'

/** Saldo num grupo e a posição no ranking dele: cada grupo é uma economia à parte. */
export function SaldoNoGrupo({ saldo, apelido }: { saldo: SaldoPorGrupo; apelido: string }) {
  const { dados: ranking } = useRankingQuery(saldo.idGrupo)
  const posicao = ranking ? ranking.findIndex((linha) => linha.apelido === apelido) + 1 : 0

  return (
    <li className={estilos.saldo}>
      <span className={estilos.saldoTextos}>
        <Link to={`/grupos/${saldo.idGrupo}`} className={estilos.saldoGrupo}>
          {saldo.grupo}
        </Link>
        {posicao > 0 && (
          <span className={estilos.saldoPosicao}>
            {posicao}º de {ranking?.length} no ranking
          </span>
        )}
      </span>
      <SaldoCp valor={saldo.saldoCp} />
    </li>
  )
}
