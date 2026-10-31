import { Avatar, SaldoCp } from '../../../shared/ui'
import type { PosicaoRanking } from '../../../shared/api/tipos'
import estilos from '../ranking.module.css'

interface Props {
  primeiros: PosicaoRanking[]
  meuApelido: string | undefined
}

function resumo(linha: PosicaoRanking) {
  const decididos = linha.acertos + linha.erros
  if (linha.desafiosParticipadas === 0) return 'ainda sem desafio'
  const acerto = decididos > 0 ? `acertou ${linha.acertos} de ${decididos}` : 'nada decidido'
  return linha.cpGanhoEmPremios > 0 ? `${acerto} · +${linha.cpGanhoEmPremios} CP em prêmios` : acerto
}

/** Os três primeiros, com o primeiro no meio e mais alto. */
export function Podio({ primeiros, meuApelido }: Props) {
  // Ordem visual de pódio: 2º, 1º, 3º.
  const ordem = [1, 0, 2].filter((indice) => primeiros[indice])

  return (
    <ol className={estilos.podio}>
      {ordem.map((indice) => {
        const linha = primeiros[indice]
        return (
          <li
            key={linha.apelido}
            className={[estilos.degrau, indice === 0 && estilos.primeiro].filter(Boolean).join(' ')}
          >
            <span className={estilos.lugar}>{indice + 1}º</span>
            <Avatar apelido={linha.apelido} url={linha.avatarUrl} grande />
            <strong className={estilos.nome}>
              {linha.apelido}
              {linha.apelido === meuApelido && <span className={estilos.voce}>você</span>}
            </strong>
            <SaldoCp valor={linha.saldoCp} grande={indice === 0} />
            <span className={estilos.resumo}>{resumo(linha)}</span>
          </li>
        )
      })}
    </ol>
  )
}
