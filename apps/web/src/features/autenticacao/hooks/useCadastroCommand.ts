import { useComando } from '../../../shared/api/useComando'
import { useAuth } from '../../../shared/auth/AuthContext'

export function useCadastroCommand() {
  const { cadastrar } = useAuth()
  return useComando(cadastrar)
}
