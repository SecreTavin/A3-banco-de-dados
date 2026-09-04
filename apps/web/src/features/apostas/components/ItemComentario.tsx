import { Avatar } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { ComentarioAposta } from '../../../shared/api/tipos'
import estilos from '../apostas.module.css'

export function ItemComentario({ comentario }: { comentario: ComentarioAposta }) {
  return (
    <li className={estilos.comentario}>
      <Avatar apelido={comentario.apelido} url={comentario.avatarUrl} />
      <div className={estilos.comentarioCorpo}>
        <span className={estilos.comentarioTopo}>
          <strong>{comentario.apelido}</strong>
          <span className={estilos.comentarioData}>{formatarDataHora(comentario.dataEnvio)}</span>
        </span>
        <p>{comentario.texto}</p>
      </div>
    </li>
  )
}
