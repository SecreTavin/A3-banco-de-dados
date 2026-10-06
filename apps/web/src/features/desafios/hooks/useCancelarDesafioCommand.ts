import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

export function useCancelarDesafioCommand(idDesafio: number) {
  return useComando(
    useCallback(
      (motivo: string) => api.post<void>(`/api/desafios/${idDesafio}/cancelar`, { motivo }),
      [idDesafio],
    ),
  )
}
