import { useConsulta } from '../../../shared/api/useConsulta'
import type { ApostaDetalhe } from '../../../shared/api/tipos'

export function useApostaQuery(idAposta: number) {
  return useConsulta<ApostaDetalhe>(Number.isFinite(idAposta) ? `/api/apostas/${idAposta}` : null)
}
