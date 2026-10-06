import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

export function useComentarCommand(idDesafio: number) {
  return useComando(
    useCallback(
      (texto: string) => api.post<void>(`/api/desafios/${idDesafio}/comentarios`, { texto }),
      [idDesafio],
    ),
  )
}
