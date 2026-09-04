import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NovaEvidencia } from '../../../shared/api/tipos'

export function useEnviarEvidenciaCommand(idAposta: number) {
  return useComando(
    useCallback(
      (evidencia: NovaEvidencia) =>
        api.post<{ idEvidencia: number }>(`/api/apostas/${idAposta}/evidencias`, evidencia),
      [idAposta],
    ),
  )
}
