import { Link } from 'react-router-dom'
import { Badge, Icone, SaldoCp } from '../../../shared/ui'
import { descreverPrazo } from '../../../shared/ui/formato'
import { aparenciaStatusDesafio, descreverRecompensa } from '../../../shared/ui/status'
import type { DesafioResumo } from '../../../shared/api/tipos'
import estilos from '../desafios.module.css'

export function CardDesafio({ desafio }: { desafio: DesafioResumo }) {
  const status = aparenciaStatusDesafio[desafio.status]
  const prazo = descreverPrazo(desafio.dataLimite)

  return (
    <article className={estilos.desafio}>
      <div className={estilos.desafioTopo}>
        <Link to={`/desafios/${desafio.idDesafio}`} className={estilos.desafioTitulo}>
          {desafio.titulo}
        </Link>
        <Badge cor={status.cor}>{status.rotulo}</Badge>
      </div>

      <p className={estilos.desafioMeta}>
        {desafio.grupo} · {desafio.categoria}
      </p>

      <p className={estilos.desafioRecompensa}>
        Vale{' '}
        {descreverRecompensa(desafio.tipoRecompensa, desafio.valorMonetario, desafio.descricaoPrenda)}
      </p>

      <div className={estilos.desafioRodape}>
        <SaldoCp valor={desafio.valorCp} />
        <span className={prazo.urgente || prazo.vencido ? estilos.prazoUrgente : estilos.prazo}>
          <Icone nome="relogio" tamanho={14} />
          {prazo.texto}
        </span>
        {desafio.status === 'EM_VOTACAO' && (
          <Link to="/votacao" className={estilos.cta}>
            Vote agora
          </Link>
        )}
      </div>
    </article>
  )
}
