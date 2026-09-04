import { useConsulta } from '../../../shared/api/useConsulta'
import type { EvidenciaPendente } from '../../../shared/api/tipos'

export function usePendentesQuery() {
  return useConsulta<EvidenciaPendente[]>('/api/validacao/pendentes')
}
