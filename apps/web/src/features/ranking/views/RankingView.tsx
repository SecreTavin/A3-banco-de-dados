import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alerta, Botao, CabecalhoPagina, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { useGruposQuery } from '../../grupos/hooks/useGruposQuery'
import { LinhaRanking } from '../components/LinhaRanking'
import { useRankingQuery } from '../hooks/useRankingQuery'
import estilos from '../ranking.module.css'

export function RankingView() {
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

  return (
    <>
      <CabecalhoPagina
        titulo="Ranking"
        descricao="Histórico completo do grupo, ordenado por saldo de CP."
      />

      <div className={estilos.chips}>
        {grupos.map((grupo) => (
          <button
            key={grupo.idGrupo}
            type="button"
            className={[estilos.chip, grupo.idGrupo === idGrupo && estilos.chipAtivo]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setEscolhido(grupo.idGrupo)}
          >
            {grupo.nome}
          </button>
        ))}
      </div>

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : ranking && ranking.length > 0 ? (
        <>
          <div className={estilos.cabecalhoTabela} aria-hidden="true">
            <span>#</span>
            <span />
            <span>Jogador</span>
            <span>Desafios</span>
            <span>Acertos</span>
            <span>Erros</span>
            <span>CP em prêmios</span>
            <span>Saldo</span>
          </div>
          <ul className={estilos.lista}>
            {ranking.map((linha, indice) => (
              <LinhaRanking key={linha.apelido} posicao={indice + 1} linha={linha} />
            ))}
          </ul>
        </>
      ) : (
        !erro && <EstadoVazio titulo="Este grupo ainda não tem histórico" />
      )}
    </>
  )
}
