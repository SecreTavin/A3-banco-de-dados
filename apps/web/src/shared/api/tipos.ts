export type StatusDesafio =
  | 'ABERTA'
  | 'EM_ANDAMENTO'
  | 'EM_VOTACAO'
  | 'FINALIZADA_CUMPRIU'
  | 'FINALIZADA_PERDEU'
  | 'CANCELADA'

export type TipoRecompensa = 'MONETARIA' | 'PRENDA_ACAO' | 'ITEM_MATERIAL' | 'OUTRO'
export type PapelDesafio = 'DESAFIANTE' | 'DESAFIADO' | 'APOSTADOR'
export type Escolha = 'VAI_CUMPRIR' | 'NAO_VAI_CUMPRIR'
export type TipoMidia = 'FOTO' | 'VIDEO' | 'LINK' | 'TEXTO'
export type StatusEvidencia = 'EM_VOTACAO' | 'ACEITA' | 'RECUSADA' | 'EXPIRADA'
export type TipoVoto = 'VALIDO' | 'INVALIDO'
export type PapelGrupo = 'ADMIN' | 'MEMBRO'
export type NivelFiltro = 'LEVE' | 'MODERADO' | 'PESADO'

export interface Usuario {
  idUsuario: number
  nome: string
  apelido: string
  email: string
  avatarUrl: string | null
}

export interface RespostaLogin {
  token: string
  usuario: Usuario
}

export interface GrupoResumo {
  idGrupo: number
  nome: string
  descricao: string | null
  totalMembros: number
  saldoCp: number
  papel: PapelGrupo
  nivelFiltro: NivelFiltro
}

export interface MembroGrupo {
  idUsuario: number
  apelido: string
  papel: PapelGrupo
  saldoCp: number
  avatarUrl: string | null
}

export interface GrupoDetalhe {
  idGrupo: number
  nome: string
  descricao: string | null
  nivelFiltro: NivelFiltro
  meuPapel: PapelGrupo
  membros: MembroGrupo[]
}

export interface GrupoCriado {
  idGrupo: number
  nome: string
  descricao: string | null
  nivelFiltro: NivelFiltro
}

export interface NivelFiltroAlterado {
  idGrupo: number
  nivelFiltro: NivelFiltro
}

export interface MembroAdicionado {
  idUsuario: number
  apelido: string
}

export interface DesafioResumo {
  idDesafio: number
  idGrupo: number
  titulo: string
  status: StatusDesafio
  valorCp: number
  tipoRecompensa: TipoRecompensa
  descricaoRecompensa: string | null
  dataLimite: string
  categoria: string
  grupo: string
  souCriador: boolean
}

export interface ParticipanteDesafio {
  idUsuario: number
  apelido: string
  avatarUrl: string | null
  papelDesafio: PapelDesafio
  escolha: Escolha | null
}

export interface Evidencia {
  idEvidencia: number
  ordem: number
  tipoMidia: TipoMidia
  urlComprovante: string
  comentario: string | null
  status: StatusEvidencia
  dataEnvio: string
  dataLimiteVotacao: string
  votosFavoraveis: number
  votosContra: number
  quorum: number
  totalValidadores: number
}

export interface DesafioDetalhe extends DesafioResumo {
  descricao: string | null
  dataEncerramento: string | null
  motivoCancelamento: string | null
  participantes: ParticipanteDesafio[]
  evidencias: Evidencia[]
}

export interface Categoria {
  idCategoria: number
  nome: string
  descricao: string | null
}

export interface EvidenciaPendente {
  idEvidencia: number
  idDesafio: number
  idGrupo: number
  desafio: string
  tipoMidia: TipoMidia
  urlComprovante: string
  comentario: string | null
  dataLimiteVotacao: string
  totalValidadores: number
  quorum: number
  totalVotos: number
  votosFavoraveis: number
  votosContra: number
  votosFaltantes: number
  jaVotei: boolean
}

export interface PosicaoRanking {
  apelido: string
  avatarUrl: string | null
  saldoCp: number
  desafiosParticipadas: number
  acertos: number
  erros: number
  cpGanhoEmPremios: number
}

export interface SaldoPorGrupo {
  idGrupo: number
  grupo: string
  saldoCp: number
}

export interface LancamentoCp {
  data: string
  tipo: string
  valor: number
  descricao: string
  desafio: string | null
  saldoApos: number
}

export interface HistoricoPerfil {
  desafiosCriadas: number
  participacoes: number
  evidenciasEnviadas: number
}

export interface Perfil {
  usuario: Usuario & { dataCadastro: string }
  saldos: SaldoPorGrupo[]
  extrato: LancamentoCp[]
  historico: HistoricoPerfil
}

export interface NovoGrupo {
  nome: string
  descricao: string
  nivelFiltro: NivelFiltro
}

export interface NovoMembro {
  email: string
}

export interface NovoCadastro {
  nome: string
  email: string
  apelido: string
  /** `YYYY-MM-DD`, direto do `<input type="date">`. */
  dataNascimento: string
}

export interface NovaDesafio {
  idGrupo: number
  idCategoria: number
  titulo: string
  descricao: string
  valorCp: number
  tipoRecompensa: TipoRecompensa
  descricaoRecompensa: string | null
  dataLimite: string
}

export interface NovaParticipacao {
  papelDesafio: PapelDesafio
  escolha: Escolha
}

export interface NovaEvidencia {
  tipoMidia: TipoMidia
  urlComprovante: string
  comentario: string
}

export interface NovoVoto {
  voto: TipoVoto
  justificativa: string
}
