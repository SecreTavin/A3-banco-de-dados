import { useConsulta } from '../../../shared/api/useConsulta'
import type { MinhaProvaNoJuri } from '../../../shared/api/tipos'

/** Provas que eu enviei e que estão no júri: placar e comentários, sem votar (#83). */
export function useMinhasProvasQuery() {
  return useConsulta<MinhaProvaNoJuri[]>('/api/validacao/minhas-provas')
}
