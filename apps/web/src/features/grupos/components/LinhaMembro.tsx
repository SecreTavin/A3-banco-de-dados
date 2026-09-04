import { Avatar, Badge, SaldoCp } from '../../../shared/ui'
import { rotuloPapelGrupo } from '../../../shared/ui/status'
import type { MembroGrupo } from '../../../shared/api/tipos'
import estilos from '../grupos.module.css'

export function LinhaMembro({ membro }: { membro: MembroGrupo }) {
  return (
    <li className={estilos.membro}>
      <Avatar apelido={membro.apelido} url={membro.avatarUrl} />
      <span className={estilos.membroApelido}>{membro.apelido}</span>
      <Badge cor={membro.papel === 'ADMIN' ? 'var(--em-votacao)' : 'var(--texto-fraco)'}>
        {rotuloPapelGrupo[membro.papel]}
      </Badge>
      <SaldoCp valor={membro.saldoCp} />
    </li>
  )
}
