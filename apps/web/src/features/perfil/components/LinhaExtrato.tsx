import { SaldoCp } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { LancamentoCp } from '../../../shared/api/tipos'
import estilos from '../perfil.module.css'

/** O texto gravado no ledger é técnico e sem acento; o rótulo da tela sai do tipo. */
const ROTULO_TIPO: Record<string, string> = {
  CREDITO_INICIAL: 'Crédito de entrada no grupo',
  DESAFIO_ESCROW: 'Entrada no desafio',
  APOSTA_ESCROW: 'Entrada no desafio',
  PREMIO: 'Prêmio do desafio',
  ESTORNO: 'Devolução de desafio cancelado',
  RECOMPENSA_VOTO: 'Recompensa por votar no júri',
  SAIDA_GRUPO: 'Saída do grupo',
}

export function LinhaExtrato({ lancamento }: { lancamento: LancamentoCp }) {
  return (
    <li className={estilos.lancamento}>
      <div className={estilos.lancamentoTextos}>
        <span className={estilos.lancamentoDescricao}>
          {ROTULO_TIPO[lancamento.tipo] ?? (lancamento.descricao || lancamento.tipo)}
        </span>
        <span className={estilos.lancamentoMeta}>
          {formatarDataHora(lancamento.data)} · {lancamento.grupo}
          {lancamento.desafio && ` · ${lancamento.desafio}`}
        </span>
      </div>

      <div className={estilos.lancamentoValores}>
        <SaldoCp valor={lancamento.valor} comSinal />
        <span className={estilos.lancamentoSaldo}>saldo {lancamento.saldoApos}</span>
      </div>
    </li>
  )
}
