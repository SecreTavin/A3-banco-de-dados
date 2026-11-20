import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import type { NovoCadastro, RespostaEntrada, Usuario } from '../api/tipos'
import { esquecerContaGoogle } from './google'
import { aoExpirarSessao, gravarSessao, lerUsuario, limparSessao } from './sessao'

interface Sessao {
  usuario: Usuario | null
  /** Valida o ID token do Google na API. Sem conta ainda, devolve `cadastroPendente`. */
  entrarComGoogle: (credencial: string) => Promise<RespostaEntrada>
  cadastrar: (dados: NovoCadastro) => Promise<void>
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

  const iniciarSessao = useCallback((token: string, quem: Usuario) => {
    gravarSessao(token, quem)
    setUsuario(quem)
  }, [])

  const entrarComGoogle = useCallback(
    async (credencial: string) => {
      const resposta = await api.post<RespostaEntrada>('/api/auth/google', { credential: credencial })
      if (resposta.token && resposta.usuario) iniciarSessao(resposta.token, resposta.usuario)
      return resposta
    },
    [iniciarSessao],
  )

  // O cadastro devolve o mesmo corpo do login: quem se cadastra já sai logado.
  const cadastrar = useCallback(
    async (dados: NovoCadastro) => {
      const resposta = await api.post<RespostaEntrada>('/api/auth/cadastro', dados)
      if (resposta.token && resposta.usuario) iniciarSessao(resposta.token, resposta.usuario)
    },
    [iniciarSessao],
  )

  const sair = useCallback(() => {
    limparSessao()
    esquecerContaGoogle()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, entrarComGoogle, cadastrar, sair }),
    [usuario, entrarComGoogle, cadastrar, sair],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return contexto
}
