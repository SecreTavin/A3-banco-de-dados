import { useConsulta } from '../../../shared/api/useConsulta'
import type { DesafioResumo, StatusDesafio } from '../../../shared/api/tipos'

export type FiltroStatus = StatusDesafio | 'TODAS'

export function useDesafiosQuery(status: FiltroStatus) {
  return useConsulta<DesafioResumo[]>(
    status === 'TODAS' ? '/api/desafios' : `/api/desafios?status=${status}`,
  )
}
