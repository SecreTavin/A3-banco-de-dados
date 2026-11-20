import { useEffect, useState } from 'react'
import { lerArquivo, rotaDeMidia } from '../../../shared/api/client'

/**
 * Endereço exibível da foto. Foto guardada pela API só sai com o token (ADR 0022),
 * então vira um object URL; link externo passa direto.
 */
export function useFotoDaProvaQuery(url: string) {
  const rota = rotaDeMidia(url)
  const [local, setLocal] = useState<string | null>(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (!rota) return
    let ativo = true
    let criado: string | null = null
    setFalhou(false)
    lerArquivo(rota)
      .then((blob) => {
        if (!ativo) return
        criado = URL.createObjectURL(blob)
        setLocal(criado)
      })
      .catch(() => ativo && setFalhou(true))
    return () => {
      ativo = false
      if (criado) URL.revokeObjectURL(criado)
    }
  }, [rota])

  return { src: rota ? local : url, carregando: Boolean(rota) && !local && !falhou, falhou }
}
