import { useCallback } from 'react'
import { api, urlDaApi } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'

/** Lado maior da foto depois de reduzida: nítida no júri e leve na rede do celular. */
const LADO_MAXIMO = 1600

/** Reduz no navegador antes de subir. Se não der (formato que o canvas não lê), sobe o original. */
async function reduzir(arquivo: File): Promise<Blob> {
  try {
    const imagem = await createImageBitmap(arquivo)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagem.width * escala)
    canvas.height = Math.round(imagem.height * escala)
    canvas.getContext('2d')?.drawImage(imagem, 0, 0, canvas.width, canvas.height)
    imagem.close()
    const reduzida = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', 0.85))
    return reduzida && reduzida.size < arquivo.size ? reduzida : arquivo
  } catch {
    return arquivo
  }
}

/** Sobe a foto da prova (ADR 0022) e devolve a URL que vai em `urlComprovante`. */
export function useEnviarFotoCommand() {
  return useComando(
    useCallback(async (arquivo: File) => {
      const formulario = new FormData()
      formulario.append('arquivo', await reduzir(arquivo), arquivo.name)
      const { url } = await api.enviarArquivo<{ url: string }>('/api/midia', formulario)
      return urlDaApi(url)
    }, []),
  )
}
