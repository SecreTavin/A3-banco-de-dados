import { Avatar, Spinner } from '../../../shared/ui'
import type { Usuario } from '../../../shared/api/tipos'
import estilos from '../login.module.css'

interface Props {
  usuario: Usuario
  entrando: boolean
  desabilitado: boolean
  aoSelecionar: (apelido: string) => void
}

export function CartaoUsuario({ usuario, entrando, desabilitado, aoSelecionar }: Props) {
  return (
    <button
      type="button"
      className={estilos.usuario}
      disabled={desabilitado}
      onClick={() => aoSelecionar(usuario.apelido)}
    >
      <Avatar apelido={usuario.apelido} url={usuario.avatarUrl} enorme />
      <span className={estilos.usuarioTextos}>
        <span className={estilos.usuarioApelido}>{usuario.apelido}</span>
        <span className={estilos.usuarioNome}>{usuario.nome}</span>
      </span>
      {entrando && <Spinner tamanho={16} />}
    </button>
  )
}
