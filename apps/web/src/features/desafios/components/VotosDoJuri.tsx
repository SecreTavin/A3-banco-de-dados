import { Badge } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { Jurado } from '../../../shared/api/tipos'
import estilos from '../detalhe.module.css'

/**
 * Cada voto já dado, com o nome, Vale/Não vale e a justificativa (RF07). Para o jurado
 * que ainda não votou, a API manda o voto dos outros nulo (RN29), e ele não aparece.
 */
export function VotosDoJuri({ jurados }: { jurados: Jurado[] }) {
  const votos = jurados.filter((jurado) => jurado.voto !== null)
  if (votos.length === 0) return null

  return (
    <ul className={estilos.votos} aria-label="Votos do júri">
      {votos.map((jurado) => (
        <li key={jurado.idUsuario} className={estilos.voto}>
          <span className={estilos.votoTopo}>
            <strong>{jurado.apelido}</strong>
            <Badge cor={jurado.voto === 'VALIDO' ? 'var(--cumpriu)' : 'var(--perdeu)'}>
              {jurado.voto === 'VALIDO' ? 'Vale' : 'Não vale'}
            </Badge>
            {jurado.dataVoto && <span className={estilos.votoData}>{formatarDataHora(jurado.dataVoto)}</span>}
          </span>
          {jurado.justificativa ? (
            <p className={estilos.votoTexto}>“{jurado.justificativa}”</p>
          ) : (
            <p className={estilos.votoSemTexto}>Votou sem comentário.</p>
          )}
        </li>
      ))}
    </ul>
  )
}
