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

async function entrar(apelido) {
  await pagina.goto(`${WEB}/login`)
  await pagina.evaluate(() => {
    localStorage.removeItem('euduvido.token')
    localStorage.removeItem('euduvido.usuario')
  })
  await pagina.goto(`${WEB}/login`)
  await esperar()
  await pagina.getByText(apelido, { exact: true }).first().click()
  await pagina.waitForURL('**/desafios', { timeout: 15000 })
}

const campo = (rotulo) =>
  pagina.locator('label').filter({ has: pagina.getByText(rotulo, { exact: true }) })

// 22 - Autenticacao
await pagina.goto(`${WEB}/login`)
await capturar('22-login.png')

// Tavin: ADMIN do grupo 1, criador do desafio da demonstracao
await entrar('Tavin')
await capturar('24-meus-desafios.png')

await pagina.goto(`${WEB}/grupos`)
await capturar('23-meus-grupos.png')
await pagina.goto(`${WEB}/grupos/1`)
await capturar('23-detalhe-grupo.png')

await pagina.goto(`${WEB}/desafios/nova`)
await capturar('25-criar-desafio.png')

if (CAPTURAR_RECUSA) {
  await campo('Grupo').locator('select').selectOption({ value: '1' })
  await campo('Categoria').locator('select').selectOption({ index: 1 })
  await campo('Título').locator('input').fill('Beber uma garrafa de vodka em 10 minutos')
  await campo('Descrição').locator('textarea').fill('Tomar a garrafa inteira na festa de sábado, sem parar.')
  await campo('Custo em CP').locator('input').fill('10')
  const prazo = new Date(Date.now() + 7 * 86_400_000)
  const p = (n) => String(n).padStart(2, '0')
  await campo('Prazo').locator('input').fill(
    `${prazo.getFullYear()}-${p(prazo.getMonth() + 1)}-${p(prazo.getDate())}T20:00`)
  await pagina.getByRole('button', { name: 'Criar desafio' }).click()
  await pagina.getByText('recusou a proposta').waitFor({ timeout: 30000 })
  await capturar('25-criar-desafio-recusado.png')
}

await pagina.goto(`${WEB}/desafios/1`)
await capturar('26-detalhe-desafio.png')

await pagina.goto(`${WEB}/ranking`)
await capturar('28-ranking.png')

await pagina.goto(`${WEB}/perfil`)
await capturar('29-perfil.png')

// Lari: jurada com o voto pendente que fecha o quorum na demonstracao
await entrar('Lari')
await pagina.goto(`${WEB}/votacao`)
await capturar('27-central-votacao.png')

await navegador.close()
