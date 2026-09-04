import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Botao, Campo, Icone } from '../../../shared/ui'
import { descreverPrazo } from '../../../shared/ui/formato'
import { rotuloMidia } from '../../../shared/ui/status'
import type { EvidenciaPendente, TipoVoto } from '../../../shared/api/tipos'
import estilos from '../votacao.module.css'

interface Props {
  evidencia: EvidenciaPendente
  votando: boolean
  aoVotar: (voto: TipoVoto, justificativa: string) => void
}

export function CardEvidenciaVotavel({ evidencia, votando, aoVotar }: Props) {
  const [justificativa, setJustificativa] = useState('')
  const prazo = descreverPrazo(evidencia.dataLimiteVotacao)
  const progresso = Math.min(100, (evidencia.totalVotos / evidencia.quorum) * 100)

  return (
    <article className={estilos.evidencia}>
      <header className={estilos.cabecalho}>
        <Link to={`/apostas/${evidencia.idAposta}`} className={estilos.desafio}>
          {evidencia.desafio}
        </Link>
        {evidencia.jaVotei && (
          <Badge cor="var(--cumpriu)" comPonto={false}>
            Já votado
          </Badge>
        )}
      </header>

      <div className={estilos.midia}>
        <Badge comPonto={false} cor="var(--texto-suave)">
          {rotuloMidia[evidencia.tipoMidia]}
        </Badge>
        {evidencia.tipoMidia === 'TEXTO' ? (
          <p className={estilos.relato}>{evidencia.urlComprovante}</p>
        ) : (
          <a
            className={estilos.link}
            href={evidencia.urlComprovante}
            target="_blank"
            rel="noreferrer"
          >
            Abrir comprovante
          </a>
        )}
      </div>

      {evidencia.tipoMidia === 'FOTO' && (
        <img
          className={estilos.foto}
          src={evidencia.urlComprovante}
          alt="Evidência enviada"
          // Comprovante quebrado não pode virar um retângulo vazio no meio do card.
          onError={(evento) => {
            evento.currentTarget.hidden = true
          }}
        />
      )}

      {evidencia.comentario && <p className={estilos.relato}>{evidencia.comentario}</p>}

      <div className={estilos.placar}>
        <span className={estilos.favoravel}>{evidencia.votosFavoraveis} válido</span>
        <span className={estilos.contra}>{evidencia.votosContra} inválido</span>
        <span className={estilos.aoVivo}>ao vivo</span>
      </div>

      <div className={estilos.barra}>
        <div className={estilos.barraPreenchida} style={{ width: `${progresso}%` }} />
      </div>

      <p className={estilos.legenda}>
        {evidencia.votosFaltantes > 0
          ? `Faltam ${evidencia.votosFaltantes} para o quórum de ${evidencia.quorum}`
          : 'Quórum atingido'}{' '}
        · {evidencia.totalValidadores} validadores
        <span className={prazo.urgente || prazo.vencido ? estilos.prazoUrgente : estilos.prazo}>
          <Icone nome="relogio" tamanho={13} />
          {prazo.texto}
        </span>
      </p>

      {!evidencia.jaVotei && (
        <div className={estilos.formulario}>
          <Campo rotulo="Justificativa" dica="Opcional — ajuda quem for ler a apuração depois.">
            <input
              value={justificativa}
              onChange={(evento) => setJustificativa(evento.target.value)}
              placeholder="Por que vale ou não vale?"
              maxLength={300}
            />
          </Campo>

          <div className={estilos.acoes}>
            <Botao
              variante="sucesso"
              carregando={votando}
              onClick={() => aoVotar('VALIDO', justificativa.trim())}
            >
              Válido
            </Botao>
            <Botao
              variante="recusa"
              carregando={votando}
              onClick={() => aoVotar('INVALIDO', justificativa.trim())}
            >
              Inválido
            </Botao>
          </div>
        </div>
      )}
    </article>
  )
}
