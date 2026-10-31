import { Link } from 'react-router-dom'
import { SaldoCp } from '../../../shared/ui'
import { rotuloNivelFiltro } from '../../../shared/ui/status'
import type { GrupoResumo } from '../../../shared/api/tipos'
import estilos from '../grupos.module.css'

export function CardGrupo({ grupo }: { grupo: GrupoResumo }) {
  return (
    <Link to={`/grupos/${grupo.idGrupo}`} className={estilos.grupo}>
      <div className={estilos.grupoTopo}>
        <span className={estilos.grupoNome}>{grupo.nome}</span>
        <SaldoCp valor={grupo.saldoCp} />
      </div>

      {grupo.descricao && <p className={estilos.grupoDescricao}>{grupo.descricao}</p>}

      <div className={estilos.grupoRodape}>
        <span>
          {grupo.totalMembros} {grupo.totalMembros === 1 ? 'membro' : 'membros'}
        </span>
        <span>
          <span className={estilos.ponto}>· </span>filtro{' '}
          {rotuloNivelFiltro[grupo.nivelFiltro].toLowerCase()}
        </span>
      </div>
    </Link>
  )
}
