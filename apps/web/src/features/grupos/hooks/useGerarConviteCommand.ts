import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { Convite } from '../../../shared/api/tipos'

export function useGerarConviteCommand(idGrupo: number) {
  return useComando<void, Convite>(
    useCallback(() => api.post<Convite>(`/api/grupos/${idGrupo}/convites`), [idGrupo]),
  )
}
