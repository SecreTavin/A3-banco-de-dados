import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NovaParticipacao } from '../../../shared/api/tipos'

export function useAceitarApostaCommand(idAposta: number) {
  return useComando(
    useCallback(
      (participacao: NovaParticipacao) =>
        api.post<void>(`/api/apostas/${idAposta}/participantes`, participacao),
      [idAposta],
    ),
  )
}
