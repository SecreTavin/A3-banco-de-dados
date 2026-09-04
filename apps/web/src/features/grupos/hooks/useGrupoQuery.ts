import { useConsulta } from '../../../shared/api/useConsulta'
import type { GrupoDetalhe } from '../../../shared/api/tipos'

export function useGrupoQuery(idGrupo: number) {
  return useConsulta<GrupoDetalhe>(Number.isFinite(idGrupo) ? `/api/grupos/${idGrupo}` : null)
}
