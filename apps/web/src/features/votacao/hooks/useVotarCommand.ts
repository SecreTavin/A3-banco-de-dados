import { api } from '../../../shared/api/client'
import { useComando } from '../../../shared/api/useComando'
import type { TipoVoto } from '../../../shared/api/tipos'

interface Voto {
  idEvidencia: number
  voto: TipoVoto
  justificativa: string | null
}

export function useVotarCommand() {
  return useComando<Voto, void>(({ idEvidencia, voto, justificativa }) =>
    api.post(`/api/validacao/evidencias/${idEvidencia}/votos`, { voto, justificativa }),
  )
}
