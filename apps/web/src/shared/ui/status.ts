import type {
  Escolha,
  PapelDesafio,
  PapelGrupo,
  StatusDesafio,
  StatusEvidencia,
  TipoMidia,
  TipoRecompensa,
} from '../api/tipos'
import { formatarMoeda } from './formato'

interface Aparencia {
  rotulo: string
  cor: string
}

export const aparenciaStatusDesafio: Record<StatusDesafio, Aparencia> = {
  ABERTA: { rotulo: 'Aberta', cor: 'var(--aberta)' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: 'var(--em-andamento)' },
  EM_VOTACAO: { rotulo: 'Em votação', cor: 'var(--em-votacao)' },
  FINALIZADA_CUMPRIU: { rotulo: 'Cumpriu', cor: 'var(--cumpriu)' },
  FINALIZADA_PERDEU: { rotulo: 'Perdeu', cor: 'var(--perdeu)' },
  CANCELADA: { rotulo: 'Cancelada', cor: 'var(--cancelada)' },
}

export const aparenciaStatusEvidencia: Record<StatusEvidencia, Aparencia> = {
  EM_VOTACAO: { rotulo: 'Em votação', cor: 'var(--em-votacao)' },
  ACEITA: { rotulo: 'Aceita', cor: 'var(--cumpriu)' },
  RECUSADA: { rotulo: 'Recusada', cor: 'var(--perdeu)' },
  EXPIRADA: { rotulo: 'Expirada', cor: 'var(--cancelada)' },
}

export const rotuloRecompensa: Record<TipoRecompensa, string> = {
  MONETARIA: 'Monetária',
  PRENDA_ACAO: 'Prenda ou ação',
  ITEM_MATERIAL: 'Item material',
  OUTRO: 'Outro',
}

export const rotuloPapelDesafio: Record<PapelDesafio, string> = {
  DESAFIANTE: 'Desafiante',
  DESAFIADO: 'Desafiado',
  APOSTADOR: 'Apostador',
}

export const rotuloEscolha: Record<Escolha, string> = {
  VAI_CUMPRIR: 'Vai cumprir',
  NAO_VAI_CUMPRIR: 'Não vai cumprir',
}

export const rotuloMidia: Record<TipoMidia, string> = {
  FOTO: 'Foto',
  VIDEO: 'Vídeo',
  LINK: 'Link',
  TEXTO: 'Texto',
}

export const rotuloPapelGrupo: Record<PapelGrupo, string> = {
  ADMIN: 'Admin',
  MEMBRO: 'Membro',
}

export const ORDEM_STATUS: StatusDesafio[] = [
  'ABERTA',
  'EM_ANDAMENTO',
  'EM_VOTACAO',
  'FINALIZADA_CUMPRIU',
  'FINALIZADA_PERDEU',
  'CANCELADA',
]

/** O que foi combinado fora do app: valor em dinheiro ou a prenda descrita (RN02). */
export function descreverRecompensa(
  tipo: TipoRecompensa,
  valorMonetario: number | null,
  descricaoPrenda: string | null,
): string {
  if (tipo === 'MONETARIA' && valorMonetario !== null) return formatarMoeda(valorMonetario)
  return descricaoPrenda?.trim() || rotuloRecompensa[tipo]
}
