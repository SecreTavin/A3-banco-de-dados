import { useConsulta } from '../../../shared/api/useConsulta'
import type { DesafioListado, StatusDesafio } from '../../../shared/api/tipos'

export type FiltroStatus = StatusDesafio | 'TODAS'

export function useDesafiosQuery(status: FiltroStatus) {
  return useConsulta<DesafioListado[]>(
    status === 'TODAS' ? '/api/desafios' : `/api/desafios?status=${status}`,
  )
}
