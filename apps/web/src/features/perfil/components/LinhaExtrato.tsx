import { SaldoCp } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { LancamentoCp } from '../../../shared/api/tipos'
import estilos from '../perfil.module.css'

export function LinhaExtrato({ lancamento }: { lancamento: LancamentoCp }) {
  return (
    <li className={estilos.lancamento}>
      <div className={estilos.lancamentoTextos}>
        <span className={estilos.lancamentoDescricao}>
          {lancamento.descricao || lancamento.tipo}
        </span>
        <span className={estilos.lancamentoMeta}>
          {formatarDataHora(lancamento.data)}
          {lancamento.aposta && ` · ${lancamento.aposta}`}
        </span>
      </div>

      <div className={estilos.lancamentoValores}>
        <SaldoCp valor={lancamento.valor} comSinal />
        <span className={estilos.lancamentoSaldo}>saldo {lancamento.saldoApos}</span>
      </div>
    </li>
  )
}
