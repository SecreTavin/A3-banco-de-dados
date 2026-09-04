import { useConsulta } from '../../../shared/api/useConsulta'
import type { Perfil } from '../../../shared/api/tipos'

export function usePerfilQuery() {
  return useConsulta<Perfil>('/api/perfil')
}
