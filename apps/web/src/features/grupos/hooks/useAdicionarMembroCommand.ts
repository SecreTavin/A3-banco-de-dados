import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { MembroAdicionado, NovoMembro } from '../../../shared/api/tipos'

export function useAdicionarMembroCommand(idGrupo: number) {
  return useComando(
    useCallback(
      (membro: NovoMembro) => api.post<MembroAdicionado>(`/api/grupos/${idGrupo}/membros`, membro),
      [idGrupo],
    ),
  )
}
