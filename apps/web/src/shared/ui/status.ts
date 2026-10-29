import type {
  Escolha,
  NivelFiltro,
  PapelDesafio,
  PapelGrupo,
  StatusDesafio,
  StatusEvidencia,
  TipoMidia,
  TipoRecompensa,
} from '../api/tipos'

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

export const rotuloNivelFiltro: Record<NivelFiltro, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  PESADO: 'Pesado',
}

/** O que a moderação de IA barra em cada nível ao criar um desafio. */
export const descricaoNivelFiltro: Record<NivelFiltro, string> = {
  LEVE: 'Só barra o absurdo, como desafios que envolvem se machucar.',
  MODERADO: 'Meio-termo: barra o que é perigoso ou ofensivo, sem ser rígido.',
  PESADO: 'Rigoroso, para grupos com adolescentes: barra qualquer coisa que arrisque a imagem ou a reputação de alguém.',
}

export const NIVEIS_FILTRO: NivelFiltro[] = ['LEVE', 'MODERADO', 'PESADO']

export const ORDEM_STATUS: StatusDesafio[] = [
  'ABERTA',
  'EM_ANDAMENTO',
  'EM_VOTACAO',
  'FINALIZADA_CUMPRIU',
  'FINALIZADA_PERDEU',
  'CANCELADA',
]

/** O que foi combinado fora do app, em texto livre (RN02). Sem descrição, cai no tipo. */
export function descreverRecompensa(tipo: TipoRecompensa, descricao: string | null): string {
  return descricao?.trim() || rotuloRecompensa[tipo]
}

/** Exemplo do que escrever na descrição da recompensa, por tipo. */
export const exemploRecompensa: Record<TipoRecompensa, string> = {
  MONETARIA: 'R$ 20 no Pix',
  PRENDA_ACAO: 'Paga o rodízio de domingo',
  ITEM_MATERIAL: 'Uma caixa de bombom',
  OUTRO: 'Escolhe o filme da próxima sessão',
}
