import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

export function useComentarCommand(idAposta: number) {
  return useComando(
    useCallback(
      (texto: string) => api.post<void>(`/api/apostas/${idAposta}/comentarios`, { texto }),
      [idAposta],
    ),
  )
}
