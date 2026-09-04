import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import type { RespostaLogin, Usuario } from '../api/tipos'
import { aoExpirarSessao, gravarSessao, lerUsuario, limparSessao } from './sessao'

interface Sessao {
  usuario: Usuario | null
  entrar: (apelido: string) => Promise<void>
  sair: () => void
}

const Contexto = createContext<Sessao | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(lerUsuario)

  useEffect(() => {
    const cancelar = aoExpirarSessao(() => setUsuario(null))
    return () => {
      cancelar()
    }
  }, [])

  const entrar = useCallback(async (apelido: string) => {
    const resposta = await api.post<RespostaLogin>('/api/auth/dev/login', { apelido })
    gravarSessao(resposta.token, resposta.usuario)
    setUsuario(resposta.usuario)
  }, [])

  const sair = useCallback(() => {
    limparSessao()
    setUsuario(null)
  }, [])

  const valor = useMemo(() => ({ usuario, entrar, sair }), [usuario, entrar, sair])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return contexto
}
