import { Avatar, Badge, Botao, SaldoCp } from '../../../shared/ui'
import { rotuloPapelGrupo } from '../../../shared/ui/status'
import type { MembroGrupo } from '../../../shared/api/tipos'
import estilos from '../grupos.module.css'

interface Props {
  membro: MembroGrupo
  /** Só chega quando quem vê é admin e a linha não é a própria — sair do grupo tem botão separado. */
  aoRemover?: () => void
  removendo?: boolean
}

export function LinhaMembro({ membro, aoRemover, removendo = false }: Props) {
  return (
    <li className={estilos.membro}>
      <Avatar apelido={membro.apelido} url={membro.avatarUrl} />
      <span className={estilos.membroApelido}>{membro.apelido}</span>
      <Badge cor={membro.papel === 'ADMIN' ? 'var(--em-votacao)' : 'var(--texto-fraco)'}>
        {rotuloPapelGrupo[membro.papel]}
      </Badge>
      <SaldoCp valor={membro.saldoCp} />
      {aoRemover && (
        <Botao variante="fantasma" tamanho="pequeno" carregando={removendo} onClick={aoRemover}>
          Remover
        </Botao>
      )}
    </li>
  )
}
