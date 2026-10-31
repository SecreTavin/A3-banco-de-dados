// Captura as telas reais do sistema para os documentos 22-29 (docs/04-ux/telas).
//
// Precisa do sistema no ar com o seed original (docker compose) e de
// playwright-core, como o roteiro de testes:
//
//     npm i --no-save playwright-core
//     node scripts/telas/capturar-telas.mjs
//
// So le o banco, com uma excecao opcional: EUDUVIDO_CAPTURAR_RECUSA=1 tambem
// envia uma proposta perigosa para mostrar a recusa da IA na tela 25. Isso
// grava uma linha em moderacao_desafio e exige IA_API_KEY valida. Depois de
// capturar, recrie o banco para a demonstracao:
//     docker compose down -v && docker compose up -d
//
// Variaveis: EUDUVIDO_WEB (http://localhost:8080), CHROME_PATH.

import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CAPTURAR_RECUSA = process.env.EUDUVIDO_CAPTURAR_RECUSA === '1'
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
  await pagina.screenshot({ path: DESTINO + arquivo, fullPage: true })
  console.log('ok', arquivo)
}

// Toda carga de pagina passa pela abertura (tela 30); qualquer tecla segue.
async function irPara(url) {
  await pagina.goto(url)
  await pagina.locator('main[aria-label^="Eu Duvido!"]').waitFor()
  await pagina.keyboard.press('Enter')
}

async function entrar(apelido) {
  await irPara(`${WEB}/login`)
  await pagina.evaluate(() => {
    localStorage.removeItem('euduvido.token')
    localStorage.removeItem('euduvido.usuario')
  })
  await irPara(`${WEB}/login`)
  await esperar()
  await pagina.getByText(apelido, { exact: true }).first().click()
  await pagina.waitForURL('**/desafios', { timeout: 15000 })
}

// 22 - Autenticacao
await irPara(`${WEB}/login`)
await capturar('22-login.png')

// Tavin: ADMIN do grupo 1, criador do desafio da demonstracao
await entrar('Tavin')
await capturar('24-meus-desafios.png')

await irPara(`${WEB}/grupos`)
await capturar('23-meus-grupos.png')
await irPara(`${WEB}/grupos/1`)
await capturar('23-detalhe-grupo.png')

await irPara(`${WEB}/desafios/nova`)
await capturar('25-criar-desafio.png')

if (CAPTURAR_RECUSA) {
  // Formulario do redesign: grupo e categoria em cartoes, custo e prazo em atalhos.
  await pagina.getByRole('button', { name: /^Os Inimigos do Fim/ }).click()
  await pagina.getByRole('button', { name: 'Prendas & Zoeira', exact: true }).click()
  await pagina.locator('input[maxlength="120"]').fill('Beber uma garrafa de vodka em 10 minutos')
  await pagina.locator('textarea').fill('Tomar a garrafa inteira na festa de sábado, sem parar.')
  await pagina.getByRole('button', { name: '10 CP', exact: true }).click()
  await pagina.getByRole('button', { name: '1 semana', exact: true }).click()
  await pagina.getByRole('button', { name: 'Enviar para a moderação', exact: true }).click()
  await pagina.getByText('Não passou no filtro').waitFor({ timeout: 30000 })
  await capturar('25-criar-desafio-recusado.png')
}

await irPara(`${WEB}/desafios/1`)
await capturar('26-detalhe-desafio.png')

await irPara(`${WEB}/ranking`)
await capturar('28-ranking.png')

await irPara(`${WEB}/perfil`)
await capturar('29-perfil.png')

// Lari: jurada com o voto pendente que fecha o quorum na demonstracao
await entrar('Lari')
await irPara(`${WEB}/votacao`)
await capturar('27-central-votacao.png')

await navegador.close()
