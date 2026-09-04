import { useMemo, useState } from 'react'
import { Alerta, CabecalhoPagina, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import type { TipoVoto } from '../../../shared/api/tipos'
import { CardEvidenciaVotavel } from '../components/CardEvidenciaVotavel'
import { usePendentesQuery } from '../hooks/usePendentesQuery'
import { useVotacaoAoVivo } from '../hooks/useVotacaoAoVivo'
import { useVotarCommand } from '../hooks/useVotarCommand'
import estilos from '../votacao.module.css'

export function VotacaoView() {
  const { dados: pendentes, carregando, erro, recarregar } = usePendentesQuery()
  const votar = useVotarCommand()
  const [idVotando, setIdVotando] = useState<number | null>(null)

  const idsGrupos = useMemo(
    () => [...new Set(pendentes?.map((evidencia) => evidencia.idGrupo) ?? [])],
    [pendentes],
  )

  useVotacaoAoVivo(idsGrupos, recarregar)

  async function enviarVoto(idEvidencia: number, voto: TipoVoto, justificativa: string) {
    setIdVotando(idEvidencia)
    const resultado = await votar.executar({ idEvidencia, voto, justificativa })
    setIdVotando(null)

    if (resultado.ok) recarregar()
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Central de votação"
        descricao="Quórum é metade + 1 dos validadores congelados no envio da evidência."
      />

      {erro && <Alerta>{erro}</Alerta>}
      {votar.erro && <Alerta>{votar.erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : pendentes && pendentes.length > 0 ? (
        <div className={estilos.lista}>
          {pendentes.map((evidencia) => (
            <CardEvidenciaVotavel
              key={evidencia.idEvidencia}
              evidencia={evidencia}
              votando={idVotando === evidencia.idEvidencia}
              aoVotar={(voto, justificativa) =>
                void enviarVoto(evidencia.idEvidencia, voto, justificativa)
              }
            />
          ))}
        </div>
      ) : (
        !erro && (
          <EstadoVazio
            titulo="Nada para julgar agora"
            descricao="Quando alguém enviar uma evidência num dos seus grupos, ela aparece aqui."
          />
        )
      )}
    </>
  )
}
