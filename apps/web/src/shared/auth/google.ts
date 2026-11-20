/**
 * Botão "Entrar com Google" (Google Identity Services). O script do Google só é
 * carregado na tela de login; o ID token que ele devolve vai para a API, que o
 * valida no servidor — o front nunca decide quem é o usuário (ADR 0021).
 */

interface RespostaCredencial {
  credential: string
}

interface GoogleId {
  initialize(opcoes: {
    client_id: string
    callback: (resposta: RespostaCredencial) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    ux_mode?: 'popup' | 'redirect'
  }): void
  renderButton(
    elemento: HTMLElement,
    opcoes: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill'
      locale?: string
      width?: number
    },
  ): void
  disableAutoSelect(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client'
let carregando: Promise<GoogleId> | null = null

function carregarGoogle(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  carregando ??= new Promise<GoogleId>((resolver, rejeitar) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.defer = true
    script.onload = () =>
      window.google?.accounts?.id
        ? resolver(window.google.accounts.id)
        : rejeitar(new Error('O Google não respondeu.'))
    script.onerror = () => {
      carregando = null
      rejeitar(new Error('Não foi possível carregar o login do Google. Verifique a internet.'))
    }
    document.head.appendChild(script)
  })
  return carregando
}

/** Desenha o botão oficial dentro de `elemento` e chama `aoEntrar` com o ID token. */
export async function desenharBotaoGoogle(
  elemento: HTMLElement,
  clientId: string,
  aoEntrar: (credencial: string) => void,
) {
  const google = await carregarGoogle()
  google.initialize({
    client_id: clientId,
    callback: (resposta) => aoEntrar(resposta.credential),
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: 'popup',
  })
  google.renderButton(elemento, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    locale: 'pt-BR',
    width: Math.min(elemento.clientWidth || 320, 400),
  })
}

/** Ao sair, o Google não entra de novo sozinho com a mesma conta. */
export function esquecerContaGoogle() {
  window.google?.accounts?.id?.disableAutoSelect()
}
