export type Escala = 'normal' | 'maior'

const CHAVE = 'escala'

export function escalaAtual(): Escala {
  return document.documentElement.getAttribute('data-escala') === 'maior' ? 'maior' : 'normal'
}

export function aplicarEscala(escala: Escala) {
  if (escala === 'maior') document.documentElement.setAttribute('data-escala', 'maior')
  else document.documentElement.removeAttribute('data-escala')
  try {
    localStorage.setItem(CHAVE, escala)
  } catch {
    // Sem armazenamento (janela privada): a escala vale so ate recarregar.
  }
}
