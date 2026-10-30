import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Alerta,
  Botao,
  CabecalhoPagina,
  EstadoVazio,
  Icone,
  Secao,
  SpinnerCentral,
} from '../../../shared/ui'
import { ORDEM_STATUS, aparenciaStatusDesafio } from '../../../shared/ui/status'
import { CardDesafio } from '../components/CardDesafio'
import { useDesafiosQuery } from '../hooks/useDesafiosQuery'
import type { FiltroStatus } from '../hooks/useDesafiosQuery'
import estilos from '../desafios.module.css'

const FILTROS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'TODAS', rotulo: 'Todas' },
  ...ORDEM_STATUS.map((status) => ({
    valor: status as FiltroStatus,
    rotulo: aparenciaStatusDesafio[status].rotulo,
  })),
]

export function DesafiosView() {
  const [filtro, setFiltro] = useState<FiltroStatus>('TODAS')
  const { dados: desafios, carregando, erro } = useDesafiosQuery(filtro)
  const navegar = useNavigate()

  const criei = desafios?.filter((desafio) => desafio.souCriador) ?? []
  const participo = desafios?.filter((desafio) => !desafio.souCriador) ?? []
  const vazio = criei.length === 0 && participo.length === 0
  // No desktop os cards ficam numa grade de 3 colunas; o cartão tracejado de "Novo desafio"
  // só entra quando cabe na última linha, para nunca criar uma linha a mais.
  const resto = (criei.length + participo.length) % 3

  return (
    <>
      <CabecalhoPagina
        titulo="Meus desafios"
        descricao="Ordenadas pelo prazo mais próximo."
        acao={
          <Botao onClick={() => navegar('/desafios/nova')}>Novo desafio</Botao>
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

        {!vazio && (
          <div className={estilos.contagens}>
            <span className={estilos.contagem}>Criei · {criei.length}</span>
            <span className={estilos.contagem}>Participo · {participo.length}</span>
          </div>
        )}
      </div>

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : vazio ? (
        !erro && (
          <EstadoVazio
            titulo="Nada por aqui"
            descricao="Nenhum desafio neste filtro. Que tal duvidar de alguém?"
            acao={<Botao onClick={() => navegar('/desafios/nova')}>Criar desafio</Botao>}
          />
        )
      ) : (
        <div className={estilos.listas}>
          {criei.length > 0 && (
            <Secao titulo="Criei" contagem={criei.length}>
              <div className={estilos.lista}>
                {criei.map((desafio) => (
                  <CardDesafio key={desafio.idDesafio} desafio={desafio} />
                ))}
              </div>
            </Secao>
          )}

          {participo.length > 0 && (
            <Secao titulo="Participo" contagem={participo.length}>
              <div className={estilos.lista}>
                {participo.map((desafio) => (
                  <CardDesafio key={desafio.idDesafio} desafio={desafio} />
                ))}
              </div>
            </Secao>
          )}

          {resto !== 0 && (
            <Link
              to="/desafios/nova"
              className={[estilos.novoCartao, resto === 1 && estilos.novoCartaoLargo]
                .filter(Boolean)
                .join(' ')}
            >
              <Icone nome="mais" tamanho={32} />
              Novo desafio
            </Link>
          )}
        </div>
      )}
    </>
  )
}
