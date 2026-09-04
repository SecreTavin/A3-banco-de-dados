import { Botao, Card } from '../../../shared/ui'
import { formatarDataCompleta } from '../../../shared/ui/formato'
import type { Convite } from '../../../shared/api/tipos'
import estilos from '../grupos.module.css'

interface Props {
  convite: Convite | null
  gerando: boolean
  aoGerar: () => void
}

export function PainelConvite({ convite, gerando, aoGerar }: Props) {
  return (
    <Card>
      <div className={estilos.convite}>
        {convite ? (
          <>
            <span className={estilos.codigo}>{convite.codigo}</span>
            <span className={estilos.expiracao}>
              Válido até {formatarDataCompleta(convite.dataExpiracao)} — uso único.
            </span>
          </>
        ) : (
          <span className={estilos.expiracao}>
            Gere um código de 6 caracteres para alguém entrar no grupo.
          </span>
        )}

        <Botao variante="secundaria" carregando={gerando} onClick={aoGerar}>
          {convite ? 'Gerar outro código' : 'Gerar convite'}
        </Botao>
      </div>
    </Card>
  )
}
