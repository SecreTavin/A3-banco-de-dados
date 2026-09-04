import { useEffect, useRef } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { API_URL } from '../../../shared/api/client'
import { lerToken } from '../../../shared/auth/sessao'

// O hub apenas avisa que a transacao commitou; quem decide o resultado e a
// procedure no banco (ADR 0011). Aqui so recarregamos a lista.
export function useVotacaoAoVivo(grupos: number[], aoMudar: () => void) {
  const callback = useRef(aoMudar)
  callback.current = aoMudar

  const chave = [...new Set(grupos)].sort().join(',')

  useEffect(() => {
    if (!chave) return

    const hub = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/votacao`, { accessTokenFactory: () => lerToken() ?? '' })
      .withAutomaticReconnect()
      .build()

    hub.on('votacaoAtualizada', () => callback.current())
    hub.on('apostaEncerrada', () => callback.current())

    let vivo = true
    void hub
      .start()
      .then(() => {
        if (!vivo) return
        return Promise.all(
          chave.split(',').map((grupo) => hub.invoke('EntrarNoGrupo', Number(grupo))),
        )
      })
      .catch(() => {
        // Tempo real e melhoria, nao requisito: sem hub a tela ainda funciona.
      })

    return () => {
      vivo = false
      void hub.stop()
    }
  }, [chave])
}
