import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

export function useCancelarApostaCommand(idAposta: number) {
  return useComando(
    useCallback(
      (motivo: string) => api.post<void>(`/api/apostas/${idAposta}/cancelar`, { motivo }),
      [idAposta],
    ),
  )
}
