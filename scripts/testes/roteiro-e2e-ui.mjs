// Roteiro de testes de ponta a ponta DE TELA do Eu Duvido! (documento 17, nivel 5).
//
// Abre o navegador de verdade (Chrome do sistema), usa o sistema como a banca
// vai usar e confere o efeito de cada passo na tela E direto no PostgreSQL.
// Complementa scripts/testes/roteiro-e2e.py, que testa a mesma coisa pela API.
//
// Precisa do sistema no ar (docker compose) e de playwright-core:
//
//     npm i --no-save playwright-core
//     node scripts/testes/roteiro-e2e-ui.mjs            # navegador visivel
//     HEADED=0 node scripts/testes/roteiro-e2e-ui.mjs   # sem janela
//
// O roteiro ESCREVE no banco (cria grupo, aceita desafio, vota). Ele descobre
// os dados que existem na hora, entao funciona em banco semeado ou ja usado,
// mas nao e idempotente: cada rodada consome um desafio aberto e uma evidencia.
//
// Variaveis: EUDUVIDO_WEB (http://localhost:8080), EUDUVIDO_API
// (http://localhost:5080), EUDUVIDO_DB (euduvido-db-1), HEADED (1 por padrao),
// EUDUVIDO_SHOTS (pasta dos prints de falha).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080'
const API = process.env.EUDUVIDO_API ?? 'http://localhost:5080'
const CONTAINER_DB = process.env.EUDUVIDO_DB ?? 'euduvido-db-1'
const HEADED = process.env.HEADED !== '0'
const SHOTS = process.env.EUDUVIDO_SHOTS ?? path.join(os.tmpdir(), 'euduvido-e2e-ui')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ETIQUETA = `e2e-ui-${Date.now()}`

class NaoCoberto extends Error {}

const resultados = []
const S = {} // estado que um cenario passa ao seguinte

function sql(consulta) {
  return execFileSync(
    'docker',
    ['exec', CONTAINER_DB, 'psql', '-U', 'euduvido', '-d', 'euduvido', '-tA', '-c', consulta],
    { encoding: 'utf8' },
  ).trim()
}

const num = (consulta) => Number(sql(consulta) || 0)
const esc = (texto) => texto.replaceAll("'", "''")

function confere(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem)
}

// Cenario que depende de outro: sem o anterior nao ha o que testar.
function precisa(valor, mensagem) {
  if (!valor) throw new NaoCoberto(mensagem)
}

const SEM_PAGINA_ABERTA = 'navegador ainda nao aberto'
let navegador
let contexto
let pagina

async function foto(id) {
  try {
    fs.mkdirSync(SHOTS, { recursive: true })
    await pagina.screenshot({ path: path.join(SHOTS, `${id}.png`) })
  } catch {
    /* sem pagina para fotografar */
  }
}

async function cenario(id, descricao, fn) {
  let status = 'Aprovado'
  let detalhe = ''
  try {
    detalhe = (await fn()) ?? ''
  } catch (erro) {
    if (erro instanceof NaoCoberto) {
      status = 'NAO COBERTO'
    } else {
      status = 'REPROVADO'
      await foto(id)
    }
    detalhe = String(erro.message).split('\n')[0].slice(0, 220)
  }
  resultados.push([id, descricao, status, detalhe])
  console.log([id, descricao, status, detalhe].join(' | '))
}

// --- Ajudas de tela -----------------------------------------------------------

const campo = (rotulo) =>
  pagina.locator('label').filter({ has: pagina.getByText(rotulo, { exact: true }) })

// Toda carga de pagina passa pela abertura (tela inicial animada); qualquer
// tecla segue para a tela pedida.
async function irPara(url) {
  await pagina.goto(url)
  await passarAbertura()
}

async function passarAbertura() {
  await pagina.locator('main[aria-label^="Eu Duvido!"]').waitFor()
  await pagina.keyboard.press('Enter')
}

async function esperarRede() {
  await pagina.waitForLoadState('networkidle')
}

async function entrar(apelido) {
  await irPara(`${WEB}/login`)
  await pagina.evaluate(() => {
    localStorage.removeItem('euduvido.token')
    localStorage.removeItem('euduvido.usuario')
  })
  await irPara(`${WEB}/login`)
  await esperarRede()
  await pagina.getByText(apelido, { exact: true }).first().click()
  await pagina.waitForURL('**/desafios', { timeout: 15000 })
  await esperarRede()
}

async function abrir(rota) {
  await irPara(`${WEB}${rota}`)
  await esperarRede()
}

const idUsuario = (apelido) => num(`SELECT id_usuario FROM usuario WHERE apelido='${esc(apelido)}'`)

async function medirRolagem() {
  return pagina.evaluate(() => {
    const area = document.querySelector('[class*=conteudo]')
    return {
      areaPerdida: area ? area.scrollHeight - area.clientHeight : -1,
      paginaPerdida: document.documentElement.scrollHeight - innerHeight,
      overflowX: document.documentElement.scrollWidth - innerWidth,
    }
  })
}

// --- Cenarios -----------------------------------------------------------------

async function rodar() {
  navegador = await chromium.launch({
    executablePath: CHROME,
    headless: !HEADED,
    slowMo: HEADED ? 400 : 100,
    args: HEADED ? ['--window-size=1500,1000'] : [],
  })
  contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
  pagina = await contexto.newPage()
  pagina.setDefaultTimeout(15000)

  await cenario('U01', 'Login como Tavin e lista de desafios em /desafios', async () => {
    await entrar('Tavin')
    // A lista fica em duas abas (Ativos / Encerrados, redesign #44); "Sua vez" repete
    // alguns desafios e por isso fica de fora da contagem.
    const linhas = pagina.locator('[class*=lista] a[href^="/desafios/"]')
    await linhas.first().waitFor()
    const ativos = await linhas.count()
    const abaEncerrados = pagina.getByRole('tab', { name: /Encerrados/ })
    await abaEncerrados.click()
    await pagina.locator('[role=tab][aria-selected=true]', { hasText: 'Encerrados' }).waitFor()
    await linhas.first().waitFor()
    const cartoes = ativos + (await linhas.count())
    const tavin = idUsuario('Tavin')
    // A lista mostra os desafios de todos os grupos do usuario (fronteira de
    // visibilidade = grupo), nao so aqueles em que ele participa.
    const esperado = num(
      `SELECT count(*) FROM desafio d WHERE d.id_grupo IN (SELECT id_grupo FROM membro_grupo WHERE id_usuario=${tavin})`,
    )
    confere(cartoes > 0, 'nenhum desafio na lista')
    confere(cartoes === esperado, `tela mostra ${cartoes} desafios, banco tem ${esperado}`)
    return `${cartoes} desafios na tela = ${esperado} nos grupos do Tavin no banco`
  })

  await cenario('U02', 'Abrir o detalhe de um desafio', async () => {
    await abrir('/desafios')
    const link = pagina.locator('[class*=lista] a[href^="/desafios/"]').first()
    const href = await link.getAttribute('href')
    await link.click()
    await pagina.waitForURL(`**${href}`)
    await esperarRede()
    const id = Number(href.split('/').pop())
    const titulo = sql(`SELECT titulo FROM desafio WHERE id_desafio=${id}`)
    const titulos = await pagina.locator('h1').allInnerTexts()
    confere(titulos.some((t) => t.trim() === titulo), `titulo "${titulo}" nao esta na tela`)
    const nPart = num(`SELECT count(*) FROM participante_desafio WHERE id_desafio=${id}`)
    return `desafio ${id} "${titulo}", ${nPart} participante(s) no banco`
  })

  await cenario('U03', 'Criar grupo pelo formulario; criador entra como ADMIN com 100 CP', async () => {
    await abrir('/grupos')
    const nome = `Grupo ${ETIQUETA}`
    await campo('Nome do grupo').locator('input').fill(nome)
    await campo('Descrição').locator('input').fill('Criado pelo roteiro de tela')
    await pagina.getByRole('button', { name: 'Criar', exact: true }).click()
    await pagina.getByText(nome).first().waitFor()
    const id = num(`SELECT id_grupo FROM grupo_amigos WHERE nome='${esc(nome)}'`)
    confere(id > 0, 'grupo nao gravado no banco')
    const tavin = idUsuario('Tavin')
    const membro = sql(
      `SELECT papel||'/'||saldo_cp FROM membro_grupo WHERE id_grupo=${id} AND id_usuario=${tavin}`,
    )
    const credito = num(
      `SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_grupo=${id} AND id_usuario=${tavin} AND tipo='CREDITO_INICIAL'`,
    )
    confere(membro === 'ADMIN/100', `criador no banco: "${membro}"`)
    confere(credito === 100, `CREDITO_INICIAL=${credito}`)
    S.grupoNovo = id
    return `grupo ${id}; criador ${membro}; CREDITO_INICIAL=${credito}`
  })

  await cenario('U04', 'Adicionar membro por e-mail e remover (confirm), com ledger fechando', async () => {
    precisa(S.grupoNovo, 'depende de U03')
    const alvo = sql(
      `SELECT apelido||'|'||email FROM usuario WHERE id_usuario NOT IN (SELECT id_usuario FROM membro_grupo WHERE id_grupo=${S.grupoNovo}) ORDER BY apelido LIMIT 1`,
    )
    confere(alvo, 'nao ha usuario fora do grupo para adicionar')
    const [apelido, email] = alvo.split('|')
    await abrir(`/grupos/${S.grupoNovo}`)
    await pagina.getByLabel('E-mail do novo membro').fill(email)
    await pagina.getByRole('button', { name: /^Adicionar/ }).click()
    const linha = pagina.locator('li', { hasText: apelido })
    await linha.first().waitFor()
    const alvoId = idUsuario(apelido)
    const entrada = sql(
      `SELECT saldo_cp FROM membro_grupo WHERE id_grupo=${S.grupoNovo} AND id_usuario=${alvoId}`,
    )
    confere(entrada === '100', `saldo ao entrar: "${entrada}"`)

    // Remover fica atras do menu "..." e pede confirmacao num dialogo (redesign #48).
    await pagina.getByRole('button', { name: `Ações para ${apelido}` }).click()
    await pagina.getByRole('menuitem', { name: /Remover do grupo/ }).click()
    await pagina.getByRole('dialog').getByRole('button', { name: 'Remover do grupo', exact: true }).click()
    await linha.first().waitFor({ state: 'detached' })
    const restou = num(
      `SELECT count(*) FROM membro_grupo WHERE id_grupo=${S.grupoNovo} AND id_usuario=${alvoId}`,
    )
    const saldoLedger = num(
      `SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_grupo=${S.grupoNovo} AND id_usuario=${alvoId}`,
    )
    const saida = num(
      `SELECT count(*) FROM transacao_cp WHERE id_grupo=${S.grupoNovo} AND id_usuario=${alvoId} AND tipo='SAIDA_GRUPO'`,
    )
    confere(restou === 0, 'membro continua no banco')
    confere(saida === 1 && saldoLedger === 0, `SAIDA_GRUPO=${saida}, saldo do ledger=${saldoLedger}`)
    return `${apelido}: entrou com 100 CP, saiu com SAIDA_GRUPO, ledger do membro = 0`
  })

  await cenario('U05', 'Criar desafio sem IA: a tela explica o bloqueio e nada e gravado', async () => {
    const antes = [num('SELECT count(*) FROM desafio'), num('SELECT count(*) FROM moderacao_desafio')]
    await abrir('/desafios/nova')
    // Criacao do redesign (#47): o primeiro grupo ja vem escolhido; categoria, custo
    // e prazo sao atalhos; o combinado fora do app fica recolhido.
    const categoria = sql('SELECT nome FROM categoria_desafio ORDER BY nome LIMIT 1')
    await pagina.getByRole('button', { name: categoria, exact: true }).click()
    await pagina.locator('input[maxlength="120"]').fill(`Desafio ${ETIQUETA}`)
    await pagina.locator('textarea').fill('Teste do bloqueio sem chave da IA.')
    await pagina.getByRole('button', { name: '5 CP', exact: true }).click()
    await pagina.getByRole('button', { name: '1 semana', exact: true }).click()
    await pagina.getByRole('button', { name: /Combinaram algo fora do app/ }).click()
    await pagina.getByLabel('O que foi combinado').fill('R$ 5,00 no Pix')
    await pagina.getByRole('button', { name: 'Enviar para a moderação', exact: true }).click()
    const alerta = pagina.getByRole('alert').first()
    await alerta.waitFor({ timeout: 30000 })
    const texto = (await alerta.innerText()).replace(/\s+/g, ' ').trim()
    const depois = [num('SELECT count(*) FROM desafio'), num('SELECT count(*) FROM moderacao_desafio')]
    confere(pagina.url().endsWith('/desafios/nova'), 'saiu da tela de criacao')
    confere(antes.join() === depois.join(), `contagens mudaram: ${antes} -> ${depois}`)
    return `mensagem na tela: "${texto.slice(0, 120)}"; desafio/moderacao inalterados (${depois})`
  })

  await cenario('U06', 'Aceitar um desafio ABERTO (Desafiado e Desafiante): CP debitado e retido em escrow', async () => {
    // Prefere um desafio que ja tem Desafiado; no seed nenhum tem, entao os dois
    // aceites sao feitos pela tela.
    const alvo = sql(
      `SELECT d.id_desafio||'|'||d.id_grupo||'|'||d.valor_cp FROM desafio d
       WHERE d.status='ABERTA'
         AND NOT EXISTS (SELECT 1 FROM participante_desafio p WHERE p.id_desafio=d.id_desafio AND p.papel_desafio='DESAFIANTE')
       ORDER BY (EXISTS (SELECT 1 FROM participante_desafio p WHERE p.id_desafio=d.id_desafio AND p.papel_desafio='DESAFIADO')) DESC, d.id_desafio
       LIMIT 1`,
    )
    if (!alvo) throw new NaoCoberto('nao ha desafio ABERTA sem Desafiante')
    const [idDesafio, idGrupo, valor] = alvo.split('|').map(Number)
    const membroLivre = (excluir) =>
      sql(
        `SELECT u.apelido FROM membro_grupo m JOIN usuario u USING (id_usuario)
         WHERE m.id_grupo=${idGrupo} AND m.saldo_cp>=${valor}
           AND m.id_usuario NOT IN (SELECT id_usuario FROM participante_desafio WHERE id_desafio=${idDesafio})
           ${excluir ? `AND u.apelido<>'${esc(excluir)}'` : ''}
         ORDER BY u.apelido LIMIT 1`,
      )
    const saldoDe = (apelido) =>
      num(`SELECT saldo_cp FROM membro_grupo WHERE id_grupo=${idGrupo} AND id_usuario=${idUsuario(apelido)}`)

    async function aceitar(apelido, papel, escolha) {
      const antes = saldoDe(apelido)
      await entrar(apelido)
      await abrir(`/desafios/${idDesafio}`)
      await pagina.getByRole('radio', { name: papel, exact: true }).click()
      await pagina.getByRole('radio', { name: escolha, exact: true }).click()
      await pagina.getByRole('button', { name: /^Entrar como/ }).click()
      await pagina.locator('li', { hasText: apelido }).first().waitFor()
      const depois = saldoDe(apelido)
      const escrow = num(
        `SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_desafio=${idDesafio} AND id_usuario=${idUsuario(apelido)} AND tipo='DESAFIO_ESCROW'`,
      )
      const noBanco = sql(
        `SELECT papel_desafio FROM participante_desafio WHERE id_desafio=${idDesafio} AND id_usuario=${idUsuario(apelido)}`,
      )
      confere(noBanco === papel.toUpperCase(), `${apelido}: papel no banco "${noBanco}"`)
      confere(antes - depois === valor, `${apelido}: saldo ${antes} -> ${depois}, esperado -${valor}`)
      confere(escrow === -valor, `${apelido}: DESAFIO_ESCROW=${escrow}`)
      return `${apelido} (${papel}) ${antes}->${depois}`
    }

    const partes = []
    const temDesafiado = num(`SELECT count(*) FROM participante_desafio WHERE id_desafio=${idDesafio} AND papel_desafio='DESAFIADO'`) > 0
    if (!temDesafiado) {
      const primeiro = membroLivre()
      confere(primeiro, 'nenhum membro com saldo para ser o Desafiado')
      partes.push(await aceitar(primeiro, 'Desafiado', 'Vai cumprir'))
    }
    const desafiante = membroLivre()
    confere(desafiante, 'nenhum membro com saldo para ser o Desafiante')
    partes.push(await aceitar(desafiante, 'Desafiante', 'Não vai cumprir'))

    const status = sql(`SELECT status FROM desafio WHERE id_desafio=${idDesafio}`)
    confere(status === 'EM_ANDAMENTO', `status do desafio: ${status} (RN21 espera EM_ANDAMENTO)`)
    Object.assign(S, { idDesafio, idGrupo, valor, desafiante })
    return `desafio ${idDesafio}: ${partes.join('; ')}; escrow retido, status ${status}`
  })

  await cenario('U07', 'Desafiado envia a evidencia; o juri e congelado no banco', async () => {
    precisa(S.idDesafio, 'depende de U06')
    const desafiado = sql(
      `SELECT u.apelido FROM participante_desafio p JOIN usuario u USING (id_usuario) WHERE p.id_desafio=${S.idDesafio} AND p.papel_desafio='DESAFIADO'`,
    )
    await entrar(desafiado)
    await abrir(`/desafios/${S.idDesafio}`)
    await pagina.getByRole('radio', { name: 'Link', exact: true }).click()
    await campo('Link do comprovante').locator('input').fill(`https://exemplo.com/${ETIQUETA}`)
    await campo('Comentário').locator('input').fill(ETIQUETA)
    await pagina.getByRole('button', { name: 'Mandar para o júri' }).click()
    await pagina.getByText(ETIQUETA).first().waitFor()

    const ev = sql(`SELECT id_evidencia||'|'||status FROM evidencia WHERE id_desafio=${S.idDesafio} AND comentario='${esc(ETIQUETA)}'`)
    confere(ev, 'evidencia nao gravada')
    const [idEvidencia, statusEv] = ev.split('|')
    const jurados = sql(
      `SELECT string_agg(u.apelido, ',' ORDER BY u.apelido) FROM jurado_evidencia j JOIN usuario u USING (id_usuario) WHERE j.id_evidencia=${idEvidencia}`,
    ).split(',').filter(Boolean)
    const intrusos = num(
      `SELECT count(*) FROM jurado_evidencia j JOIN participante_desafio p ON p.id_usuario=j.id_usuario AND p.id_desafio=${S.idDesafio} WHERE j.id_evidencia=${idEvidencia} AND p.papel_desafio IN ('DESAFIANTE','DESAFIADO')`,
    )
    confere(statusEv === 'EM_VOTACAO', `status da evidencia: ${statusEv}`)
    confere(jurados.length > 0, 'juri vazio')
    confere(intrusos === 0, 'Desafiante/Desafiado no juri (RN14)')
    Object.assign(S, { idEvidencia: Number(idEvidencia), jurados, desafiado })
    return `evidencia ${idEvidencia} EM_VOTACAO; juri congelado: ${jurados.join(', ')}`
  })

  await cenario('U08', 'Jurados votam Valido pela Central de Votacao ate o quorum; CP liquidado', async () => {
    precisa(S.idEvidencia, 'depende de U07')
    const votos = []
    S.aposPrimeiroVoto = null
    const recompensasAntes = num(`SELECT count(*) FROM transacao_cp WHERE tipo='RECOMPENSA_VOTO' AND id_grupo=${S.idGrupo}`)
    for (const jurado of S.jurados) {
      const aberta = sql(`SELECT status FROM evidencia WHERE id_evidencia=${S.idEvidencia}`)
      if (aberta !== 'EM_VOTACAO') break
      await entrar(jurado)
      await abrir('/votacao')
      const cartao = pagina.locator('article', { hasText: ETIQUETA })
      await cartao.first().waitFor()
      // Votar abre a confirmacao (o voto e unico) e, depois, a tela de resultado (#46).
      await cartao.first().getByRole('button', { name: 'Vale', exact: true }).click()
      await pagina.getByRole('button', { name: 'Confirmar voto', exact: true }).click()
      await pagina.getByText(/Voto registrado|Júri fechou/).first().waitFor({ timeout: 15000 })
      const voto = sql(
        `SELECT voto FROM jurado_evidencia WHERE id_evidencia=${S.idEvidencia} AND id_usuario=${idUsuario(jurado)}`,
      )
      confere(voto === 'VALIDO', `voto de ${jurado} no banco: "${voto}"`)
      votos.push(jurado)
      if (!S.aposPrimeiroVoto) {
        await abrir('/votacao')
        S.aposPrimeiroVoto = {
          jurado,
          botoes: await pagina
            .locator('article', { hasText: ETIQUETA })
            .getByRole('button', { name: 'Vale', exact: true })
            .count(),
        }
      }
    }
    const evStatus = sql(`SELECT status FROM evidencia WHERE id_evidencia=${S.idEvidencia}`)
    const dStatus = sql(`SELECT status FROM desafio WHERE id_desafio=${S.idDesafio}`)
    // O ledger e de partida dobrada: as linhas do pote tem id_usuario nulo. Aqui
    // so contam os lancamentos de usuarios.
    const premio = num(`SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_desafio=${S.idDesafio} AND tipo='PREMIO' AND id_usuario IS NOT NULL`)
    const escrowTotal = -num(`SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_desafio=${S.idDesafio} AND tipo='DESAFIO_ESCROW' AND id_usuario IS NOT NULL`)
    const potePendente = num(`SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_desafio=${S.idDesafio} AND id_usuario IS NULL`)
    const recompensas = num(`SELECT count(*) FROM transacao_cp WHERE tipo='RECOMPENSA_VOTO' AND id_grupo=${S.idGrupo}`) - recompensasAntes
    const views = num('SELECT (SELECT count(*) FROM vw_reconciliacao_saldo) + (SELECT count(*) FROM vw_escrow_orfao)')
    confere(evStatus === 'ACEITA', `evidencia ${evStatus}`)
    confere(dStatus === 'FINALIZADA_CUMPRIU', `desafio ${dStatus}`)
    confere(premio === escrowTotal && premio > 0, `PREMIO=${premio} vs escrow pago=${escrowTotal}`)
    confere(potePendente === 0, `pote do desafio fechou com saldo ${potePendente}`)
    confere(recompensas === votos.length, `RECOMPENSA_VOTO=${recompensas} para ${votos.length} voto(s)`)
    confere(views === 0, 'vw_reconciliacao_saldo/vw_escrow_orfao nao vazias')
    S.votaram = votos
    return `votaram ${votos.join(' + ')}; evidencia ACEITA, desafio FINALIZADA_CUMPRIU; pote ${premio} CP liquidado; ${recompensas} recompensas de voto; views vazias`
  })

  await cenario('U09', 'Votar de novo na mesma evidencia e impedido pela tela', async () => {
    precisa(S.aposPrimeiroVoto, 'depende de U08')
    confere(
      S.aposPrimeiroVoto.botoes === 0,
      `${S.aposPrimeiroVoto.jurado} ainda via ${S.aposPrimeiroVoto.botoes} botao(oes) Vale na evidencia que ja votou`,
    )
    const votos = num(
      `SELECT count(*) FROM jurado_evidencia WHERE id_evidencia=${S.idEvidencia} AND id_usuario=${idUsuario(S.aposPrimeiroVoto.jurado)} AND voto IS NOT NULL`,
    )
    confere(votos === 1, `votos do jurado no banco: ${votos}`)
    return `depois do 1o voto de ${S.aposPrimeiroVoto.jurado} a tela nao oferece Vale/Nao vale; 1 voto no banco. O 409 da API fica coberto por E05`
  })

  await cenario('U10', 'Perfil e Ranking batem com o banco', async () => {
    await entrar('Tavin')
    const tavin = idUsuario('Tavin')
    await abrir('/perfil')
    const naTela = await pagina.evaluate(() =>
      [...document.querySelectorAll('li')]
        .filter((li) => li.querySelector('a[href^="/grupos/"]'))
        .map((li) => {
          const t = li.innerText.replace(/\s+/g, ' ')
          const m = t.match(/(-?\d+)\s*CP/)
          return [li.querySelector('a').innerText.trim(), m ? Number(m[1]) : NaN]
        }),
    )
    const noBanco = sql(
      `SELECT g.nome||'='||m.saldo_cp FROM membro_grupo m JOIN grupo_amigos g USING (id_grupo) WHERE m.id_usuario=${tavin} ORDER BY g.nome`,
    ).split('\n').filter(Boolean)
    const tela = naTela.map(([n, v]) => `${n}=${v}`).sort()
    confere(tela.join('|') === noBanco.sort().join('|'), `perfil [${tela}] vs banco [${noBanco}]`)

    const grupo = sql(`SELECT g.id_grupo||'|'||g.nome FROM membro_grupo m JOIN grupo_amigos g USING (id_grupo) WHERE m.id_usuario=${tavin} ORDER BY g.id_grupo LIMIT 1`)
    const [idGrupo, nomeGrupo] = [Number(grupo.split('|')[0]), grupo.split('|').slice(1).join('|')]
    await abrir('/ranking')
    await pagina.getByRole('tab', { name: nomeGrupo, exact: true }).click()
    await esperarRede()
    const membros = sql(`SELECT u.apelido||'='||m.saldo_cp FROM membro_grupo m JOIN usuario u USING (id_usuario) WHERE m.id_grupo=${idGrupo}`).split('\n').filter(Boolean)
    for (const m of membros) {
      const [apelido, saldo] = m.split('=')
      const linhas = await pagina.locator('li', { hasText: apelido }).allInnerTexts()
      const ok = linhas.some((t) => new RegExp(`(^|\\D)${saldo}\\s*CP`).test(t.replace(/\s+/g, ' ')))
      confere(ok, `ranking nao mostra ${apelido} com ${saldo} CP`)
    }
    return `perfil: ${tela.join(', ')}; ranking de "${nomeGrupo}": ${membros.length} membros com saldo igual ao banco`
  })

  await cenario('U11', 'Tema alterna e persiste; sem rolagem vertical da pagina em 1440x900', async () => {
    await abrir('/desafios')
    const tema = () => pagina.evaluate(() => document.documentElement.getAttribute('data-tema'))
    const inicial = await tema()
    await pagina.locator('button[aria-label^="Mudar para o tema"]').click()
    const trocado = await tema()
    confere(trocado && trocado !== inicial, `tema nao mudou (${inicial} -> ${trocado})`)
    await pagina.reload()
    await passarAbertura()
    await esperarRede()
    confere((await tema()) === trocado, 'tema nao persistiu apos recarregar')
    await pagina.locator('button[aria-label^="Mudar para o tema"]').click()
    confere((await tema()) === inicial, 'nao voltou ao tema inicial')

    const rotas = ['/desafios', '/desafios/nova', '/votacao', '/grupos', '/ranking', '/perfil']
    const desafio = S.idDesafio ?? num('SELECT min(id_desafio) FROM desafio')
    const grupo = S.idGrupo ?? num('SELECT min(id_grupo) FROM grupo_amigos')
    rotas.push(`/desafios/${desafio}`, `/grupos/${grupo}`)
    const falhas = []
    for (const rota of rotas) {
      await abrir(rota)
      const m = await medirRolagem()
      if (m.paginaPerdida > 1 || m.areaPerdida > 1) falhas.push(`${rota} (pagina ${m.paginaPerdida}px, area ${m.areaPerdida}px)`)
    }
    confere(falhas.length === 0, `rolagem vertical em: ${falhas.join('; ')}`)
    return `tema ${inicial}->${trocado} e persistiu; ${rotas.length} telas sem rolagem da pagina`
  })

  await cenario('U12', 'Celular 390x844: login, desafios e detalhe do grupo sem overflow horizontal', async () => {
    const movel = await navegador.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    })
    const desktop = pagina
    pagina = await movel.newPage()
    pagina.setDefaultTimeout(15000)
    try {
      await abrir('/login')
      const medidas = [['/login', (await medirRolagem()).overflowX]]
      await entrar('Tavin')
      await abrir('/desafios')
      medidas.push(['/desafios', (await medirRolagem()).overflowX])
      const grupo = S.idGrupo ?? num('SELECT min(id_grupo) FROM grupo_amigos')
      await abrir(`/grupos/${grupo}`)
      medidas.push([`/grupos/${grupo}`, (await medirRolagem()).overflowX])
      const ruins = medidas.filter(([, x]) => x > 1)
      confere(ruins.length === 0, `overflow horizontal em ${ruins.map(([r, x]) => `${r} (+${x}px)`).join(', ')}`)
      return `${medidas.map(([r]) => r).join(', ')} sem overflow horizontal`
    } finally {
      await foto('U12-mobile')
      await movel.close()
      pagina = desktop
    }
  })

  await cenario('U13', 'Abertura: anima, segue com tecla ou toque, logado ou nao', async () => {
    const abertura = pagina.locator('main[aria-label^="Eu Duvido!"]')
    const cena = pagina.locator('main svg > g')

    await pagina.goto(`${WEB}/`)
    await pagina.evaluate(() => {
      localStorage.removeItem('euduvido.token')
      localStorage.removeItem('euduvido.usuario')
    })
    await pagina.goto(`${WEB}/`)
    await abertura.waitFor()
    const antes = await cena.innerHTML()
    await pagina.waitForTimeout(400)
    confere(antes.length > 0 && (await cena.innerHTML()) !== antes, 'a cena nao mudou em 400 ms: a animacao nao esta rodando')
    await pagina.keyboard.press('x')
    await pagina.waitForURL('**/login')
    await pagina.getByText('Entrar como').waitFor()

    // Logado, a abertura aparece do mesmo jeito; o toque leva direto ao app.
    await entrar('Tavin')
    await pagina.goto(`${WEB}/`)
    await abertura.waitFor()
    await pagina.mouse.click(200, 200)
    await pagina.waitForURL('**/desafios')

    // Quem pede menos movimento ve o quadro final parado.
    const calmo = await navegador.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } })
    const paginaCalma = await calmo.newPage()
    try {
      await paginaCalma.goto(`${WEB}/`)
      const cenaCalma = paginaCalma.locator('main svg > g')
      await cenaCalma.locator('text').first().waitFor({ state: 'attached' })
      const parado = await cenaCalma.innerHTML()
      await paginaCalma.waitForTimeout(400)
      confere((await cenaCalma.innerHTML()) === parado, 'com reducedMotion a cena deveria ficar parada')
    } finally {
      await calmo.close()
    }
    return 'anima; tecla leva a /login (sem sessao); clique leva a /desafios (logado); parada com reducedMotion'
  })

  await navegador.close()
}

try {
  await rodar()
} catch (erro) {
  console.error(`Falha fora dos cenarios (${SEM_PAGINA_ABERTA}?): ${erro.message}`)
  process.exitCode = 1
  await navegador?.close()
}

const aprovados = resultados.filter((r) => r[2] === 'Aprovado').length
const naoCobertos = resultados.filter((r) => r[2] === 'NAO COBERTO').length
console.log(`\n${aprovados}/${resultados.length} aprovados${naoCobertos ? `, ${naoCobertos} nao coberto(s)` : ''}`)
if (resultados.some((r) => r[2] === 'REPROVADO')) {
  console.log(`Prints das falhas em ${SHOTS}`)
  process.exitCode = 1
}
void API
