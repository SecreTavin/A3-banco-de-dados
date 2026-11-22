// Captura as telas reais do sistema para os documentos 22-29 (docs/04-ux/telas).
//
// Precisa do sistema local povoado com os cinco integrantes do grupo
// (scripts/telas/povoar-integrantes.mjs) e de playwright-core:
//
//     npm i --no-save playwright-core
//     EUDUVIDO_DB=euduvido-ensaio-db-1 EUDUVIDO_CAPTURAR_RECUSA=1 \
//       node scripts/telas/capturar-telas.mjs
//
// So le o banco, com uma excecao opcional: EUDUVIDO_CAPTURAR_RECUSA=1 tambem
// envia uma proposta perigosa ao moderador simulado, para mostrar a recusa na
// tela 25. Isso grava uma linha em moderacao_desafio. A tela de login so e
// capturada quando o ambiente tem GOOGLE_CLIENT_ID, para mostrar o botao real.
//
// Variaveis: EUDUVIDO_WEB (http://localhost:8080), EUDUVIDO_API
// (http://localhost:5080), EUDUVIDO_DB (euduvido-ensaio-db-1), CHROME_PATH.

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { consultaUsuario, gravarSessao, sessaoDe } from '../testes/sessao.mjs'
import { iniciarModeradorEnsaio } from './moderador-ensaio.mjs'

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080'
const API = process.env.EUDUVIDO_API ?? 'http://localhost:5080'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CAPTURAR_RECUSA = process.env.EUDUVIDO_CAPTURAR_RECUSA === '1'
const CONTAINER_DB = process.env.EUDUVIDO_DB ?? 'euduvido-ensaio-db-1'
const DESTINO = new URL('../../docs/04-ux/telas/img/', import.meta.url).pathname

mkdirSync(DESTINO, { recursive: true })

const navegador = await chromium.launch({ executablePath: CHROME, headless: true })
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
const pagina = await contexto.newPage()

async function esperar() {
  await pagina.waitForLoadState('networkidle')
  await pagina.waitForTimeout(400)
}

async function capturar(arquivo) {
  await esperar()
  // O conteudo rola dentro do <main>: a janela cresce para a captura mostrar tudo.
  const altura = await pagina.evaluate(() => {
    const main = document.querySelector('main')
    return main ? window.innerHeight + main.scrollHeight - main.clientHeight : window.innerHeight
  })
  await pagina.setViewportSize({ width: 1280, height: Math.min(Math.max(altura, 800), 1600) })
  await pagina.waitForTimeout(200)
  await pagina.screenshot({ path: DESTINO + arquivo, fullPage: true })
  await pagina.setViewportSize({ width: 1280, height: 800 })
  console.log('ok', arquivo)
}

async function irPara(url) {
  await pagina.goto(url)
}

const sql = (consulta) =>
  execFileSync('docker', ['exec', CONTAINER_DB, 'psql', '-U', 'euduvido', '-d', 'euduvido', '-tA', '-c', consulta], {
    encoding: 'utf8',
  }).trim()

// O login e so pelo Google, que nao se automatiza: a sessao e assinada aqui
// (scripts/testes/sessao.mjs) e gravada como a tela de login faria.
async function entrar(apelido) {
  await irPara(`${WEB}/login`)
  await gravarSessao(pagina, sessaoDe(sql(consultaUsuario(apelido.replaceAll("'", "''")))))
  await irPara(`${WEB}/desafios`)
  await pagina.waitForURL('**/desafios', { timeout: 15000 })
}

const idGrupo = (nome) => sql(`SELECT id_grupo FROM grupo_amigos WHERE nome = '${nome}'`)
const idDesafio = (titulo) => sql(`SELECT id_desafio FROM desafio WHERE titulo = '${titulo}'`)

// 22 - Autenticacao
const configuracao = await fetch(`${API}/api/auth/configuracao`).then((r) => r.json())
if (configuracao.googleClientId) {
  await irPara(`${WEB}/login`)
  await capturar('22-login.png')
}

// Octavio: admin da Turma do A3
await entrar('Octávio')
await capturar('24-meus-desafios.png')

await irPara(`${WEB}/grupos`)
await capturar('23-meus-grupos.png')
await irPara(`${WEB}/grupos/${idGrupo('Turma do A3')}`)
await capturar('23-detalhe-grupo.png')

await irPara(`${WEB}/desafios/nova`)
await capturar('25-criar-desafio.png')

if (CAPTURAR_RECUSA) {
  // Formulario do redesign: grupo e categoria em cartoes, custo e prazo em atalhos.
  const moderador = await iniciarModeradorEnsaio()
  await pagina.getByRole('button', { name: /^Turma do A3/ }).click()
  await pagina.getByRole('button', { name: 'Prendas & Zoeira', exact: true }).click()
  await pagina.locator('input[maxlength="120"]').fill('Beber uma garrafa de vodka em 10 minutos')
  await pagina.locator('textarea').fill('Tomar a garrafa inteira na festa de sábado, sem parar.')
  await pagina.getByRole('button', { name: '10 CP', exact: true }).click()
  await pagina.getByRole('button', { name: '1 semana', exact: true }).click()
  await pagina.getByRole('button', { name: 'Enviar para a moderação', exact: true }).click()
  await pagina.getByText('Não passou no filtro').waitFor({ timeout: 30000 })
  await capturar('25-criar-desafio-recusado.png')
  await moderador.fechar()
}

await irPara(`${WEB}/desafios/${idDesafio('Correr 5 km abaixo de 25 minutos')}`)
await capturar('26-detalhe-desafio.png')

await irPara(`${WEB}/ranking`)
await capturar('28-ranking.png')

await irPara(`${WEB}/perfil`)
await capturar('29-perfil.png')

// Octavio tambem e jurado da corrida: o voto dele fecha o quorum
await irPara(`${WEB}/votacao`)
await capturar('27-central-votacao.png')

await navegador.close()
