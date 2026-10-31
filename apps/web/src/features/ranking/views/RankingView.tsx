import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alerta, Botao, CabecalhoPagina, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { useAuth } from '../../../shared/auth/AuthContext'
import { useGruposQuery } from '../../grupos/hooks/useGruposQuery'
import { LinhaRanking } from '../components/LinhaRanking'
import { Podio } from '../components/Podio'
import { useRankingQuery } from '../hooks/useRankingQuery'
import estilos from '../ranking.module.css'

export function RankingView() {
  const { usuario } = useAuth()
  const { dados: grupos, carregando: carregandoGrupos, erro: erroGrupos } = useGruposQuery()
  // `?grupo=` chega da aba Ranking do detalhe do grupo.
  const [busca] = useSearchParams()
  const [escolhido, setEscolhido] = useState<number | null>(Number(busca.get('grupo')) || null)
  const navegar = useNavigate()

  // Cada grupo tem seu próprio histórico; o primeiro da lista serve de padrão.
  const idGrupo = escolhido ?? grupos?.[0]?.idGrupo ?? null
  const { dados: ranking, carregando, erro } = useRankingQuery(idGrupo)

  if (carregandoGrupos) return <SpinnerCentral />
  if (erroGrupos) return <Alerta>{erroGrupos}</Alerta>

  if (!grupos || grupos.length === 0) {
    return (
      <>
        <CabecalhoPagina titulo="Ranking" />
        <EstadoVazio
          titulo="Sem grupo, sem ranking"
          descricao="O histórico é por grupo."
          acao={<Botao onClick={() => navegar('/grupos')}>Ir para meus grupos</Botao>}
        />
      </>
    )
  }

  const resto = ranking?.slice(3) ?? []

  return (
    <>
      <header className={estilos.cabecalho}>
        <div>
          <h1>Ranking</h1>
          <p>Quem tem mais CP no grupo — e quem mais acerta.</p>
        </div>
        <div className={estilos.grupos} role="tablist" aria-label="Grupo">
          {grupos.map((grupo) => (
            <button
              key={grupo.idGrupo}
              type="button"
              role="tab"
              aria-selected={grupo.idGrupo === idGrupo}
              className={[estilos.grupo, grupo.idGrupo === idGrupo && estilos.grupoAtivo].filter(Boolean).join(' ')}
              onClick={() => setEscolhido(grupo.idGrupo)}
            >
              {grupo.nome}
            </button>
          ))}
        </div>
      </header>

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : ranking && ranking.length > 0 ? (
        <div className={estilos.corpo}>
          <Podio primeiros={ranking.slice(0, 3)} meuApelido={usuario?.apelido} />
          {resto.length > 0 && (
            <div className={estilos.tabela}>
              <div className={[estilos.linha, estilos.titulos].join(' ')} aria-hidden="true">
                <span>#</span>
                <span>Jogador</span>
                <span>Acerto</span>
                <span>Prêmios</span>
                <span>Saldo</span>
              </div>
              <ol className={estilos.lista}>
                {resto.map((linha, indice) => (
                  <LinhaRanking
                    key={linha.apelido}
                    posicao={indice + 4}
                    linha={linha}
                    souEu={linha.apelido === usuario?.apelido}
                  />
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        !erro && <EstadoVazio titulo="Este grupo ainda não tem histórico" />
      )}
    </>
  )
}
