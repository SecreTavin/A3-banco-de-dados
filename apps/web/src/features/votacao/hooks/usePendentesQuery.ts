import { useConsulta } from '../../../shared/api/useConsulta'
import type { EvidenciaPendente } from '../../../shared/api/tipos'

/** `ativo = false` suspende a busca — fora da área logada não há token para mandar. */
export function usePendentesQuery(ativo = true) {
  return useConsulta<EvidenciaPendente[]>(ativo ? '/api/validacao/pendentes' : null)
}
