import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { GrupoCriado, NovoGrupo } from '../../../shared/api/tipos'

const criar = (grupo: NovoGrupo) => api.post<GrupoCriado>('/api/grupos', grupo)

export function useCriarGrupoCommand() {
  return useComando(criar)
}
