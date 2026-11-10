// Captura cada tela nas resolucoes mais usadas e mede se algo rola fora da
// area de conteudo. A janela nunca deve rolar: so o `main`, a tela de login,
// a folha do dialogo e o carrossel horizontal podem ter rolagem.
//
// Precisa do sistema no ar com o seed da demonstracao e de playwright-core,
// como os outros roteiros:
//
//     npm i --no-save playwright-core
//     EUDUVIDO_WEB=http://localhost:5173 node scripts/telas/medir-rolagem.mjs [rotulo]
//
// So le o banco (entra como Tavin e como Lari). As capturas e o medidas.json
// vao para EUDUVIDO_SAIDA (padrao: pasta temporaria do sistema).
//
// Variaveis: EUDUVIDO_WEB (http://localhost:8080), CHROME_PATH, EUDUVIDO_SAIDA,
// SO (lista de tamanhos, ex.: SO=cel-390x844,desk-1366x768),
// ESCUROS (tamanhos que tambem rodam no tema escuro).

import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ROTULO = process.argv[2] ?? 'r1'
const DESTINO = join(process.env.EUDUVIDO_SAIDA ?? join(tmpdir(), 'euduvido-rolagem'), ROTULO) + '/'
mkdirSync(DESTINO, { recursive: true })

// Resolucoes mais usadas (StatCounter 2025/26). A altura util desconta a
// interface do navegador: ~111px no Chrome desktop, ~180px no Safari do
// iPhone, ~80px no Chrome Android.
const TAMANHOS = [
  { nome: 'cel-360x800', width: 360, height: 720, mobile: true },
  { nome: 'cel-375x667', width: 375, height: 553, mobile: true },
  { nome: 'cel-390x844', width: 390, height: 664, mobile: true },
  { nome: 'cel-412x915', width: 412, height: 835, mobile: true },
  { nome: 'desk-1280x720', width: 1280, height: 609 },
  { nome: 'desk-1366x768', width: 1366, height: 657 },
  { nome: 'desk-1536x864', width: 1536, height: 753 },
  { nome: 'desk-1920x1080', width: 1920, height: 969 },
]
const COM_ESCURO = new Set((process.env.ESCUROS ?? 'cel-390x844,desk-1920x1080').split(','))
const SO = process.env.SO ? process.env.SO.split(',') : null

// Conteineres de rolagem esperados. Qualquer outro e anomalia.
const ROLAGEM_OK = [/^main.*conteudo/, /^div.*tela/, /^div.*folha/, /vez/]

// Roda dentro da pagina: compara documento e janela e lista quem rola.
const medir = () => {
  const de = document.documentElement
  const visivel = (el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const rotulo = (el) => {
    const classes = typeof el.className === 'string'
      ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).map((c) => c.replace(/^_/, '').replace(/_[\w-]+$/, '')).join('.')
      : ''
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (classes ? '.' + classes : '')
  }
  const roladores = []
  const foraDireita = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visivel(el)) continue
    const cs = getComputedStyle(el)
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
      roladores.push(`${rotulo(el)} y+${el.scrollHeight - el.clientHeight}`)
    }
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
      roladores.push(`${rotulo(el)} x+${el.scrollWidth - el.clientWidth}`)
    }
    const r = el.getBoundingClientRect()
    if (r.right > innerWidth + 1 && cs.position !== 'fixed') foraDireita.push(`${rotulo(el)}→${Math.round(r.right)}`)
  }
  return {
    innerW: innerWidth,
    innerH: innerHeight,
    docW: de.scrollWidth,
    docH: de.scrollHeight,
    sx: Math.round(scrollX),
    sy: Math.round(scrollY),
    roladores,
    foraDireita: foraDireita.slice(0, 6),
  }
}

const navegador = await chromium.launch({ executablePath: CHROME, headless: true })
const medidas = []
const problemas = []

async function irPara(pagina, url) {
  await pagina.goto(url)
  const abertura = pagina.locator('main[aria-label^="Eu Duvido!"]')
  if (await abertura.count()) await pagina.keyboard.press('Enter')
  await pagina.waitForLoadState('networkidle')
  await pagina.waitForTimeout(350)
}

for (const tam of TAMANHOS) {
  if (SO && !SO.includes(tam.nome)) continue
  const temas = COM_ESCURO.has(tam.nome) ? ['claro', 'escuro'] : ['claro']
  for (const tema of temas) {
    const contexto = await navegador.newContext({
      viewport: { width: tam.width, height: tam.height },
      deviceScaleFactor: tam.mobile ? 2 : 1,
      isMobile: Boolean(tam.mobile),
      hasTouch: Boolean(tam.mobile),
    })
    await contexto.addInitScript((t) => localStorage.setItem('tema', t), tema)
    const pagina = await contexto.newPage()
    pagina.on('pageerror', (e) => console.log('PAGEERROR', tam.nome, tema, e.message))
    pagina.on('console', (m) => {
      if (m.type() === 'error') console.log('CONSOLE', tam.nome, tema, m.text().slice(0, 160))
    })

    const prefixo = `${tam.nome}-${tema}`
    const capturar = async (nome) => {
      await pagina.screenshot({ path: `${DESTINO}${prefixo}-${nome}.png` })
      const m = await pagina.evaluate(medir)
      medidas.push({ tam: tam.nome, tema, tela: nome, ...m })
      const anomalias = []
      if (m.docH > m.innerH + 1) anomalias.push(`documento ${m.docH - m.innerH}px mais alto que a janela`)
      if (m.docW > m.innerW + 1) anomalias.push(`documento ${m.docW - m.innerW}px mais largo que a janela ${m.foraDireita.join(' ')}`)
      if (m.sy || m.sx) anomalias.push(`janela rolada (${m.sx},${m.sy})`)
      for (const r of m.roladores) {
        if (!ROLAGEM_OK.some((re) => re.test(r))) anomalias.push(`rolagem inesperada: ${r}`)
      }
      if (anomalias.length) problemas.push(`${prefixo} ${nome}: ${anomalias.join('; ')}`)
      console.log('ok', prefixo, nome, m.roladores.join(' | ') || '-', anomalias.length ? '!! ' + anomalias.join('; ') : '')
    }
    // Rola a area de conteudo ate o fim e captura de novo, se houver o que rolar.
    const capturarFim = async (nome) => {
      const rolou = await pagina.evaluate(() => {
        const c = document.querySelector('[class*=conteudo]') ?? document.querySelector('[class*=tela]')
        if (!c || c.scrollHeight <= c.clientHeight + 1) return false
        c.scrollTop = c.scrollHeight
        return true
      })
      if (!rolou) return
      await pagina.waitForTimeout(200)
      await pagina.screenshot({ path: `${DESTINO}${prefixo}-${nome}-fim.png` })
    }

    await pagina.goto(`${WEB}/login`)
    await pagina.waitForLoadState('networkidle')
    await pagina.waitForTimeout(600)
    if (tema === 'claro') await capturar('00-abertura')
    await pagina.keyboard.press('Enter')
    await pagina.waitForLoadState('networkidle')
    await pagina.waitForTimeout(350)
    await capturar('01-login')
    await capturarFim('01-login')

    await pagina.getByText('Tavin', { exact: true }).first().click()
    await pagina.waitForURL('**/desafios', { timeout: 15000 })
    await pagina.waitForLoadState('networkidle')
    await pagina.waitForTimeout(400)
    await capturar('02-inicio')
    await capturarFim('02-inicio')

    const rotas = [
      ['03-detalhe', '/desafios/1'],
      ['04-criar', '/desafios/nova'],
      ['05-grupos', '/grupos'],
      ['06-grupo', '/grupos/1'],
      ['07-ranking', '/ranking'],
      ['08-perfil', '/perfil'],
    ]
    for (const [nome, rota] of rotas) {
      await irPara(pagina, `${WEB}${rota}`)
      await capturar(nome)
      await capturarFim(nome)
    }

    // Lari tem voto pendente na demonstracao.
    await pagina.evaluate(() => {
      localStorage.removeItem('euduvido.token')
      localStorage.removeItem('euduvido.usuario')
    })
    await irPara(pagina, `${WEB}/login`)
    await pagina.getByText('Lari', { exact: true }).first().click()
    await pagina.waitForURL('**/desafios', { timeout: 15000 })
    await irPara(pagina, `${WEB}/votacao`)
    await capturar('09-votacao')
    await capturarFim('09-votacao')
    await pagina.evaluate(() => {
      const c = document.querySelector('[class*=conteudo]')
      if (c) c.scrollTop = 0
    })
    // Dialogo de confirmacao do voto: abre e fecha com Escape, sem confirmar.
    const vale = pagina.getByRole('button', { name: 'Vale', exact: true }).first()
    if (await vale.count()) {
      await vale.click()
      await pagina.waitForTimeout(350)
      await capturar('10-confirmar-voto')
      await pagina.keyboard.press('Escape')
      await pagina.waitForTimeout(200)
    }

    await contexto.close()
  }
}
await navegador.close()
writeFileSync(`${DESTINO}medidas.json`, JSON.stringify(medidas, null, 1))
console.log(`\ncapturas em ${DESTINO}`)
console.log('=== PROBLEMAS ===')
console.log(problemas.length ? problemas.join('\n') : 'nenhum')
process.exitCode = problemas.length ? 1 : 0
