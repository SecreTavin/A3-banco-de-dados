import { useState } from 'react'
import { Avatar, Badge, Icone } from '../../../shared/ui'
import { descreverPrazo, formatarDataHora } from '../../../shared/ui/formato'
import { aparenciaStatusEvidencia, rotuloMidia } from '../../../shared/ui/status'
import type { Evidencia } from '../../../shared/api/tipos'
import { rotaDeMidia } from '../../../shared/api/client'
import { useFotoDaProvaQuery } from '../hooks/useFotoDaProvaQuery'
import estilos from '../detalhe.module.css'

interface Props {
  evidencia: Evidencia
  /** A prova mais recente aparece inteira; as anteriores, resumidas. */
  destaque: boolean
}

/** O comprovante na própria tela. Se a imagem não carregar, cai no link. */
export function MidiaProva({ evidencia }: { evidencia: Pick<Evidencia, 'tipoMidia' | 'urlComprovante'> }) {
  const [quebrou, setQuebrou] = useState(false)
  const foto = useFotoDaProvaQuery(evidencia.urlComprovante)
  const falhou = quebrou || foto.falhou

  if (evidencia.tipoMidia === 'TEXTO') {
    return <p className={estilos.relato}>{evidencia.urlComprovante}</p>
  }

  if (evidencia.tipoMidia === 'FOTO' && foto.carregando) {
    return <div className={[estilos.foto, estilos.fotoCarregando].join(' ')} aria-busy="true" aria-label="Carregando a foto" />
  }

  if (evidencia.tipoMidia === 'FOTO' && !falhou && foto.src) {
    return (
      <a className={estilos.foto} href={foto.src} target="_blank" rel="noreferrer" title="Abrir em tamanho real">
        <img src={foto.src} alt="Comprovante enviado" onError={() => setQuebrou(true)} />
        <span className={estilos.ampliar}>
          <Icone nome="ampliar" tamanho={16} />
        </span>
      </a>
    )
  }

  // Foto guardada pela API só abre com o token: o link puro daria 401.
  if (rotaDeMidia(evidencia.urlComprovante)) {
    return <p className={estilos.relato}>Não foi possível carregar a foto. Recarregue a página.</p>
  }

  return (
    <a className={estilos.linkProva} href={evidencia.urlComprovante} target="_blank" rel="noreferrer">
      <Icone nome="ampliar" tamanho={16} />
      Abrir {rotuloMidia[evidencia.tipoMidia].toLowerCase()} do comprovante
    </a>
  )
}

export function CartaoProva({ evidencia, destaque }: Props) {
  const status = aparenciaStatusEvidencia[evidencia.status]
  const emVotacao = evidencia.status === 'EM_VOTACAO'
  const lider = Math.max(evidencia.votosFavoraveis, evidencia.votosContra)

  if (!destaque) {
    return (
      <li className={estilos.provaAntiga}>
        <span>Prova #{evidencia.ordem}</span>
        <Badge cor={status.cor}>{status.rotulo}</Badge>
        <span className={estilos.provaAntigaVotos}>
          {evidencia.votosFavoraveis} vale · {evidencia.votosContra} não vale
        </span>
      </li>
    )
  }

  return (
    <article className={estilos.prova}>
      <header className={estilos.provaTopo}>
        <h2>Prova #{evidencia.ordem}</h2>
        <Badge cor={status.cor}>{emVotacao ? 'no júri' : status.rotulo}</Badge>
      </header>

      <MidiaProva evidencia={evidencia} />

      {evidencia.comentario && <p className={estilos.comentario}>“{evidencia.comentario}”</p>}

      <div className={estilos.placar}>
        <span>
          <strong className={estilos.vale}>{evidencia.votosFavoraveis} vale</strong>
          {' · '}
          <span className={estilos.naoVale}>{evidencia.votosContra} não vale</span>
        </span>
        <span>fecha com {evidencia.quorum}</span>
      </div>
      <div className={estilos.barraVotos} aria-hidden="true">
        <span
          className={estilos.barraVale}
          style={{ width: `${Math.min(100, (evidencia.votosFavoraveis / evidencia.quorum) * 100)}%` }}
        />
        <span
          className={estilos.barraNaoVale}
          style={{ width: `${Math.min(100, (evidencia.votosContra / evidencia.quorum) * 100)}%` }}
        />
      </div>

      <ul className={estilos.juri} aria-label="Júri">
        {evidencia.jurados.map((jurado) => (
          <li key={jurado.idUsuario} className={estilos.jurado} title={jurado.votou ? 'já votou' : 'ainda não votou'}>
            <span className={estilos.juradoAvatar}>
              <Avatar apelido={jurado.apelido} url={jurado.avatarUrl} />
              <span className={jurado.votou ? estilos.votou : estilos.falta}>
                {jurado.votou ? '✓' : '…'}
              </span>
            </span>
            {jurado.apelido}
          </li>
        ))}
      </ul>

      {emVotacao ? (
        <p className={estilos.dicaVoto}>
          {evidencia.quorum - lider === 1 ? 'Falta 1 voto' : `Faltam ${evidencia.quorum - lider} votos`} ·
          júri até {formatarDataHora(evidencia.dataLimiteVotacao)} ({descreverPrazo(evidencia.dataLimiteVotacao).texto}).
          Quem votar ganha +2 CP quando o júri fechar.
        </p>
      ) : (
        <p className={estilos.rodapeProva}>Enviada em {formatarDataHora(evidencia.dataEnvio)}</p>
      )}
    </article>
  )
}
