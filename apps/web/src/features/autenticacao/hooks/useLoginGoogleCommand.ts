import { useComando } from '../../../shared/api/useComando'
import { useAuth } from '../../../shared/auth/AuthContext'

export function useLoginGoogleCommand() {
  const { entrarComGoogle } = useAuth()
  return useComando(entrarComGoogle)
}
