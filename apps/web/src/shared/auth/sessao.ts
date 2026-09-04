import type { Usuario } from '../api/tipos'

const CHAVE_TOKEN = 'euduvido.token'
const CHAVE_USUARIO = 'euduvido.usuario'

type Ouvinte = () => void
const ouvintes = new Set<Ouvinte>()

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function lerUsuario(): Usuario | null {
  const bruto = localStorage.getItem(CHAVE_USUARIO)
  if (!bruto) return null

  try {
    return JSON.parse(bruto) as Usuario
  } catch {
    localStorage.removeItem(CHAVE_USUARIO)
    return null
  }
}

export function gravarSessao(token: string, usuario: Usuario) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

/** O cliente HTTP descarta a sessão ao receber 401; o contexto de auth reage por aqui. */
export function aoExpirarSessao(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function notificarExpiracao() {
  ouvintes.forEach((ouvinte) => ouvinte())
}
