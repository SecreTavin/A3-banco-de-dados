import { Badge } from '../../../shared/ui'
import { descreverPrazo, formatarDataHora } from '../../../shared/ui/formato'
import { aparenciaStatusEvidencia, rotuloMidia } from '../../../shared/ui/status'
import type { Evidencia } from '../../../shared/api/tipos'
import estilos from '../apostas.module.css'

export function ItemEvidencia({ evidencia }: { evidencia: Evidencia }) {
  const status = aparenciaStatusEvidencia[evidencia.status]
  const emVotacao = evidencia.status === 'EM_VOTACAO'

  return (
    <li className={estilos.evidencia}>
      <div className={estilos.evidenciaTopo}>
        <span className={estilos.evidenciaOrdem}>#{evidencia.ordem}</span>
        <Badge comPonto={false} cor="var(--texto-suave)">
          {rotuloMidia[evidencia.tipoMidia]}
        </Badge>
        <span className={estilos.espaco} />
        <Badge cor={status.cor}>{status.rotulo}</Badge>
      </div>

      {evidencia.tipoMidia === 'TEXTO' ? (
        <p className={estilos.evidenciaTexto}>{evidencia.urlComprovante}</p>
      ) : (
        <a
          className={estilos.evidenciaLink}
          href={evidencia.urlComprovante}
          target="_blank"
          rel="noreferrer"
        >
          Abrir comprovante
        </a>
      )}

      {evidencia.comentario && <p className={estilos.evidenciaTexto}>{evidencia.comentario}</p>}

      {evidencia.parecerIa && (
        <p className={estilos.parecerIa}>
          <strong>Parecer da IA:</strong> {evidencia.parecerIa}
        </p>
      )}

      <div className={estilos.evidenciaVotos}>
        <span className={estilos.votoFavoravel}>{evidencia.votosFavoraveis} válido</span>
        <span className={estilos.votoContra}>{evidencia.votosContra} inválido</span>
        <span className={estilos.evidenciaQuorum}>
          quórum {evidencia.quorum} de {evidencia.totalValidadores}
        </span>
      </div>

      <span className={estilos.evidenciaRodape}>
        Enviada em {formatarDataHora(evidencia.dataEnvio)}
        {emVotacao && ` — ${descreverPrazo(evidencia.dataLimiteVotacao).texto} para votar`}
      </span>
    </li>
  )
}
