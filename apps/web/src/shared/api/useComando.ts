import { useCallback, useState } from 'react'
import { mensagemDeErro } from './client'

export type Resultado<S> = { ok: true; dados: S } | { ok: false; erro: string }

export interface Comando<E, S> {
  executar: (entrada: E) => Promise<Resultado<S>>
  enviando: boolean
  erro: string | null
  limparErro: () => void
}

/**
 * Escrita na API. `executar` devolve o resultado em vez de lançar, porque o `erro`
 * do estado só chega no render seguinte — quem chamou precisa decidir na hora.
 */
export function useComando<E, S>(acao: (entrada: E) => Promise<S>): Comando<E, S> {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const executar = useCallback(
    async (entrada: E): Promise<Resultado<S>> => {
      setEnviando(true)
      setErro(null)

      try {
        return { ok: true, dados: await acao(entrada) }
      } catch (falha) {
        const mensagem = mensagemDeErro(falha)
        setErro(mensagem)
        return { ok: false, erro: mensagem }
      } finally {
        setEnviando(false)
      }
    },
    [acao],
  )

  const limparErro = useCallback(() => setErro(null), [])

  return { executar, enviando, erro, limparErro }
}
