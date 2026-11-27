// Roteiro completo de ponta a ponta DE TELA e de tempo real (docs/05-qualidade/roteiro-e2e.md).
//
// Cada cenario leva o ID do roteiro completo (F02, F11, H01...). Os cenarios que o
// roteiro-e2e-ui.mjs ja cobre (U01 a U21) nao se repetem aqui.
//
// Cada cenario monta o proprio mundo por SQL (usuarios, grupo, desafio) e age
// pela tela, no Chrome de verdade, conferindo o efeito no PostgreSQL. A secao de
// tempo real (H01 a H04) fala direto com o hub /hubs/votacao por WebSocket, no
// protocolo JSON do SignalR, sem navegador.
//
//     npm i --no-save playwright-core
//     EUDUVIDO_DB=euduvido-e2e-db-1 node scripts/testes/roteiro-e2e-ui-completo.mjs
//     HEADED=0 ...                         # sem janela
//     CHROME_PATH=...                      # no Windows: C:/Program Files/Google/Chrome/Application/chrome.exe
//
// ESCREVE no banco; roda em qualquer banco semeado. F05 e F06 recriam o conteiner da
// API com um Client ID e o validador do Google simulado (ADR 0024) e, ao terminar,
// voltam a API ao padrao: rode numa pilha propria (COMPOSE_PROJECT_NAME=euduvido-e2e).
import { execFileSync } from 'node:child_process'
import { createHmac } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { assinar, gravarSessao, sessaoDe } from './sessao.mjs'

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080'
const API = process.env.EUDUVIDO_API ?? 'http://localhost:5080'
const CONTAINER_DB = process.env.EUDUVIDO_DB ?? 'euduvido-db-1'
const HEADED = process.env.HEADED !== '0'
const SHOTS = process.env.EUDUVIDO_SHOTS ?? path.join(os.tmpdir(), 'euduvido-e2e-ui-completo')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/'
const RODADA = Date.now()
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const GOOGLE_CLIENT_ID_TESTE = 'e2e.apps.googleusercontent.com'
const GOOGLE_SIMULADO_CHAVE = process.env.GOOGLE_SIMULADO_CHAVE || 'chave-do-google-simulado-so-para-testes-e2e'

const resultados = []
let seq = 0
let navegador, contexto, pagina

// --- infraestrutura -----------------------------------------------------------

function sql(consulta) {
  return execFileSync('docker', ['exec', CONTAINER_DB, 'psql', '-U', 'euduvido', '-d', 'euduvido', '-tAq', '-c', consulta], {
    encoding: 'utf8',
  }).trim()
}
const num = (consulta) => Number(sql(consulta) || 0)

function confere(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem)
}

async function cenario(id, descricao, fn) {
  let status = 'Aprovado'
  let detalhe = ''
  try {
    detalhe = (await fn()) ?? ''
  } catch (erro) {
    status = 'REPROVADO'
    detalhe = String(erro.message).split('\n')[0].slice(0, 260)
    try {
      fs.mkdirSync(SHOTS, { recursive: true })
      await pagina?.screenshot({ path: path.join(SHOTS, `${id}.png`) })
    } catch {
      /* sem pagina */
    }
  }
  resultados.push([id, descricao, status, detalhe])
  console.log([id, descricao, status, detalhe].join(' | '))
}

function naoCoberto(id, descricao, motivo) {
  resultados.push([id, descricao, 'NAO COBERTO', motivo])
  console.log([id, descricao, 'NAO COBERTO', motivo].join(' | '))
}

function claims(id) {
  const [email, apelido] = sql(`SELECT email || '|' || apelido FROM usuario WHERE id_usuario = ${id}`).split('|')
  return { [`${CLAIM}nameidentifier`]: String(id), [`${CLAIM}name`]: apelido, [`${CLAIM}emailaddress`]: email }
}
const tok = (id, minutos = 60) => assinar('euduvido', claims(id), minutos)

async function chamar(metodo, rota, corpo, id) {
  const resposta = await fetch(API + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(id ? { Authorization: `Bearer ${tok(id)}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const texto = await resposta.text()
  let dados = null
  try {
    dados = texto ? JSON.parse(texto) : null
  } catch {
    dados = texto
  }
  return { status: resposta.status, dados }
}

/** ID token no formato do Google, para o validador simulado da API (ADR 0024). */
function tokenGoogle(email, nome, verificado = true) {
  const b64 = (x) => Buffer.from(x).toString('base64url')
  const cabeca = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const carga = b64(JSON.stringify({ iss: 'euduvido-google-simulado', aud: GOOGLE_CLIENT_ID_TESTE, email, email_verified: verificado,
    name: nome, picture: null, exp: Math.floor(Date.now() / 1000) + 600 }))
  return `${cabeca}.${carga}.${createHmac('sha256', GOOGLE_SIMULADO_CHAVE).update(`${cabeca}.${carga}`).digest('base64url')}`
}

async function recriarApi(envExtra = {}) {
  execFileSync('docker', ['compose', 'up', '-d', '--no-deps', '--force-recreate', 'api'], {
    cwd: RAIZ, env: { ...process.env, ...envExtra }, stdio: 'ignore',
  })
  const fim = Date.now() + 120000
  while (Date.now() < fim) {
    try {
      if ((await fetch(`${API}/health`)).ok) return
    } catch {
      /* subindo */
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('a API nao voltou saudavel depois de recriada')
}

// O script do Google (accounts.google.com/gsi/client) da lugar a um botao que devolve o
// token guardado em localStorage['e2e.googleToken'] - o resto do login e o codigo real.
const GOOGLE_FALSO = () => {
  window.google = { accounts: { id: {
    initialize(opcoes) { window.__googleFalso = opcoes },
    renderButton(elemento) {
      const botao = document.createElement('button')
      botao.type = 'button'
      botao.textContent = 'Entrar com Google (simulado)'
      botao.onclick = () => window.__googleFalso.callback({ credential: localStorage.getItem('e2e.googleToken') })
      elemento.appendChild(botao)
    },
    disableAutoSelect() {},
  } } }
}

// --- mundo de cada cenario ----------------------------------------------------

function novoUsuario(apelido) {
  seq += 1
  return num(
    `INSERT INTO usuario (nome, email, apelido, data_nascimento) VALUES ('${apelido} E2E', '${apelido.toLowerCase()}.${RODADA}.${seq}@e2e.local', '${apelido}', '2000-01-01') RETURNING id_usuario`,
  )
}

function novoGrupo(apelidos) {
  const ids = Object.fromEntries(apelidos.map((a) => [a, novoUsuario(a)]))
  const admin = ids[apelidos[0]]
  seq += 1
  const nome = `Grupo tela ${RODADA}-${seq}`
  const g = num(
    `INSERT INTO grupo_amigos (nome, descricao, id_criador, nivel_filtro) VALUES ('${nome}', 'roteiro-e2e-ui-completo', ${admin}, 'MODERADO') RETURNING id_grupo`,
  )
  const valores = Object.values(ids)
    .map((i) => `(${g}, ${i}, '${i === admin ? 'ADMIN' : 'MEMBRO'}')`)
    .join(', ')
  sql(`INSERT INTO membro_grupo (id_grupo, id_usuario, papel) VALUES ${valores}`)
  return { g, ids, nome }
}

function novoDesafio(g, criador, { valor = 10, titulo } = {}) {
  seq += 1
  const t = titulo ?? `Desafio de tela ${seq}`
  const d = num(
    `INSERT INTO desafio (id_grupo, id_criador, id_categoria, titulo, descricao, valor_cp, tipo_recompensa, data_limite) VALUES (${g}, ${criador}, 1, '${t}', 'Montado pelo roteiro de tela', ${valor}, 'PRENDA_ACAO', CURRENT_TIMESTAMP + INTERVAL '7 days') RETURNING id_desafio`,
  )
  sql(
    `INSERT INTO moderacao_desafio (id_grupo, id_criador, id_desafio, nivel_filtro, titulo, descricao, aprovado) VALUES (${g}, ${criador}, ${d}, 'MODERADO', '${t}', 'Montado pelo roteiro de tela', TRUE)`,
  )
  return { d, titulo: t }
}

const aceitar = (d, u, papel, escolha) => chamar('POST', `/api/desafios/${d}/participantes`, { papelDesafio: papel, escolha }, u)
async function enviarProva(d, u, comentario = null) {
  const r = await chamar('POST', `/api/desafios/${d}/evidencias`, { tipoMidia: 'LINK', urlComprovante: 'https://exemplo.com/prova', comentario }, u)
  return r.dados?.idEvidencia
}
const votar = (e, u, voto, justificativa = null) => chamar('POST', `/api/validacao/evidencias/${e}/votos`, { voto, justificativa }, u)

/** Grupo com Desafiado, Desafiante e jurados; desafio aceito pelos dois (EM_ANDAMENTO). */
async function duelo({ jurados = 3, emAndamento = true, valor = 10 } = {}) {
  const nomes = ['Duda', 'Tito', ...Array.from({ length: jurados }, (_, i) => `Jur${i}`)]
  const { g, ids, nome } = novoGrupo(nomes)
  const w = { g, nome, desafiado: ids.Duda, desafiante: ids.Tito, jurados: nomes.slice(2).map((n) => ids[n]) }
  Object.assign(w, novoDesafio(g, w.desafiante, { valor }))
  if (emAndamento) {
    const a = await aceitar(w.d, w.desafiado, 'DESAFIADO', 'VAI_CUMPRIR')
    const b = await aceitar(w.d, w.desafiante, 'DESAFIANTE', 'NAO_VAI_CUMPRIR')
    if (a.status !== 200 || b.status !== 200) throw new Error(`montagem do duelo: ${a.status}, ${b.status}`)
  }
  return w
}

const saldo = (g, u) => num(`SELECT saldo_cp FROM membro_grupo WHERE id_grupo = ${g} AND id_usuario = ${u}`)
const status = (d) => sql(`SELECT status FROM desafio WHERE id_desafio = ${d}`)

// --- tela ---------------------------------------------------------------------

async function irPara(rota) {
  await pagina.goto(rota.startsWith('http') ? rota : `${WEB}${rota}`)
  await pagina.waitForLoadState('networkidle')
}

async function entrarComo(id) {
  await irPara('/login')
  const linha = sql(`SELECT id_usuario || '|' || nome || '|' || email || '|' || apelido || '|' || coalesce(avatar_url, '') FROM usuario WHERE id_usuario = ${id}`)
  await gravarSessao(pagina, sessaoDe(linha))
  await irPara('/desafios')
}

async function sairDaSessao() {
  await irPara('/login')
  await pagina.evaluate(() => localStorage.clear())
}

const campo = (rotulo) => pagina.locator('label').filter({ has: pagina.getByText(rotulo, { exact: true }) }).locator('input, textarea').first()

// --- tempo real: cliente minimo do SignalR (protocolo JSON) ---------------------

const SEP = '\u001e'

async function conectarHub(id) {
  const auth = id ? { Authorization: `Bearer ${tok(id)}` } : {}
  const negociacao = await fetch(`${API}/hubs/votacao/negotiate?negotiateVersion=1`, { method: 'POST', headers: auth })
  if (negociacao.status !== 200) return { status: negociacao.status }
  const { connectionToken } = await negociacao.json()
  const url = `${API.replace(/^http/, 'ws')}/hubs/votacao?id=${connectionToken}${id ? `&access_token=${tok(id)}` : ''}`
  const ws = new WebSocket(url)
  const eventos = []
  const pendentes = new Map()
  let invocacao = 0
  await new Promise((ok, falha) => {
    ws.onerror = () => falha(new Error('falha no WebSocket'))
    ws.onopen = () => ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + SEP)
    ws.onmessage = (msg) => {
      for (const quadro of String(msg.data).split(SEP).filter(Boolean)) {
        const m = JSON.parse(quadro)
        if (Object.keys(m).length === 0) ok()
        else if (m.type === 1) eventos.push({ alvo: m.target, dados: m.arguments?.[0], quando: Date.now() })
        else if (m.type === 3) pendentes.get(m.invocationId)?.(m)
      }
    }
  })
  return {
    status: 200,
    eventos,
    invocar(alvo, ...args) {
      invocacao += 1
      const idInv = String(invocacao)
      return new Promise((ok) => {
        pendentes.set(idInv, ok)
        ws.send(JSON.stringify({ type: 1, invocationId: idInv, target: alvo, arguments: args }) + SEP)
      })
    },
    fechar() {
      ws.close()
    },
  }
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
async function esperarEvento(hub, alvo, ms = 8000) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    const e = hub.eventos.find((x) => x.alvo === alvo)
    if (e) return e
    await espera(200)
  }
  return null
}

// ==============================================================================

async function rodar() {
  navegador = await chromium.launch({ headless: !HEADED, executablePath: CHROME })
  contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
  pagina = await contexto.newPage()

  // --- sessao e rotas ----------------------------------------------------------

  await cenario('F02', 'Abrir /perfil direto, sem sessao, leva ao login', async () => {
    await sairDaSessao()
    await irPara('/perfil')
    await pagina.waitForURL('**/login', { timeout: 10000 })
    return `foi para ${new URL(pagina.url()).pathname}`
  })

  await cenario('F03', 'Rota inexistente leva a /desafios', async () => {
    const u = novoUsuario('Rota')
    await entrarComo(u)
    await irPara('/rota-que-nao-existe')
    await pagina.waitForURL('**/desafios', { timeout: 10000 })
    return `foi para ${new URL(pagina.url()).pathname}`
  })

  await cenario('F07', 'Sessao expirada durante o uso volta ao login e descarta o token', async () => {
    const { ids } = novoGrupo(['Expira'])
    await entrarComo(ids.Expira)
    await pagina.evaluate((t) => localStorage.setItem('euduvido.token', t), tok(ids.Expira, -5))
    await irPara('/grupos')
    await pagina.waitForURL('**/login', { timeout: 10000 })
    const token = await pagina.evaluate(() => localStorage.getItem('euduvido.token'))
    confere(token === null, 'o token vencido continua no localStorage')
    return 'a API respondeu 401, a tela foi para /login e o token saiu do localStorage'
  })

  // --- detalhe do desafio --------------------------------------------------------

  await cenario('F10', 'Papel ja ocupado nao aparece como opcao', async () => {
    const w = await duelo({ jurados: 1, emAndamento: false })
    await aceitar(w.d, w.desafiado, 'DESAFIADO', 'VAI_CUMPRIR')
    await entrarComo(w.jurados[0])
    await irPara(`/desafios/${w.d}`)
    const opcoes = await pagina.getByRole('radiogroup', { name: 'Seu papel' }).getByRole('radio').allInnerTexts()
    confere(!opcoes.includes('Desafiado') && opcoes.includes('Desafiante') && opcoes.includes('Apostador'), `opcoes na tela: ${opcoes}`)
    return `opcoes: ${opcoes.join(', ')}`
  })

  await cenario('F11', 'Entrar como Apostador pela tela', async () => {
    const w = await duelo({ jurados: 1, emAndamento: false })
    await aceitar(w.d, w.desafiado, 'DESAFIADO', 'VAI_CUMPRIR')
    const apostador = w.jurados[0]
    await entrarComo(apostador)
    await irPara(`/desafios/${w.d}`)
    await pagina.getByRole('radio', { name: 'Apostador', exact: true }).click()
    await pagina.getByRole('radio', { name: 'Não vai cumprir', exact: true }).click()
    await pagina.getByRole('button', { name: 'Entrar como apostador' }).click()
    await pagina.getByRole('button', { name: 'Entrar como apostador' }).waitFor({ state: 'detached' })
    const p = sql(`SELECT papel_desafio || '/' || escolha FROM participante_desafio WHERE id_desafio = ${w.d} AND id_usuario = ${apostador}`)
    confere(p === 'APOSTADOR/NAO_VAI_CUMPRIR', `participacao no banco: "${p}"`)
    confere(saldo(w.g, apostador) === 90 && status(w.d) === 'ABERTA', `saldo ${saldo(w.g, apostador)}, status ${status(w.d)}`)
    return 'APOSTADOR/NAO_VAI_CUMPRIR gravado; 10 CP debitados; desafio continua ABERTA'
  })

  await cenario('F12', 'Criador cancela pela tela, com motivo; CP estornado', async () => {
    const w = await duelo({ jurados: 1 })
    await entrarComo(w.desafiante)
    await irPara(`/desafios/${w.d}`)
    await pagina.getByRole('button', { name: 'Mais ações' }).click()
    await pagina.getByRole('menuitem', { name: /Cancelar desafio/ }).click()
    const dialogo = pagina.getByRole('dialog')
    await dialogo.getByRole('textbox').fill('Choveu, ninguem foi')
    await dialogo.getByRole('button', { name: 'Cancelar o desafio' }).click()
    await pagina.getByText(/Desafio cancelado\. Motivo: Choveu, ninguem foi/).waitFor()
    confere(status(w.d) === 'CANCELADA', `status ${status(w.d)}`)
    confere(saldo(w.g, w.desafiado) === 100 && saldo(w.g, w.desafiante) === 100, 'estorno nao voltou o saldo')
    return 'CANCELADA com o motivo na tela; os dois duelistas voltaram a 100 CP'
  })

  await cenario('F13', 'Quem nao e o criador nao ve "Cancelar"', async () => {
    const w = await duelo({ jurados: 1 })
    await entrarComo(w.desafiado)
    await irPara(`/desafios/${w.d}`)
    await pagina.getByRole('heading', { name: w.titulo }).waitFor()
    confere((await pagina.getByRole('button', { name: 'Mais ações' }).count()) === 0, 'o desafiado ve o menu de cancelar')
    return 'sem o menu "Mais ações" para o desafiado'
  })

  await cenario('F14', 'Desafiado envia prova TEXTO pela tela', async () => {
    const w = await duelo({ jurados: 2 })
    await entrarComo(w.desafiado)
    await irPara(`/desafios/${w.d}`)
    await pagina.getByRole('radio', { name: 'Texto', exact: true }).click()
    await campo('Relato').fill('Corri os 5 km, o Tito estava junto')
    await pagina.getByRole('button', { name: 'Mandar para o júri' }).click()
    await pagina.getByRole('button', { name: 'Mandar para o júri' }).waitFor({ state: 'detached' })
    const e = sql(`SELECT tipo_midia || '|' || url_comprovante FROM evidencia WHERE id_desafio = ${w.d}`)
    confere(e === 'TEXTO|Corri os 5 km, o Tito estava junto' && status(w.d) === 'EM_VOTACAO', `evidencia "${e}", status ${status(w.d)}`)
    return 'evidencia TEXTO gravada com o relato; desafio EM_VOTACAO'
  })

  await cenario('F16', 'Criar desafio com campos obrigatorios vazios nao envia nada', async () => {
    const { ids } = novoGrupo(['Cria'])
    await entrarComo(ids.Cria)
    await irPara('/desafios/nova')
    const antes = num('SELECT count(*) FROM moderacao_desafio')
    const enviar = pagina.locator('form button[type="submit"]').last()
    const titulo = pagina.getByPlaceholder('Correr 10 km até domingo')
    await titulo.fill('')
    if (await enviar.isEnabled()) await enviar.click()
    await espera(1500)
    const invalido = await titulo.evaluate((el) => !el.checkValidity())
    confere(new URL(pagina.url()).pathname === '/desafios/nova', 'saiu da tela de criacao')
    confere(num('SELECT count(*) FROM moderacao_desafio') === antes, 'uma proposta chegou a moderacao')
    confere(invalido || !(await enviar.isEnabled()), 'o titulo vazio nao foi barrado')
    return `titulo vazio barrado pela tela (${invalido ? 'campo invalido' : 'botao desabilitado'}); nada enviado a moderacao`
  })

  await cenario('F22', 'Remover membro com pendencia: a tela bloqueia e explica', async () => {
    const w = await duelo({ jurados: 1 })
    // O admin do grupo e o Duda (primeiro membro); o Tito esta em desafio em curso.
    await entrarComo(w.desafiado)
    await irPara(`/grupos/${w.g}`)
    await pagina.getByRole('button', { name: 'Ações para Tito' }).click()
    const item = pagina.getByRole('menuitem', { name: /Remover do grupo/ })
    confere(await item.isDisabled(), 'Remover do grupo esta liberado para quem tem desafio em curso')
    await pagina.getByText(/Indisponível: Tito está em 1 desafio em curso/).waitFor()
    return 'item desabilitado com o motivo "em 1 desafio em curso"'
  })

  // --- votacao -------------------------------------------------------------------

  await cenario('F25', 'Votacao: "Nao vale" com motivo pronto e texto', async () => {
    const w = await duelo({ jurados: 3 })
    const e = await enviarProva(w.d, w.desafiado)
    const jurado = w.jurados[0]
    await entrarComo(jurado)
    await irPara('/votacao')
    const cartao = pagina.locator('article').filter({ hasText: w.titulo })
    await cartao.getByRole('button', { name: 'Não vale' }).click()
    const dialogo = pagina.getByRole('dialog')
    await dialogo.getByRole('button', { name: 'Parece editada' }).click()
    await dialogo.getByLabel('Justificativa').fill('Sombra estranha no print')
    await dialogo.getByRole('button', { name: 'Confirmar voto' }).click()
    // A confirmacao da lugar ao dialogo de resultado (tambem um dialog): espera o texto dele.
    await pagina.getByText(/Voto registrado|Júri fechou/).first().waitFor({ timeout: 15000 })
    const v = sql(`SELECT voto || '|' || coalesce(justificativa, '') FROM jurado_evidencia WHERE id_evidencia = ${e} AND id_usuario = ${jurado}`)
    confere(v.startsWith('INVALIDO|') && v.includes('Parece editada') && v.includes('Sombra estranha no print'), `voto no banco: "${v}"`)
    return `gravado: ${v}`
  })

  await cenario('F26', 'Votacao sem pendencias mostra o estado vazio', async () => {
    const { ids } = novoGrupo(['Calmo'])
    await entrarComo(ids.Calmo)
    await irPara('/votacao')
    await pagina.getByText('Nada para julgar agora').waitFor()
    return 'estado vazio "Nada para julgar agora"'
  })

  await cenario('F27', 'Votacao ao vivo: o placar muda quando outro jurado vota, sem recarregar', async () => {
    const w = await duelo({ jurados: 4 })
    const e = await enviarProva(w.d, w.desafiado)
    await entrarComo(w.jurados[0])
    await irPara('/votacao')
    const cartao = pagina.locator('article').filter({ hasText: w.titulo })
    await cartao.getByText('0 vale · 0 não vale').waitFor()
    await espera(1500) // tempo de o hub entrar no grupo
    await votar(e, w.jurados[1], 'VALIDO')
    await cartao.getByText('1 vale · 0 não vale').waitFor({ timeout: 10000 })
    return 'placar foi de 0 x 0 para 1 x 0 sem recarregar a pagina'
  })

  await cenario('F37', 'Detalhe: voto "Nao vale" pela tela do desafio', async () => {
    const w = await duelo({ jurados: 3 })
    const e = await enviarProva(w.d, w.desafiado)
    const jurado = w.jurados[0]
    await entrarComo(jurado)
    await irPara(`/desafios/${w.d}`)
    await pagina.getByText('Você está no júri desta prova.').waitFor()
    await pagina.getByRole('button', { name: 'Não vale', exact: true }).click()
    const dialogo = pagina.getByRole('dialog')
    await dialogo.getByLabel('Justificativa').fill('Nao mostra a data')
    await dialogo.getByRole('button', { name: 'Confirmar voto' }).click()
    await pagina.getByText(/Voto registrado|Júri fechou/).first().waitFor({ timeout: 15000 })
    const v = sql(`SELECT voto || '|' || coalesce(justificativa, '') FROM jurado_evidencia WHERE id_evidencia = ${e} AND id_usuario = ${jurado}`)
    confere(v === 'INVALIDO|Nao mostra a data', `voto no banco: "${v}"`)
    return `gravado: ${v}`
  })

  await cenario('F38', 'Detalhe: Desafiante e membro fora do juri nao veem botoes de voto', async () => {
    const w = await duelo({ jurados: 2 })
    await enviarProva(w.d, w.desafiado)
    const retard = novoUsuario('Retard')
    sql(`INSERT INTO membro_grupo (id_grupo, id_usuario) VALUES (${w.g}, ${retard})`)
    const vistos = []
    for (const [quem, id] of [['desafiante', w.desafiante], ['retardatario', retard]]) {
      await entrarComo(id)
      await irPara(`/desafios/${w.d}`)
      await pagina.getByRole('heading', { name: w.titulo }).waitFor()
      const botoes = await pagina.getByRole('button', { name: /^(Vale|Não vale)$/ }).count()
      const aviso = await pagina.getByText('Você está no júri desta prova.').count()
      confere(botoes === 0 && aviso === 0, `${quem} ve ${botoes} botao(oes) de voto`)
      vistos.push(quem)
    }
    return `${vistos.join(' e ')} sem botoes de voto`
  })

  await cenario('F40', 'Aba Votacao do desafiado atualiza o placar ao vivo', async () => {
    const w = await duelo({ jurados: 4 })
    const e = await enviarProva(w.d, w.desafiado)
    await entrarComo(w.desafiado)
    await irPara('/votacao')
    const cartao = pagina.locator('article').filter({ hasText: w.titulo }).filter({ hasText: 'Você é o desafiado' })
    await cartao.getByText(/0 vale · 0 não vale/).waitFor()
    await espera(1500)
    await votar(e, w.jurados[0], 'INVALIDO', 'Foto cortada')
    await cartao.getByText(/0 vale · 1 não vale/).waitFor({ timeout: 10000 })
    await cartao.getByText('Foto cortada').waitFor()
    return 'placar e comentario apareceram sem recarregar'
  })

  // --- grupo, ranking, perfil, fonte, erros ---------------------------------------

  await cenario('F28', 'Ranking com ?grupo= abre o grupo pedido e troca de grupo', async () => {
    const a = novoGrupo(['Rank', 'Colega'])
    seq += 1
    const g2 = num(`INSERT INTO grupo_amigos (nome, descricao, id_criador, nivel_filtro) VALUES ('Outro grupo ${RODADA}-${seq}', 'x', ${a.ids.Rank}, 'LEVE') RETURNING id_grupo`)
    const outro = novoUsuario('Vizinho')
    sql(`INSERT INTO membro_grupo (id_grupo, id_usuario, papel) VALUES (${g2}, ${a.ids.Rank}, 'ADMIN'), (${g2}, ${outro}, 'MEMBRO')`)
    const nomeG2 = sql(`SELECT nome FROM grupo_amigos WHERE id_grupo = ${g2}`)
    await entrarComo(a.ids.Rank)
    await irPara(`/ranking?grupo=${g2}`)
    confere((await pagina.getByRole('tab', { name: nomeG2 }).getAttribute('aria-selected')) === 'true', 'o grupo do ?grupo= nao veio selecionado')
    await pagina.getByText('Vizinho').first().waitFor()
    await pagina.getByRole('tab', { name: a.nome }).click()
    await pagina.getByText('Colega').first().waitFor()
    confere((await pagina.getByText('Vizinho').count()) === 0, 'membros do outro grupo continuam na lista')
    return `abriu "${nomeG2}" pelo ?grupo= e trocou para "${a.nome}"`
  })

  await cenario('F29', 'Perfil: extrato com os lancamentos do ledger', async () => {
    const w = await duelo({ jurados: 1 })
    await entrarComo(w.desafiado)
    await irPara('/perfil')
    const esperado = Math.min(50, num(`SELECT count(*) FROM transacao_cp WHERE id_usuario = ${w.desafiado}`))
    const secao = pagina.locator('section', { hasText: 'Extrato de CP' })
    await secao.waitFor()
    const linhas = await secao.locator('li').count()
    confere(linhas === esperado, `${linhas} linha(s) no extrato, ${esperado} no ledger`)
    return `${linhas} lancamentos na tela = ${esperado} no ledger (credito inicial e escrow)`
  })

  await cenario('F32', 'Botao A+ aumenta a fonte e a escolha persiste ao recarregar', async () => {
    const u = novoUsuario('Fonte')
    await entrarComo(u)
    await pagina.getByRole('button', { name: 'Aumentar a fonte em 20%' }).click()
    confere((await pagina.evaluate(() => document.documentElement.getAttribute('data-escala'))) === 'maior', 'data-escala nao virou "maior"')
    await pagina.reload()
    await pagina.waitForLoadState('networkidle')
    const depois = await pagina.evaluate(() => document.documentElement.getAttribute('data-escala'))
    await pagina.getByRole('button', { name: 'Voltar a fonte ao tamanho normal' }).click()
    confere(depois === 'maior', `depois de recarregar: ${depois}`)
    return 'fonte maior aplicada e mantida depois de recarregar; voltou ao normal'
  })

  await cenario('F33', 'Erros 409 e 404 da API viram alerta legivel, sem quebrar a tela', async () => {
    const pobre = novoGrupo(['Cria', 'Pobre'])
    const caro = novoDesafio(pobre.g, pobre.ids.Cria, { valor: 150 })
    await entrarComo(pobre.ids.Pobre)
    await irPara(`/desafios/${caro.d}`)
    await pagina.getByRole('button', { name: /^Entrar como/ }).click()
    await pagina.getByText('Saldo de 100 CP é insuficiente: o desafio custa 150 CP.').waitFor()

    const w = await duelo({ jurados: 1, emAndamento: false })
    const intruso = w.jurados[0]
    await entrarComo(intruso)
    await irPara(`/desafios/${w.d}`)
    await chamar('DELETE', `/api/grupos/${w.g}/membros/${intruso}`, undefined, intruso)
    await pagina.getByRole('button', { name: /^Entrar como/ }).click()
    // Quem saiu do grupo recebe 404, sem descobrir que o desafio existe (D25).
    const alerta = pagina.locator('form').getByText(/HTTP 404|não encontrad/i)
    await alerta.first().waitFor({ timeout: 8000 })
    const texto = (await alerta.first().innerText()).trim()
    confere(await pagina.getByRole('heading', { name: w.titulo }).isVisible(), 'a tela do desafio quebrou depois do 404')
    return `409: mensagem de saldo da API; 404: "${texto}"`
  })

  // --- primeiro login pelo Google (validador simulado, ADR 0024) -------------------
  await recriarApi({ GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID_TESTE, GOOGLE_SIMULADO_CHAVE })
  await contexto.addInitScript(GOOGLE_FALSO)

  async function entrarPeloGoogle(email, nome) {
    await sairDaSessao()
    await pagina.evaluate((t) => localStorage.setItem('e2e.googleToken', t), tokenGoogle(email, nome))
    await irPara('/login')
    await pagina.getByRole('button', { name: 'Entrar com Google (simulado)' }).click()
    await pagina.getByText('Complete seu cadastro').waitFor()
  }

  await cenario('F05', 'Primeiro login: o formulario pede apelido e nascimento e cria a conta', async () => {
    const email = `estreia.${RODADA}@gmail.com`
    await entrarPeloGoogle(email, 'Bia Estreante')
    await pagina.getByText(email).waitFor()
    const apelido = await campo('Apelido').inputValue()
    confere(apelido === 'Bia', `apelido sugerido: "${apelido}"`)
    await campo('Data de nascimento').fill('2001-05-06')
    await pagina.getByRole('button', { name: 'Criar conta e entrar' }).click()
    await pagina.waitForURL('**/desafios', { timeout: 15000 })
    const gravado = sql(`SELECT apelido || '|' || nome || '|' || data_nascimento FROM usuario WHERE email = '${email}'`)
    confere(gravado === 'Bia|Bia Estreante|2001-05-06', `usuario no banco: "${gravado}"`)
    confere(await pagina.evaluate(() => Boolean(localStorage.getItem('euduvido.token'))), 'sem sessao depois do cadastro')
    return `conta criada (${gravado}); entrou em /desafios com sessao`
  })

  await cenario('F06', 'Cadastro com menos de 16 anos mostra a regra e nao cria a conta', async () => {
    const email = `menor.${RODADA}@gmail.com`
    await entrarPeloGoogle(email, 'Caio Menor')
    const hoje = new Date()
    const nascimento = `${hoje.getFullYear() - 15}-01-01`
    await campo('Data de nascimento').fill(nascimento)
    await pagina.getByRole('button', { name: 'Criar conta e entrar' }).click()
    await pagina.getByText(/ao menos 16 anos/).waitFor()
    confere(new URL(pagina.url()).pathname === '/login', 'saiu da tela de cadastro')
    confere(num(`SELECT count(*) FROM usuario WHERE email = '${email}'`) === 0, 'a conta do menor foi criada')
    return `nascimento ${nascimento}: mensagem da RN26 na tela; nada gravado`
  })

  await navegador.close()

  // --- tempo real (sem navegador) -------------------------------------------------

  await cenario('H01', 'Conectar ao hub sem token e recusado', async () => {
    const hub = await conectarHub(null)
    hub.fechar?.()
    confere(hub.status === 401, `sem token: negociacao respondeu ${hub.status}${hub.status === 200 ? ' e o WebSocket conectou' : ''}`)
    return 'negociacao sem token respondeu 401'
  })

  await cenario('H02', 'Logado, entrar no canal de um grupo alheio e recusado e nao recebe os eventos dele', async () => {
    const w = await duelo({ jurados: 3 })
    const e = await enviarProva(w.d, w.desafiado)
    const forasteiro = novoUsuario('Espiao')
    const hub = await conectarHub(forasteiro)
    confere(hub.status === 200, `forasteiro logado nao conectou: ${hub.status}`)
    const resposta = await hub.invocar('EntrarNoGrupo', w.g)
    confere(resposta.error, 'EntrarNoGrupo de grupo alheio foi aceito sem erro')
    await votar(e, w.jurados[0], 'VALIDO')
    const evento = await esperarEvento(hub, 'votacaoAtualizada', 5000)
    hub.fechar()
    confere(!evento, `o forasteiro recebeu o placar do grupo ${w.g}: ${(JSON.stringify(evento?.dados) ?? '').slice(0, 120)}`)
    return `EntrarNoGrupo recusado ("${resposta.error}"); nenhum evento do grupo alheio chegou`
  })

  await cenario('H03', 'Voto registrado: votacaoAtualizada chega com o placar ja gravado', async () => {
    const w = await duelo({ jurados: 4 })
    const e = await enviarProva(w.d, w.desafiado)
    const hub = await conectarHub(w.desafiado)
    const entrada = await hub.invocar('EntrarNoGrupo', w.g)
    confere(!entrada.error, `membro nao entrou no canal do proprio grupo: ${entrada.error}`)
    await votar(e, w.jurados[0], 'VALIDO')
    const evento = await esperarEvento(hub, 'votacaoAtualizada')
    hub.fechar()
    confere(evento, 'votacaoAtualizada nao chegou')
    const banco = num(`SELECT count(*) FROM jurado_evidencia WHERE id_evidencia = ${e} AND voto = 'VALIDO'`)
    const estado = evento.dados.estado
    confere(evento.dados.idEvidencia === e && estado.votosFavoraveis === banco && banco === 1, `evento ${JSON.stringify(evento.dados).slice(0, 160)}; banco ${banco}`)
    return `idEvidencia ${e}; placar do evento ${estado.votosFavoraveis} x ${estado.votosContra} = banco`
  })

  await cenario('H04', 'Voto que fecha o juri: desafioEncerrado chega com o status final', async () => {
    const w = await duelo({ jurados: 3 })
    const e = await enviarProva(w.d, w.desafiado)
    const hub = await conectarHub(w.desafiado)
    await hub.invocar('EntrarNoGrupo', w.g)
    await votar(e, w.jurados[0], 'VALIDO')
    await votar(e, w.jurados[1], 'VALIDO')
    const evento = await esperarEvento(hub, 'desafioEncerrado')
    hub.fechar()
    confere(evento && evento.dados.idDesafio === w.d && evento.dados.status === 'FINALIZADA_CUMPRIU' && status(w.d) === 'FINALIZADA_CUMPRIU',
      `evento ${JSON.stringify(evento?.dados)}; banco ${status(w.d)}`)
    return `desafioEncerrado ${w.d} FINALIZADA_CUMPRIU, igual ao banco`
  })
}

try {
  await rodar()
} catch (erro) {
  console.error(`Falha fora dos cenarios: ${erro.message}`)
  process.exitCode = 1
  await navegador?.close()
} finally {
  // Volta a API a configuracao padrao do compose (sem Client ID nem Google simulado).
  try {
    await recriarApi()
  } catch (erro) {
    console.error(`NAO consegui restaurar a API: ${erro.message}. Rode: docker compose up -d --no-deps --force-recreate api`)
  }
}

console.log('')
for (const r of [...resultados].sort((a, b) => a[0].localeCompare(b[0]))) console.log(r.join(' | '))
const aprovados = resultados.filter((r) => r[2] === 'Aprovado').length
console.log(`\n${aprovados}/${resultados.length} aprovados; reprovados: ${resultados.filter((r) => r[2] === 'REPROVADO').map((r) => r[0])}; nao cobertos: ${resultados.filter((r) => r[2] === 'NAO COBERTO').map((r) => r[0])}`)
if (resultados.some((r) => r[2] === 'REPROVADO')) {
  console.log(`Prints das falhas em ${SHOTS}`)
  process.exitCode = 1
}
