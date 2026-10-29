import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NovaDesafio } from '../../../shared/api/tipos'

const criar = (desafio: NovaDesafio) => api.post<{ idDesafio: number }>('/api/desafios', desafio)

export function useCriarDesafioCommand() {
  return useComando(criar)
}
