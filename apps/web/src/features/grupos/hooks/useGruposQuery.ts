import { useConsulta } from '../../../shared/api/useConsulta'
import type { GrupoResumo } from '../../../shared/api/tipos'

export function useGruposQuery() {
  return useConsulta<GrupoResumo[]>('/api/grupos')
}
