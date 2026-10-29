export type Tema = 'claro' | 'escuro'

const CHAVE = 'tema'

export function temaAtual(): Tema {
  return document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro'
}

export function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-tema', tema)
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento (janela privada): o tema vale so ate recarregar.
  }
}
