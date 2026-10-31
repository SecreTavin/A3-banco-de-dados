import { Link } from 'react-router-dom'
import { Badge, SaldoCp, Trilha } from '../../../shared/ui'
import { aparenciaStatusDesafio } from '../../../shared/ui/status'
import type { DesafioListado } from '../../../shared/api/tipos'
import {
  ENCERRADOS,
  acertou,
  descreverPapel,
  etapasDoDesafio,
  prazoRelevante,
  proximoPasso,
} from '../apresentacao'
import estilos from '../inicio.module.css'

/** Um desafio da lista: em que pé está, onde eu entro e quanto está em jogo. */
export function LinhaDesafio({ desafio }: { desafio: DesafioListado }) {
  const status = aparenciaStatusDesafio[desafio.status]
  const trilha = etapasDoDesafio(desafio.status)
  const encerrado = ENCERRADOS.includes(desafio.status)
  const pote = desafio.valorCp * desafio.totalParticipantes
  const resultado = acertou(desafio.status, desafio.minhaEscolha)

  return (
    <Link to={`/desafios/${desafio.idDesafio}`} className={estilos.linha}>
      <div className={estilos.linhaPrincipal}>
        <span className={estilos.linhaTopo}>
          <Badge cor={status.cor}>{status.rotulo}</Badge>
          <span className={estilos.prazo}>{prazoRelevante(desafio)}</span>
        </span>
        <span className={estilos.linhaTitulo}>{desafio.titulo}</span>
        <span className={estilos.linhaMeta}>
          {desafio.grupo} · {desafio.categoria}
        </span>
        <span className={estilos.papel}>
          {descreverPapel(desafio)}
          {resultado !== null && (
            <strong className={resultado ? estilos.acertou : estilos.errou}>
              {resultado ? ' · acertou' : ' · errou'}
            </strong>
          )}
        </span>
      </div>

      <div className={estilos.linhaEtapa}>
        <Trilha etapas={trilha.etapas} atual={trilha.atual} cor={trilha.cor} compacta />
        <span className={estilos.passo}>{proximoPasso(desafio)}</span>
      </div>

      <div className={estilos.linhaPote}>
        <SaldoCp valor={pote > 0 ? pote : desafio.valorCp} />
        <span className={estilos.poteLegenda}>
          {pote > 0 && !encerrado
            ? `no pote · ${desafio.totalParticipantes} ${desafio.totalParticipantes === 1 ? 'pessoa' : 'pessoas'}`
            : pote > 0
              ? 'foi o pote'
              : 'por pessoa'}
        </span>
      </div>
    </Link>
  )
}
