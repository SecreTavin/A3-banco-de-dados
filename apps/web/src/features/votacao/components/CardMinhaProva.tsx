import { Link } from 'react-router-dom'
import { Icone } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { MinhaProvaNoJuri } from '../../../shared/api/tipos'
import { VotosDoJuri } from '../../desafios/components/VotosDoJuri'
import estilos from '../votacao.module.css'

/** A minha prova no júri: o placar ao vivo e o que cada jurado disse. Quem é parte não vota (RN14). */
export function CardMinhaProva({ prova }: { prova: MinhaProvaNoJuri }) {
  const lider = Math.max(prova.votosFavoraveis, prova.votosContra)
  const faltam = prova.quorum - lider
  const votaram = prova.jurados.filter((jurado) => jurado.votou).length

  return (
    <article className={estilos.card}>
      <div className={estilos.colunaProva}>
        <span className={estilos.quem}>
          <span>
            Sua prova #{prova.ordem} · <strong>{prova.grupo}</strong>
          </span>
        </span>
        <Link to={`/desafios/${prova.idDesafio}`} className={estilos.titulo}>
          {prova.desafio}
        </Link>
        {prova.comentario && <p className={estilos.comentario}>“{prova.comentario}”</p>}
        {votaram === 0 ? (
          <p className={estilos.semVotos}>Ninguém do júri votou ainda.</p>
        ) : (
          <VotosDoJuri jurados={prova.jurados} />
        )}
      </div>

      <div className={estilos.colunaDecisao}>
        <div className={estilos.fecha}>
          <span>
            <strong>{faltam === 1 ? 'Falta 1 voto' : `Faltam ${faltam} votos`} para fechar.</strong>{' '}
            {prova.votosFavoraveis} vale · {prova.votosContra} não vale. Fecha quando um lado chegar a {prova.quorum} de{' '}
            {prova.totalValidadores} jurados.
          </span>
          <span className={estilos.segmentos} aria-hidden="true">
            {Array.from({ length: prova.quorum }, (_, indice) => (
              <span key={indice} className={indice < lider ? estilos.segmentoFeito : undefined} />
            ))}
          </span>
          <span className={estilos.prazo}>
            <Icone nome="relogio" tamanho={14} />
            júri até {formatarDataHora(prova.dataLimiteVotacao)}
          </span>
        </div>
        <span className={estilos.parte}>Você é o desafiado: acompanha o júri, mas não vota.</span>
      </div>
    </article>
  )
}
