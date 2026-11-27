import { useMemo, useState } from 'react'
import { Alerta, CabecalhoPagina, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { api } from '../../../shared/api/client'
import type { DesafioDetalhe, EvidenciaPendente, TipoVoto } from '../../../shared/api/tipos'
import { CardMinhaProva } from '../components/CardMinhaProva'
import { CardVoto } from '../components/CardVoto'
import { ConfirmarVoto } from '../components/ConfirmarVoto'
import { ResultadoVoto } from '../components/ResultadoVoto'
import { useMinhasProvasQuery } from '../hooks/useMinhasProvasQuery'
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
  // O desafiado não vota na própria prova (RN14), mas acompanha o placar e os comentários (#83).
  const minhas = useMinhasProvasQuery()
  const votar = useVotarCommand()
  const [escolha, setEscolha] = useState<Escolha | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const idsGrupos = useMemo(
    () => [
      ...new Set([
        ...(pendentes?.map((evidencia) => evidencia.idGrupo) ?? []),
        ...(minhas.dados?.map((prova) => prova.idGrupo) ?? []),
      ]),
    ],
    [pendentes, minhas.dados],
  )

  const recarregarMinhas = minhas.recarregar
  useVotacaoAoVivo(idsGrupos, () => {
    recarregar()
    recarregarMinhas()
  })

  const aFazer = pendentes?.filter((evidencia) => !evidencia.jaVotei) ?? []
  const jaVotadas = pendentes?.filter((evidencia) => evidencia.jaVotei) ?? []
  const minhasProvas = minhas.dados ?? []

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
      {minhas.erro && <Alerta>{minhas.erro}</Alerta>}

      {carregando || minhas.carregando ? (
        <SpinnerCentral />
      ) : aFazer.length + jaVotadas.length + minhasProvas.length === 0 ? (
        !erro && (
          <EstadoVazio
            titulo="Nada para julgar agora"
            descricao="Quando alguém mandar uma prova num dos seus grupos, ela aparece aqui."
          />
        )
      ) : (
        <>
          {aFazer.length + jaVotadas.length > 0 && (
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

          {minhasProvas.length > 0 && (
            <div className={estilos.lista}>
              <h2 className={estilos.secao}>Suas provas no júri</h2>
              {minhasProvas.map((prova) => (
                <CardMinhaProva key={prova.idEvidencia} prova={prova} />
              ))}
            </div>
          )}
        </>
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
