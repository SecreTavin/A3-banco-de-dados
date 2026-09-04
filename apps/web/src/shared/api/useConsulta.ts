import { useCallback, useEffect, useState } from 'react'
import { api, mensagemDeErro } from './client'

export interface Consulta<T> {
  dados: T | undefined
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

/** Leitura da API. Rota `null` suspende a busca — usar quando o parâmetro ainda não existe. */
export function useConsulta<T>(rota: string | null): Consulta<T> {
  const [dados, setDados] = useState<T>()
  const [carregando, setCarregando] = useState(rota !== null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (rota === null) {
      setCarregando(false)
      return
    }

    let atual = true
    setCarregando(true)
    setErro(null)

    api
      .get<T>(rota)
      .then((resposta) => {
        if (atual) setDados(resposta)
      })
      .catch((falha) => {
        if (atual) setErro(mensagemDeErro(falha))
      })
      .finally(() => {
        if (atual) setCarregando(false)
      })

    // Descarta a resposta de uma rota que já não é a pedida na tela.
    return () => {
      atual = false
    }
  }, [rota, tentativa])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  return { dados, carregando, erro, recarregar }
}
