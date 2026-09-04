import { useComando } from '../../../shared/api/useComando'
import { useAuth } from '../../../shared/auth/AuthContext'

export function useLoginCommand() {
  const { entrar } = useAuth()
  return useComando(entrar)
}
