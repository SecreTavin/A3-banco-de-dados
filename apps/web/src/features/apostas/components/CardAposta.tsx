import { Link } from 'react-router-dom'
import { Badge, Icone, SaldoCp } from '../../../shared/ui'
import { descreverPrazo } from '../../../shared/ui/formato'
import { aparenciaStatusAposta, descreverRecompensa } from '../../../shared/ui/status'
import type { ApostaResumo } from '../../../shared/api/tipos'
import estilos from '../apostas.module.css'

export function CardAposta({ aposta }: { aposta: ApostaResumo }) {
  const status = aparenciaStatusAposta[aposta.status]
  const prazo = descreverPrazo(aposta.dataLimite)

  return (
    <article className={estilos.aposta}>
      <div className={estilos.apostaTopo}>
        <Link to={`/apostas/${aposta.idAposta}`} className={estilos.apostaTitulo}>
          {aposta.titulo}
        </Link>
        <Badge cor={status.cor}>{status.rotulo}</Badge>
      </div>

      <p className={estilos.apostaMeta}>
        {aposta.grupo} · {aposta.categoria}
      </p>

      <p className={estilos.apostaRecompensa}>
        Vale {descreverRecompensa(aposta.tipoRecompensa, aposta.descricaoRecompensa)}
      </p>

      <div className={estilos.apostaRodape}>
        <SaldoCp valor={aposta.valorCp} />
        <span className={prazo.urgente || prazo.vencido ? estilos.prazoUrgente : estilos.prazo}>
          <Icone nome="relogio" tamanho={14} />
          {prazo.texto}
        </span>
        {aposta.status === 'EM_VOTACAO' && (
          <Link to="/votacao" className={estilos.cta}>
            Vote agora
          </Link>
        )}
      </div>
    </article>
  )
}
