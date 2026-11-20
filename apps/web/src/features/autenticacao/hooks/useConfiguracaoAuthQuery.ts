import { useConsulta } from '../../../shared/api/useConsulta'
import type { ConfiguracaoAuth } from '../../../shared/api/tipos'

export function useConfiguracaoAuthQuery() {
  return useConsulta<ConfiguracaoAuth>('/api/auth/configuracao')
}
