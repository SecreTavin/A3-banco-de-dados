import { useConsulta } from '../../../shared/api/useConsulta'
import type { Categoria } from '../../../shared/api/tipos'

export function useCategoriasQuery() {
  return useConsulta<Categoria[]>('/api/categorias')
}
