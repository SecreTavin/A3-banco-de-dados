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

/**
 * Resposta do login com Google. Quem já tem conta recebe `token` e `usuario`;
 * quem entra pela primeira vez recebe `cadastroPendente` e o `tokenCadastro`
 * para completar o cadastro.
 */
export interface RespostaEntrada {
  token: string | null
  usuario: Usuario | null
  cadastroPendente: boolean
  tokenCadastro: string | null
  nome: string | null
  email: string | null
  avatarUrl: string | null
}

export interface ConfiguracaoAuth {
  googleClientId: string | null
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
  /** Desafios ABERTA/EM_ANDAMENTO/EM_VOTACAO deste grupo em que o membro participa. */
  desafiosEmCurso: number
  /** Integra o júri de alguma evidência em votação neste grupo. */
  noJuri: boolean
}

export interface GrupoDetalhe {
  idGrupo: number
  nome: string
  descricao: string | null
  nivelFiltro: NivelFiltro
  meuPapel: PapelGrupo
  desafiosAtivos: number
  cpEmJogo: number
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

/** Item da lista: o resumo mais a minha posição e o placar da prova no júri, se houver. */
export interface DesafioListado extends DesafioResumo {
  meuPapel: PapelDesafio | null
  minhaEscolha: Escolha | null
  totalParticipantes: number
  votosFavoraveis: number | null
  votosContra: number | null
  quorum: number | null
  dataLimiteVotacao: string | null
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
  jurados: Jurado[]
}

/**
 * Quem está no júri, se já votou, o voto e a justificativa (RF07). RN29: para o jurado que
 * ainda não votou, voto, justificativa e data dos outros chegam nulos enquanto a prova está
 * em votação.
 */
export interface Jurado {
  /** O apelido pode repetir; quem identifica o jurado é o id. */
  idUsuario: number
  apelido: string
  avatarUrl: string | null
  votou: boolean
  voto: TipoVoto | null
  justificativa: string | null
  dataVoto: string | null
}

export interface DesafioDetalhe extends DesafioResumo {
  criador: string
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
  descricaoDesafio: string | null
  desafiado: string
}

/** Prova do próprio usuário no júri: o desafiado acompanha o placar e os comentários (#83). */
export interface MinhaProvaNoJuri {
  idEvidencia: number
  idDesafio: number
  desafio: string
  idGrupo: number
  grupo: string
  ordem: number
  comentario: string | null
  dataLimiteVotacao: string
  totalValidadores: number
  quorum: number
  votosFavoraveis: number
  votosContra: number
  votosFaltantes: number
  jurados: Jurado[]
}

export interface PosicaoRanking {
  /** O apelido pode repetir; quem identifica o membro é o id. */
  idUsuario: number
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
  grupo: string
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

/** Nome, e-mail e foto vêm do Google, dentro do `tokenCadastro`. */
export interface NovoCadastro {
  tokenCadastro: string
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
