import { useConsulta } from '../../../shared/api/useConsulta'
import type { DesafioDetalhe } from '../../../shared/api/tipos'

export function useDesafioQuery(idDesafio: number) {
  return useConsulta<DesafioDetalhe>(Number.isFinite(idDesafio) ? `/api/desafios/${idDesafio}` : null)
}
