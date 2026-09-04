import { useConsulta } from '../../../shared/api/useConsulta'
import type { Usuario } from '../../../shared/api/tipos'

export function useUsuariosSeedQuery() {
  return useConsulta<Usuario[]>('/api/auth/dev/usuarios')
}
