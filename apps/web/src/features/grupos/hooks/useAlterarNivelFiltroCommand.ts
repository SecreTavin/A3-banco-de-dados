import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { NivelFiltro, NivelFiltroAlterado } from '../../../shared/api/tipos'

export function useAlterarNivelFiltroCommand(idGrupo: number) {
  return useComando(
    useCallback(
      (nivelFiltro: NivelFiltro) =>
        api.patch<NivelFiltroAlterado>(`/api/grupos/${idGrupo}/nivel-filtro`, { nivelFiltro }),
      [idGrupo],
    ),
  )
}
