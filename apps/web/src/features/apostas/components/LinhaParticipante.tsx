import { Avatar, Badge } from '../../../shared/ui'
import { rotuloEscolha, rotuloPapelAposta } from '../../../shared/ui/status'
import type { ParticipanteAposta } from '../../../shared/api/tipos'
import estilos from '../apostas.module.css'

export function LinhaParticipante({ participante }: { participante: ParticipanteAposta }) {
  return (
    <li className={estilos.participante}>
      <Avatar apelido={participante.apelido} url={participante.avatarUrl} />
      <span className={estilos.participanteApelido}>{participante.apelido}</span>
      <Badge comPonto={false} cor="var(--texto-suave)">
        {rotuloPapelAposta[participante.papelAposta]}
      </Badge>
      {participante.escolha && (
        <Badge cor={participante.escolha === 'VAI_CUMPRIR' ? 'var(--cumpriu)' : 'var(--perdeu)'}>
          {rotuloEscolha[participante.escolha]}
        </Badge>
      )}
    </li>
  )
}
