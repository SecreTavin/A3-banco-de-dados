import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { GrupoResumo } from '../../../shared/api/tipos'

const entrar = (codigo: string) =>
  api.post<GrupoResumo>('/api/grupos/entrar', { codigo: codigo.trim().toUpperCase() })

export function useEntrarPorCodigoCommand() {
  return useComando(entrar)
}
