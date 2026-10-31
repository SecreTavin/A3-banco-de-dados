import { Link } from 'react-router-dom'
import { SaldoCp } from '../../../shared/ui'
import type { DesafioListado, EvidenciaPendente, GrupoResumo } from '../../../shared/api/tipos'
import { formatarDia } from '../apresentacao'
import estilos from '../inicio.module.css'

interface Props {
  desafios: DesafioListado[]
  pendentes: EvidenciaPendente[]
  grupos: GrupoResumo[]
}

interface Acao {
  chave: string
  tom: 'votacao' | 'andamento' | 'aberta'
  rotulo: string
  titulo: string
  destino: string
  chamada?: string
  progresso?: { feitos: number; total: number; legenda: string }
  valor?: number
}

const MAXIMO_ACOES = 3

/** O que está esperando por mim, na ordem em que trava os outros. */
function montarAcoes(desafios: DesafioListado[], pendentes: EvidenciaPendente[]): Acao[] {
  const votar: Acao[] = pendentes
    .filter((evidencia) => !evidencia.jaVotei)
    .map((evidencia) => ({
      chave: `voto-${evidencia.idEvidencia}`,
      tom: 'votacao',
      rotulo: `Vote na prova de ${evidencia.desafiado}`,
      titulo: evidencia.desafio,
      destino: '/votacao',
      chamada: 'Votar',
      progresso: {
        feitos: Math.max(evidencia.votosFavoraveis, evidencia.votosContra),
        total: evidencia.quorum,
        legenda:
          evidencia.votosFaltantes === 1
            ? 'seu voto pode fechar o júri'
            : `faltam ${evidencia.votosFaltantes} votos`,
      },
    }))

  const enviarProva: Acao[] = desafios
    .filter((d) => d.status === 'EM_ANDAMENTO' && d.meuPapel === 'DESAFIADO')
    .map((d) => ({
      chave: `prova-${d.idDesafio}`,
      tom: 'andamento',
      rotulo: 'Envie sua prova',
      titulo: d.titulo,
      destino: `/desafios/${d.idDesafio}`,
      chamada: 'Enviar',
    }))

  const minhaProva: Acao[] = desafios
    .filter((d) => d.status === 'EM_VOTACAO' && d.meuPapel === 'DESAFIADO' && d.quorum)
    .map((d) => ({
      chave: `juri-${d.idDesafio}`,
      tom: 'votacao',
      rotulo: 'Sua prova está no júri',
      titulo: d.titulo,
      destino: `/desafios/${d.idDesafio}`,
      progresso: {
        feitos: Math.max(d.votosFavoraveis ?? 0, d.votosContra ?? 0),
        total: d.quorum ?? 1,
        legenda: `${d.votosFavoraveis ?? 0} de ${d.quorum} votos para fechar${
          d.dataLimiteVotacao ? ` · até ${formatarDia(d.dataLimiteVotacao)}` : ''
        }`,
      },
    }))

  const entrar: Acao[] = desafios
    .filter((d) => d.status === 'ABERTA' && !d.meuPapel)
    .map((d) => ({
      chave: `entrar-${d.idDesafio}`,
      tom: 'aberta',
      rotulo: `Aberto em ${d.grupo}`,
      titulo: d.titulo,
      destino: `/desafios/${d.idDesafio}`,
      chamada: 'Entrar',
      valor: d.valorCp,
    }))

  return [...votar, ...enviarProva, ...minhaProva, ...entrar].slice(0, MAXIMO_ACOES)
}

export function SuaVez({ desafios, pendentes, grupos }: Props) {
  const acoes = montarAcoes(desafios, pendentes)

  return (
    <section className={estilos.vez} aria-label="Sua vez">
      {acoes.length === 0 && (
        <div className={[estilos.acao, estilos.acaoNeutra].join(' ')}>
          <span className={estilos.acaoRotulo}>Tudo em dia</span>
          <span className={estilos.acaoTitulo}>Nenhuma prova esperando você.</span>
          <Link to="/desafios/nova" className={estilos.acaoLink}>
            Duvidar de alguém →
          </Link>
        </div>
      )}

      {acoes.map((acao) => (
        <Link key={acao.chave} to={acao.destino} className={[estilos.acao, estilos[acao.tom]].join(' ')}>
          <span className={estilos.acaoRotulo}>{acao.rotulo}</span>
          <span className={estilos.acaoTitulo}>{acao.titulo}</span>
          {acao.progresso && (
            <span className={estilos.barra}>
              <span
                style={{ width: `${Math.min(100, (acao.progresso.feitos / acao.progresso.total) * 100)}%` }}
              />
            </span>
          )}
          <span className={estilos.acaoRodape}>
            {acao.progresso && <span>{acao.progresso.legenda}</span>}
            {acao.valor !== undefined && <SaldoCp valor={acao.valor} />}
            {acao.chamada && <span className={estilos.acaoChamada}>{acao.chamada}</span>}
          </span>
        </Link>
      ))}

      {grupos.length > 0 && (
        <div className={estilos.carteira}>
          <span className={estilos.acaoRotulo}>Seu saldo</span>
          {grupos.map((grupo) => (
            <Link key={grupo.idGrupo} to={`/grupos/${grupo.idGrupo}`} className={estilos.carteiraLinha}>
              <span>{grupo.nome}</span>
              <SaldoCp valor={grupo.saldoCp} />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
