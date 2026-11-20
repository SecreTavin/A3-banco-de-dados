// Sessao para os roteiros de tela. O login e so pelo Google (ADR 0021), e o
// popup do Google nao se automatiza: o roteiro assina o JWT com a chave do
// ambiente de teste (AUTH_CHAVE, ou o padrao de desenvolvimento), com o mesmo
// emissor, audiencia e claims que a API usa, e grava a sessao no localStorage
// como a tela de login faria.
import { createHmac } from 'node:crypto'

const CHAVE = process.env.AUTH_CHAVE || 'chave-de-desenvolvimento-nao-usar-em-producao-min-32-chars'
const CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/'

const b64 = (dados) => Buffer.from(dados).toString('base64url')

export function assinar(audiencia, claims, minutos = 60) {
  const cabeca = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const carga = b64(
    JSON.stringify({ ...claims, iss: 'euduvido', aud: audiencia, exp: Math.floor(Date.now() / 1000) + minutos * 60 }),
  )
  const assinatura = createHmac('sha256', CHAVE).update(`${cabeca}.${carga}`).digest('base64url')
  return `${cabeca}.${carga}.${assinatura}`
}

/** `linha` = "id|nome|email|apelido|avatar" de um usuario do banco. */
export function sessaoDe(linha) {
  const [id, nome, email, apelido, avatar] = linha.split('|')
  const token = assinar('euduvido', {
    [`${CLAIM}nameidentifier`]: id,
    [`${CLAIM}name`]: apelido,
    [`${CLAIM}emailaddress`]: email,
  })
  const usuario = { idUsuario: Number(id), nome, apelido, email, avatarUrl: avatar || null }
  return { token, usuario }
}

/** Consulta SQL que devolve a `linha` esperada por `sessaoDe`. */
export const consultaUsuario = (apelidoEscapado) =>
  `SELECT id_usuario || '|' || nome || '|' || email || '|' || apelido || '|' || coalesce(avatar_url, '')
     FROM usuario WHERE apelido = '${apelidoEscapado}' ORDER BY id_usuario LIMIT 1`

/** Grava a sessao no localStorage da pagina (precisa estar na origem do app). */
export async function gravarSessao(pagina, { token, usuario }) {
  await pagina.evaluate(
    ([t, u]) => {
      localStorage.setItem('euduvido.token', t)
      localStorage.setItem('euduvido.usuario', JSON.stringify(u))
    },
    [token, usuario],
  )
}
