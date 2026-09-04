import { lerToken, limparSessao, notificarExpiracao } from '../auth/sessao'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ApiError'
  }
}

interface CorpoDeErro {
  detail?: string
  title?: string
  erro?: string
  mensagem?: string
  errors?: Record<string, string[]>
}

function extrairMensagem(corpo: CorpoDeErro | null, status: number): string {
  const doValidador = corpo?.errors && Object.values(corpo.errors).flat()[0]
  return (
    doValidador ??
    corpo?.detail ??
    corpo?.mensagem ??
    corpo?.erro ??
    corpo?.title ??
    `Falha na requisição (HTTP ${status}).`
  )
}

async function requisitar<T>(rota: string, init?: RequestInit): Promise<T> {
  const token = lerToken()

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (resposta.status === 401) {
    limparSessao()
    notificarExpiracao()
    throw new ApiError(401, 'Sessão expirada. Entre novamente.')
  }

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as CorpoDeErro | null
    throw new ApiError(resposta.status, extrairMensagem(corpo, resposta.status))
  }

  if (resposta.status === 204) return undefined as T

  const texto = await resposta.text()
  return texto ? (JSON.parse(texto) as T) : (undefined as T)
}

export const api = {
  get: <T>(rota: string) => requisitar<T>(rota),
  post: <T>(rota: string, corpo?: unknown) =>
    requisitar<T>(rota, { method: 'POST', body: JSON.stringify(corpo ?? {}) }),
}

export function mensagemDeErro(falha: unknown): string {
  if (falha instanceof ApiError) return falha.message
  // fetch rejeita com TypeError quando não chega a falar com o servidor.
  if (falha instanceof TypeError) return 'Não foi possível falar com o servidor.'
  return falha instanceof Error ? falha.message : 'Erro inesperado.'
}
