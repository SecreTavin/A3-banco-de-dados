import type {
  DesafioListado,
  Escolha,
  ParticipanteDesafio,
  StatusDesafio,
} from '../../shared/api/tipos'
import type { EtapaTrilha } from '../../shared/ui'
import { descreverPrazo, formatarDataHora } from '../../shared/ui/formato'
import { aparenciaStatusDesafio } from '../../shared/ui/status'

export const ENCERRADOS: StatusDesafio[] = ['FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA']

export const ATIVOS: StatusDesafio[] = ['ABERTA', 'EM_ANDAMENTO', 'EM_VOTACAO']

const INDICE_ETAPA: Record<StatusDesafio, number> = {
  ABERTA: 0,
  EM_ANDAMENTO: 1,
  EM_VOTACAO: 2,
  FINALIZADA_CUMPRIU: 3,
  FINALIZADA_PERDEU: 3,
  CANCELADA: 3,
}

/** As quatro etapas do ciclo de vida (RN03); a última leva o nome do desfecho. */
export function etapasDoDesafio(status: StatusDesafio): {
  etapas: EtapaTrilha[]
  atual: number
  cor: string
} {
  const desfecho = ENCERRADOS.includes(status) ? aparenciaStatusDesafio[status].rotulo : 'Resultado'
  return {
    etapas: [
      { rotulo: 'Aberto' },
      { rotulo: 'Em andamento' },
      { rotulo: 'No júri' },
      { rotulo: desfecho },
    ],
    atual: INDICE_ETAPA[status],
    cor: aparenciaStatusDesafio[status].cor,
  }
}

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

export function formatarDia(iso: string) {
  return dataCurta.format(new Date(iso))
}

/** Uma frase sobre o que acontece agora com o desafio, do ponto de vista de quem vê. */
export function proximoPasso(desafio: DesafioListado): string {
  switch (desafio.status) {
    case 'ABERTA':
      return desafio.totalParticipantes === 0
        ? 'Ninguém entrou ainda'
        : `${desafio.totalParticipantes} ${desafio.totalParticipantes === 1 ? 'pessoa entrou' : 'pessoas entraram'}`
    case 'EM_ANDAMENTO':
      return desafio.meuPapel === 'DESAFIADO'
        ? 'Você precisa enviar a prova'
        : 'Esperando a prova do desafiado'
    case 'EM_VOTACAO':
      return desafio.dataLimiteVotacao
        ? `Júri decide até ${formatarDia(desafio.dataLimiteVotacao)}`
        : 'Júri decidindo'
    case 'CANCELADA':
      return 'Cancelado, CP devolvido'
    default:
      return acertou(desafio.status, desafio.minhaEscolha) === null
        ? 'Encerrado'
        : acertou(desafio.status, desafio.minhaEscolha)
          ? 'Você acertou'
          : 'Você errou'
  }
}

/** O prazo que importa agora: o do júri quando está em votação, senão o do desafio. */
export function prazoRelevante(desafio: DesafioListado): string {
  if (desafio.status === 'EM_VOTACAO' && desafio.dataLimiteVotacao) {
    return `júri até ${formatarDataHora(desafio.dataLimiteVotacao)}`
  }
  if (ENCERRADOS.includes(desafio.status)) return `prazo era ${formatarDia(desafio.dataLimite)}`
  const prazo = descreverPrazo(desafio.dataLimite)
  return prazo.vencido ? `prazo foi ${formatarDia(desafio.dataLimite)}` : prazo.texto
}

/** Quem apostou certo num desafio encerrado; `null` se não apostou ou não encerrou. */
export function acertou(status: StatusDesafio, escolha: Escolha | null): boolean | null {
  if (!escolha) return null
  if (status === 'FINALIZADA_CUMPRIU') return escolha === 'VAI_CUMPRIR'
  if (status === 'FINALIZADA_PERDEU') return escolha === 'NAO_VAI_CUMPRIR'
  return null
}

export function descreverPapel(desafio: DesafioListado): string {
  if (!desafio.meuPapel) return 'Você está de fora'
  const papel = {
    DESAFIANTE: 'o desafiante',
    DESAFIADO: 'o desafiado',
    APOSTADOR: 'apostador',
  }[desafio.meuPapel]
  const lado = desafio.minhaEscolha === 'NAO_VAI_CUMPRIR' ? 'não vai cumprir' : 'vai cumprir'
  return `Você é ${papel} · disse que ${lado}`
}

export interface Ganho {
  participante: ParticipanteDesafio
  valor: number
}

/**
 * Divisão do pote se um lado ganhar (RN23): partes iguais entre quem acertou e o resto da
 * divisão para o primeiro vencedor. Só para mostrar — quem liquida é `encerrar_desafio`.
 */
export function dividirPote(
  participantes: ParticipanteDesafio[],
  valorCp: number,
  vencedor: Escolha,
): Ganho[] {
  const pote = valorCp * participantes.length
  const vencedores = participantes.filter((p) => p.escolha === vencedor)
  if (vencedores.length === 0) return []

  const parte = Math.floor(pote / vencedores.length)
  const resto = pote - parte * vencedores.length
  return vencedores.map((participante, indice) => ({
    participante,
    valor: parte + (indice === 0 ? resto : 0),
  }))
}
