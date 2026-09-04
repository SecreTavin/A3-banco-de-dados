import { useConsulta } from '../../../shared/api/useConsulta'
import type { ApostaResumo, StatusAposta } from '../../../shared/api/tipos'

export type FiltroStatus = StatusAposta | 'TODAS'

export function useApostasQuery(status: FiltroStatus) {
  return useConsulta<ApostaResumo[]>(
    status === 'TODAS' ? '/api/apostas' : `/api/apostas?status=${status}`,
  )
}
