import { Avatar, Badge } from '../../../shared/ui'
import { rotuloEscolha, rotuloPapelDesafio } from '../../../shared/ui/status'
import type { ParticipanteDesafio } from '../../../shared/api/tipos'
import estilos from '../desafios.module.css'

export function LinhaParticipante({ participante }: { participante: ParticipanteDesafio }) {
  return (
    <li className={estilos.participante}>
      <Avatar apelido={participante.apelido} url={participante.avatarUrl} />
      <span className={estilos.participanteApelido}>{participante.apelido}</span>
      <Badge comPonto={false} cor="var(--texto-suave)">
        {rotuloPapelDesafio[participante.papelDesafio]}
      </Badge>
      {participante.escolha && (
        <Badge cor={participante.escolha === 'VAI_CUMPRIR' ? 'var(--cumpriu)' : 'var(--perdeu)'}>
          {rotuloEscolha[participante.escolha]}
        </Badge>
      )}
    </li>
  )
}
