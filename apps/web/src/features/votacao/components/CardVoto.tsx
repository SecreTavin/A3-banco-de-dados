import { Link } from 'react-router-dom'
import { Avatar, Botao, Icone } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import type { EvidenciaPendente, TipoVoto } from '../../../shared/api/tipos'
import { MidiaProva } from '../../desafios/components/CartaoProva'
import estilos from '../votacao.module.css'

interface Props {
  evidencia: EvidenciaPendente
  aoEscolher: (voto: TipoVoto) => void
}

/** Uma prova para julgar: a regra do desafio, a prova e o peso do meu voto. */
export function CardVoto({ evidencia, aoEscolher }: Props) {
  const lider = Math.max(evidencia.votosFavoraveis, evidencia.votosContra)
  const fechaComMeuVoto = !evidencia.jaVotei && evidencia.votosFaltantes === 1

  return (
    <article className={estilos.card}>
      <div className={estilos.colunaProva}>
        <span className={estilos.quem}>
          <Avatar apelido={evidencia.desafiado} />
          <span>
            <strong>{evidencia.desafiado}</strong> diz que cumpriu
          </span>
        </span>
        <Link to={`/desafios/${evidencia.idDesafio}`} className={estilos.titulo}>
          {evidencia.desafio}
        </Link>

        {evidencia.descricaoDesafio && (
          <div className={estilos.regra}>
            <span className={estilos.regraRotulo}>O que vale</span>
            {evidencia.descricaoDesafio}
          </div>
        )}

        <MidiaProva evidencia={evidencia} />
        {evidencia.comentario && <p className={estilos.comentario}>“{evidencia.comentario}”</p>}
      </div>

      <div className={estilos.colunaDecisao}>
        <div className={[estilos.fecha, fechaComMeuVoto && estilos.fechaDestaque].filter(Boolean).join(' ')}>
          <span>
            {evidencia.jaVotei ? (
              <strong>Você já votou.</strong>
            ) : fechaComMeuVoto ? (
              <strong>Seu voto fecha o júri.</strong>
            ) : (
              <strong>Faltam {evidencia.votosFaltantes} votos para fechar.</strong>
            )}{' '}
            {evidencia.votosFavoraveis} vale · {evidencia.votosContra} não vale. Fecha quando um lado chegar a{' '}
            {evidencia.quorum} de {evidencia.totalValidadores} jurados.
          </span>
          <span className={estilos.segmentos} aria-hidden="true">
            {Array.from({ length: evidencia.quorum }, (_, indice) => (
              <span
                key={indice}
                className={
                  indice < lider ? estilos.segmentoFeito : indice === lider && fechaComMeuVoto ? estilos.segmentoMeu : undefined
                }
              />
            ))}
          </span>
          <span className={estilos.prazo}>
            <Icone nome="relogio" tamanho={14} />
            júri até {formatarDataHora(evidencia.dataLimiteVotacao)}
          </span>
        </div>

        {!evidencia.jaVotei && (
          <>
            <span className={estilos.ganha}>+2 CP para quem votar, quando o júri fechar</span>
            <div className={estilos.botoes}>
              <Botao variante="recusa" onClick={() => aoEscolher('INVALIDO')}>
                <Icone nome="fechar" tamanho={20} />
                Não vale
              </Botao>
              <Botao variante="sucesso" onClick={() => aoEscolher('VALIDO')}>
                <Icone nome="check" tamanho={20} />
                Vale
              </Botao>
            </div>
          </>
        )}
      </div>
    </article>
  )
}
