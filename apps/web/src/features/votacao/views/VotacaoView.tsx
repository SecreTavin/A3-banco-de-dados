import { useMemo, useState } from 'react'
import { Alerta, CabecalhoPagina, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { api } from '../../../shared/api/client'
import type { DesafioDetalhe, EvidenciaPendente, TipoVoto } from '../../../shared/api/tipos'
import { CardVoto } from '../components/CardVoto'
import { ConfirmarVoto } from '../components/ConfirmarVoto'
import { ResultadoVoto } from '../components/ResultadoVoto'
import { usePendentesQuery } from '../hooks/usePendentesQuery'
import { useVotacaoAoVivo } from '../hooks/useVotacaoAoVivo'
import { useVotarCommand } from '../hooks/useVotarCommand'
import estilos from '../votacao.module.css'

interface Escolha {
  evidencia: EvidenciaPendente
  voto: TipoVoto
}

interface Resultado {
  desafio: DesafioDetalhe
  idEvidencia: number
}

export function VotacaoView() {
  const { dados: pendentes, carregando, erro, recarregar } = usePendentesQuery()
  const votar = useVotarCommand()
  const [escolha, setEscolha] = useState<Escolha | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const idsGrupos = useMemo(
    () => [...new Set(pendentes?.map((evidencia) => evidencia.idGrupo) ?? [])],
    [pendentes],
  )

  useVotacaoAoVivo(idsGrupos, recarregar)

  const aFazer = pendentes?.filter((evidencia) => !evidencia.jaVotei) ?? []
  const jaVotadas = pendentes?.filter((evidencia) => evidencia.jaVotei) ?? []

  async function confirmar(justificativa: string) {
    if (!escolha) return
    const { evidencia, voto } = escolha
    const enviado = await votar.executar({ idEvidencia: evidencia.idEvidencia, voto, justificativa })
    if (!enviado.ok) return

    setEscolha(null)
    // A apuração já commitou na procedure; aqui só lemos o desfecho para mostrar.
    try {
      const desafio = await api.get<DesafioDetalhe>(`/api/desafios/${evidencia.idDesafio}`)
      setResultado({ desafio, idEvidencia: evidencia.idEvidencia })
    } finally {
      recarregar()
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Votação"
        descricao="Provas dos seus grupos esperando o seu voto. O júri fecha quando um lado tem a maioria."
      />

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : aFazer.length + jaVotadas.length === 0 ? (
        !erro && (
          <EstadoVazio
            titulo="Nada para julgar agora"
            descricao="Quando alguém mandar uma prova num dos seus grupos, ela aparece aqui."
          />
        )
      ) : (
        <div className={estilos.lista}>
          {[...aFazer, ...jaVotadas].map((evidencia) => (
            <CardVoto
              key={evidencia.idEvidencia}
              evidencia={evidencia}
              aoEscolher={(voto) => {
                votar.limparErro()
                setEscolha({ evidencia, voto })
              }}
            />
          ))}
        </div>
      )}

      {escolha && (
        <ConfirmarVoto
          voto={escolha.voto}
          enviando={votar.enviando}
          erro={votar.erro}
          aoConfirmar={(justificativa) => void confirmar(justificativa)}
          aoVoltar={() => setEscolha(null)}
        />
      )}

      {resultado && (
        <ResultadoVoto
          desafio={resultado.desafio}
          idEvidencia={resultado.idEvidencia}
          aoFechar={() => setResultado(null)}
        />
      )}
    </>
  )
}
