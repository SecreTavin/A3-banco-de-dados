import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NovaAposta } from '../../../shared/api/tipos'

const criar = (aposta: NovaAposta) => api.post<{ idAposta: number }>('/api/apostas', aposta)

export function useCriarApostaCommand() {
  return useComando(criar)
}
