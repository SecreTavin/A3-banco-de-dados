import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { GrupoResumo, NovoGrupo } from '../../../shared/api/tipos'

const criar = (grupo: NovoGrupo) => api.post<GrupoResumo>('/api/grupos', grupo)

export function useCriarGrupoCommand() {
  return useComando(criar)
}
