import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NovaParticipacao } from '../../../shared/api/tipos'

export function useAceitarDesafioCommand(idDesafio: number) {
  return useComando(
    useCallback(
      (participacao: NovaParticipacao) =>
        api.post<void>(`/api/desafios/${idDesafio}/participantes`, participacao),
      [idDesafio],
    ),
  )
}
