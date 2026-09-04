import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alerta,
  Botao,
  CabecalhoPagina,
  EstadoVazio,
  Secao,
  SpinnerCentral,
} from '../../../shared/ui'
import { ORDEM_STATUS, aparenciaStatusAposta } from '../../../shared/ui/status'
import { CardAposta } from '../components/CardAposta'
import { useApostasQuery } from '../hooks/useApostasQuery'
import type { FiltroStatus } from '../hooks/useApostasQuery'
import estilos from '../apostas.module.css'

const FILTROS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'TODAS', rotulo: 'Todas' },
  ...ORDEM_STATUS.map((status) => ({
    valor: status as FiltroStatus,
    rotulo: aparenciaStatusAposta[status].rotulo,
  })),
]

export function ApostasView() {
  const [filtro, setFiltro] = useState<FiltroStatus>('TODAS')
  const { dados: apostas, carregando, erro } = useApostasQuery(filtro)
  const navegar = useNavigate()

  const criei = apostas?.filter((aposta) => aposta.souCriador) ?? []
  const participo = apostas?.filter((aposta) => !aposta.souCriador) ?? []
  const vazio = criei.length === 0 && participo.length === 0

  return (
    <>
      <CabecalhoPagina
        titulo="Minhas apostas"
        descricao="Ordenadas pelo prazo mais próximo."
        acao={
          <Botao onClick={() => navegar('/apostas/nova')}>Nova aposta</Botao>
        }
      />

      <div className={estilos.filtros}>
        {FILTROS.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className={[estilos.chip, filtro === opcao.valor && estilos.chipAtivo]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setFiltro(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : vazio ? (
        !erro && (
          <EstadoVazio
            titulo="Nada por aqui"
            descricao="Nenhuma aposta neste filtro. Que tal duvidar de alguém?"
            acao={<Botao onClick={() => navegar('/apostas/nova')}>Criar aposta</Botao>}
          />
        )
      ) : (
        <>
          {criei.length > 0 && (
            <Secao titulo="Criei" contagem={criei.length}>
              <div className={estilos.lista}>
                {criei.map((aposta) => (
                  <CardAposta key={aposta.idAposta} aposta={aposta} />
                ))}
              </div>
            </Secao>
          )}

          {participo.length > 0 && (
            <Secao titulo="Participo" contagem={participo.length}>
              <div className={estilos.lista}>
                {participo.map((aposta) => (
                  <CardAposta key={aposta.idAposta} aposta={aposta} />
                ))}
              </div>
            </Secao>
          )}
        </>
      )}
    </>
  )
}
