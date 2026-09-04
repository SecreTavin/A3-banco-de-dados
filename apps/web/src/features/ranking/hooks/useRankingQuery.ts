import { useConsulta } from '../../../shared/api/useConsulta'
import type { PosicaoRanking } from '../../../shared/api/tipos'

export function useRankingQuery(idGrupo: number | null) {
  return useConsulta<PosicaoRanking[]>(idGrupo ? `/api/ranking/grupos/${idGrupo}` : null)
}
