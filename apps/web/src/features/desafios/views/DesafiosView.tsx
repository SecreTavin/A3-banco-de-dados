import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alerta, Botao, EstadoVazio, Icone, SpinnerCentral } from '../../../shared/ui'
import { useAuth } from '../../../shared/auth/AuthContext'
import { useGruposQuery } from '../../grupos/hooks/useGruposQuery'
import { usePendentesQuery } from '../../votacao/hooks/usePendentesQuery'
import { ATIVOS } from '../apresentacao'
import { LinhaDesafio } from '../components/LinhaDesafio'
import { SuaVez } from '../components/SuaVez'
import { useDesafiosQuery } from '../hooks/useDesafiosQuery'
import estilos from '../inicio.module.css'

type Aba = 'ativos' | 'encerrados'

export function DesafiosView() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const { dados: desafios, carregando, erro } = useDesafiosQuery('TODAS')
  const { dados: pendentes } = usePendentesQuery()
  const { dados: grupos } = useGruposQuery()

  const [aba, setAba] = useState<Aba>('ativos')
  const [idGrupo, setIdGrupo] = useState<number | null>(null)

  const todos = desafios ?? []
  const doGrupo = idGrupo === null ? todos : todos.filter((d) => d.idGrupo === idGrupo)
  const ativos = doGrupo.filter((d) => ATIVOS.includes(d.status))
  const encerrados = doGrupo
    .filter((d) => !ATIVOS.includes(d.status))
    // Encerrado mais recente primeiro; a lista ativa segue o prazo mais próximo.
    .sort((a, b) => b.dataLimite.localeCompare(a.dataLimite))
  const visiveis = aba === 'ativos' ? ativos : encerrados

  const meus = todos.filter((d) => ATIVOS.includes(d.status) && d.meuPapel)
  const emJogo = meus.reduce((soma, d) => soma + d.valorCp, 0)

  return (
    <>
      <header className={estilos.ola}>
        <div>
          <h1 className={estilos.olaTitulo}>Oi, {usuario?.apelido}</h1>
          <p className={estilos.olaResumo}>
            {meus.length > 0 ? (
              <>
                Você tem <strong>{emJogo} CP em jogo</strong> em {meus.length}{' '}
                {meus.length === 1 ? 'desafio' : 'desafios'}.
              </>
            ) : (
              'Você não está em nenhum desafio agora.'
            )}
          </p>
        </div>
        <Botao onClick={() => navegar('/desafios/nova')} aria-label="Novo desafio">
          <Icone nome="mais" tamanho={18} />
          <span className={estilos.textoNovo}>Novo desafio</span>
        </Botao>
      </header>

      {!carregando && !erro && (
        <SuaVez desafios={todos} pendentes={pendentes ?? []} grupos={grupos ?? []} />
      )}

      <div className={estilos.abas} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'ativos'}
          className={[estilos.aba, aba === 'ativos' && estilos.abaAtiva].filter(Boolean).join(' ')}
          onClick={() => setAba('ativos')}
        >
          Ativos <span className={estilos.abaContagem}>{ativos.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'encerrados'}
          className={[estilos.aba, aba === 'encerrados' && estilos.abaAtiva].filter(Boolean).join(' ')}
          onClick={() => setAba('encerrados')}
        >
          Encerrados <span className={estilos.abaContagem}>{encerrados.length}</span>
        </button>

        {grupos && grupos.length > 1 && (
          <label className={estilos.filtroGrupo}>
            <Icone nome="filtro" tamanho={16} />
            <select
              value={idGrupo ?? ''}
              onChange={(e) => setIdGrupo(e.target.value ? Number(e.target.value) : null)}
              aria-label="Filtrar por grupo"
            >
              <option value="">Todos os grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo.idGrupo} value={grupo.idGrupo}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : visiveis.length === 0 ? (
        !erro && (
          <EstadoVazio
            titulo={aba === 'ativos' ? 'Nenhum desafio rolando' : 'Nada encerrado ainda'}
            descricao={aba === 'ativos' ? 'Que tal duvidar de alguém?' : undefined}
            acao={
              aba === 'ativos' ? (
                <Botao onClick={() => navegar('/desafios/nova')}>Criar desafio</Botao>
              ) : undefined
            }
          />
        )
      ) : (
        <div className={estilos.lista}>
          {visiveis.map((desafio) => (
            <LinhaDesafio key={desafio.idDesafio} desafio={desafio} />
          ))}
        </div>
      )}
    </>
  )
}
