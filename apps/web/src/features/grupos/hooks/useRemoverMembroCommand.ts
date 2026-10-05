import { useCallback } from 'react'
import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

/** Mesma rota para o admin tirar alguém e para o próprio membro sair do grupo. */
export function useRemoverMembroCommand(idGrupo: number) {
  return useComando(
    useCallback(
      (idUsuario: number) => api.delete<void>(`/api/grupos/${idGrupo}/membros/${idUsuario}`),
      [idGrupo],
    ),
  )
}
