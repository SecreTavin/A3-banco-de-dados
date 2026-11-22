// Povoa um banco LOCAL e vazio com os cinco integrantes do grupo, pelo fluxo real
// da API: cadastro, grupos, desafios, aceite, foto da prova, votos, cancelamento
// e remoção de membro. Serve para as capturas do GitBook e para os resultados do
// documento 16. A produção é povoada pelos próprios integrantes, no site.
//
//     COMPOSE_PROJECT_NAME=euduvido-ensaio docker compose \
//       -f docker-compose.yml -f scripts/testes/compose.ia-falsa.yml up -d --build
//     COMPOSE_PROJECT_NAME=euduvido-ensaio scripts/demo/recriar-banco.sh --vazio --sim
//     npm i --no-save playwright-core
//     EUDUVIDO_DB=euduvido-ensaio-db-1 node scripts/telas/povoar-integrantes.mjs
//
// Os e-mails são de exemplo e a data de nascimento é a mesma, fictícia, para
// todos. O script recusa rodar fora do localhost ou num banco com usuários.
//
// Variáveis: EUDUVIDO_API (http://localhost:5080), EUDUVIDO_DB, CHROME_PATH.
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright-core'
import { assinar } from '../testes/sessao.mjs'
import { iniciarModeradorEnsaio } from './moderador-ensaio.mjs'

const API = process.env.EUDUVIDO_API ?? 'http://localhost:5080'
const CONTAINER_DB = process.env.EUDUVIDO_DB ?? 'euduvido-ensaio-db-1'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const NASCIMENTO_FICTICIO = '2004-01-15'

if (!['localhost', '127.0.0.1'].includes(new URL(API).hostname)) {
  console.error('Este script só roda contra uma API local.')
  process.exit(1)
}

const sql = (consulta) =>
  execFileSync('docker', ['exec', CONTAINER_DB, 'psql', '-U', 'euduvido', '-d', 'euduvido', '-tA', '-c', consulta], {
    encoding: 'utf8',
  }).trim()

if (sql('SELECT count(*) FROM usuario') !== '0') {
  console.error('O banco já tem usuários. Recrie com scripts/demo/recriar-banco.sh --vazio.')
  process.exit(1)
}

async function chamar(metodo, rota, corpo, token) {
  const formulario = corpo instanceof FormData
  const resposta = await fetch(API + rota, {
    method: metodo,
    headers: {
      ...(formulario || corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formulario ? corpo : corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const texto = await resposta.text()
  if (!resposta.ok) throw new Error(`${metodo} ${rota}: HTTP ${resposta.status} ${texto.slice(0, 300)}`)
  return texto ? JSON.parse(texto) : null
}

const INTEGRANTES = [
  ['Arthur', 'Arthur Araujo Marzano', 'arthur@exemplo.com'],
  ['Luís', 'Luís Phillipe Pedra Souza', 'luis@exemplo.com'],
  ['Mario', 'Mario Lana Veloso Junior', 'mario@exemplo.com'],
  ['Octávio', 'Octávio Augusto Arruda dos Prazeres', 'octavio@exemplo.com'],
  ['Rafael', 'Rafael Martins Alves', 'rafael@exemplo.com'],
]
const token = {}
const idDe = {}
const emailDe = Object.fromEntries(INTEGRANTES.map(([apelido, , email]) => [apelido, email]))

async function criarGrupo(admin, nome, descricao, nivelFiltro, membros) {
  await chamar('POST', '/api/grupos', { nome, descricao, nivelFiltro }, token[admin])
  const id = Number(sql(`SELECT max(id_grupo) FROM grupo_amigos WHERE nome = '${nome}'`))
  for (const membro of membros) await chamar('POST', `/api/grupos/${id}/membros`, { email: emailDe[membro] }, token[admin])
  return id
}

const categoria = (nome) => Number(sql(`SELECT id_categoria FROM categoria_desafio WHERE nome = '${nome}'`))
const emDias = (dias) => new Date(Date.now() + dias * 86_400_000).toISOString()

async function criarDesafio(criador, idGrupo, nomeCategoria, titulo, descricao, valorCp, recompensa) {
  await chamar(
    'POST',
    '/api/desafios',
    {
      idGrupo,
      idCategoria: categoria(nomeCategoria),
      titulo,
      descricao,
      valorCp,
      tipoRecompensa: recompensa ? 'PRENDA_ACAO' : 'MONETARIA',
      descricaoRecompensa: recompensa ?? null,
      dataLimite: emDias(7),
    },
    token[criador],
  )
  return Number(sql(`SELECT max(id_desafio) FROM desafio WHERE titulo = '${titulo}'`))
}

async function proporRecusada(criador, idGrupo, titulo, descricao) {
  const antes = sql('SELECT count(*) FROM desafio')
  try {
    await criarDesafio(criador, idGrupo, 'Prendas & Zoeira', titulo, descricao, 10)
  } catch (erro) {
    if (!/HTTP 4\d\d/.test(erro.message)) throw erro
  }
  if (sql('SELECT count(*) FROM desafio') !== antes) throw new Error(`A proposta "${titulo}" virou desafio.`)
}

const aceitar = (quem, id, papelDesafio, escolha) =>
  chamar('POST', `/api/desafios/${id}/participantes`, { papelDesafio, escolha }, token[quem])

async function duelo(id, desafiado, desafiante) {
  await aceitar(desafiado, id, 'DESAFIADO', 'VAI_CUMPRIR')
  await aceitar(desafiante, id, 'DESAFIANTE', 'NAO_VAI_CUMPRIR')
}

async function enviarProva(quem, id, foto, comentario) {
  const formulario = new FormData()
  formulario.append('arquivo', new Blob([foto], { type: 'image/png' }), 'prova.png')
  const { url } = await chamar('POST', '/api/midia', formulario, token[quem])
  await chamar('POST', `/api/desafios/${id}/evidencias`, { tipoMidia: 'FOTO', urlComprovante: `${API}${url}`, comentario }, token[quem])
  return Number(sql(`SELECT max(id_evidencia) FROM evidencia WHERE id_desafio = ${id}`))
}

const votar = (quem, idEvidencia, voto, justificativa) =>
  chamar('POST', `/api/validacao/evidencias/${idEvidencia}/votos`, { voto, justificativa }, token[quem])

// Foto de prova desenhada aqui: nenhuma imagem real de ninguém entra no repositório.
async function desenharFotos() {
  const navegador = await chromium.launch({ executablePath: CHROME, headless: true })
  const pagina = await navegador.newPage({ viewport: { width: 720, height: 480 } })
  const desenhar = async (fundo, titulo, numero, rodape) => {
    await pagina.setContent(`<body style="margin:0;width:720px;height:480px;display:flex;flex-direction:column;justify-content:center;
      gap:12px;padding:0 56px;box-sizing:border-box;background:${fundo};color:#fff;font-family:Arial,sans-serif">
      <div style="font-size:26px;letter-spacing:2px;text-transform:uppercase;opacity:.85">${titulo}</div>
      <div style="font-size:112px;font-weight:800;line-height:1">${numero}</div>
      <div style="font-size:26px;opacity:.85">${rodape}</div></body>`)
    return pagina.screenshot({ type: 'png' })
  }
  const fotos = {
    corrida: await desenhar('linear-gradient(135deg,#1f7a5c,#123f52)', 'Corrida concluída', '24:31', '5,02 km · ritmo 4:53/km'),
    der: await desenhar('linear-gradient(135deg,#3f3a9e,#21194f)', 'DER revisado', '10 tabelas', '18 chaves estrangeiras, nenhum erro'),
    flexoes: await desenhar('linear-gradient(135deg,#a34a28,#4f1f1a)', 'Contagem de flexões', '31', 'parou antes das 50'),
  }
  await navegador.close()
  return fotos
}

const moderador = await iniciarModeradorEnsaio()
try {
  const fotos = await desenharFotos()

  for (const [apelido, nome, email] of INTEGRANTES) {
    const tokenCadastro = assinar('euduvido-cadastro', { [CLAIM_EMAIL]: email, nome }, 15)
    const entrada = await chamar('POST', '/api/auth/cadastro', { tokenCadastro, apelido, dataNascimento: NASCIMENTO_FICTICIO })
    token[apelido] = entrada.token
    idDe[apelido] = entrada.usuario.idUsuario
  }

  const turma = await criarGrupo('Octávio', 'Turma do A3', 'Os cinco integrantes do projeto.', 'MODERADO', ['Arthur', 'Luís', 'Mario', 'Rafael'])
  const deploy = await criarGrupo('Rafael', 'Madrugada do Deploy', 'Quem fica acordado até o site subir.', 'PESADO', ['Arthur', 'Luís', 'Mario', 'Octávio'])
  const pelada = await criarGrupo('Arthur', 'Pelada de Sexta', 'Futebol depois da aula.', 'LEVE', ['Luís', 'Rafael', 'Octávio'])

  // Finalizado: a prova é aceita e o pote é pago.
  const der = await criarDesafio('Octávio', turma, 'Acadêmico', 'Entregar o DER sem nenhum erro', 'O Luís duvida que o Mario entrega o DER sem nenhuma correção do professor.', 20)
  // O apostador entra antes: com desafiante e desafiado, o desafio deixa de estar aberto.
  await aceitar('Arthur', der, 'APOSTADOR', 'VAI_CUMPRIR')
  await duelo(der, 'Mario', 'Luís')
  const provaDer = await enviarProva('Mario', der, fotos.der, 'DER final, conferido com o banco.')
  await votar('Octávio', provaDer, 'VALIDO', 'Confere com o schema.')
  await votar('Rafael', provaDer, 'VALIDO', 'Sem erro.')

  // Em votação: um voto dado, falta um para o quórum.
  const corrida = await criarDesafio('Octávio', turma, 'Esportes & Fitness', 'Correr 5 km abaixo de 25 minutos', 'O Arthur duvida que o Rafael corre 5 km em menos de 25 minutos.', 20)
  await aceitar('Mario', corrida, 'APOSTADOR', 'VAI_CUMPRIR')
  await duelo(corrida, 'Rafael', 'Arthur')
  const provaCorrida = await enviarProva('Rafael', corrida, fotos.corrida, 'Terminei em 24:31.')
  await votar('Luís', provaCorrida, 'VALIDO', 'O tempo aparece na foto.')

  // Em andamento e aberto.
  const fifa = await criarDesafio('Rafael', turma, 'Games & E-sports', 'Ganhar de 3 gols de diferença no FIFA', 'O Rafael duvida que o Octávio ganha dele por 3 gols.', 15)
  await duelo(fifa, 'Octávio', 'Rafael')
  await criarDesafio('Octávio', turma, 'Acadêmico', 'Tirar nota máxima no projeto A3', 'O grupo duvida que a banca dá nota máxima.', 25)

  // Cancelado com estorno.
  const cantina = await criarDesafio('Mario', turma, 'Prendas & Zoeira', 'Cantar o hino do time na cantina', 'O Mario duvida que o Luís canta o hino inteiro na hora do almoço.', 10, 'Pagar o açaí')
  await aceitar('Luís', cantina, 'DESAFIADO', 'VAI_CUMPRIR')
  await chamar('POST', `/api/desafios/${cantina}/cancelar`, { motivo: 'A cantina ficou fechada na semana.' }, token.Mario)

  // Perdido: três provas recusadas pelo júri (RN10).
  const flexoes = await criarDesafio('Rafael', deploy, 'Esportes & Fitness', 'Fazer 50 flexões sem parar', 'O Mario duvida que o Arthur faz 50 flexões seguidas.', 15)
  await duelo(flexoes, 'Arthur', 'Mario')
  for (const tentativa of [1, 2, 3]) {
    const prova = await enviarProva('Arthur', flexoes, fotos.flexoes, `Tentativa ${tentativa}.`)
    await votar('Luís', prova, 'INVALIDO', 'Parou antes das 50.')
    await votar('Octávio', prova, 'INVALIDO', 'Não chegou às 50.')
  }

  // Aberto no grupo LEVE e propostas recusadas pela moderação, uma em cada nível.
  await criarDesafio('Arthur', pelada, 'Esportes & Fitness', 'Fazer um gol de falta na pelada', 'O Luís duvida que o Arthur faz um gol de falta na sexta.', 10)
  await proporRecusada('Octávio', turma, 'Beber uma garrafa de vodka em 10 minutos', 'Tomar a garrafa inteira na festa de sábado, sem parar.')
  await proporRecusada('Rafael', deploy, 'Postar a foto do colega dormindo', 'Publicar nas redes a foto de quem dormiu na aula.')
  await proporRecusada('Arthur', pelada, 'Pular do telhado para a piscina', 'Pular do telhado da casa direto na piscina.')

  // Exclusão de membro: lança SAIDA_GRUPO e faz o DELETE (RN25).
  await chamar('DELETE', `/api/grupos/${pelada}/membros/${idDe['Octávio']}`, undefined, token.Arthur)

  const erros = sql('SELECT (SELECT count(*) FROM vw_reconciliacao_saldo) + (SELECT count(*) FROM vw_escrow_orfao)')
  if (erros !== '0') throw new Error(`As views de contabilidade voltaram ${erros} linhas.`)

  for (const [tabela, rotulo] of [
    ['usuario', 'usuários'], ['grupo_amigos', 'grupos'], ['membro_grupo', 'membros'], ['desafio', 'desafios'],
    ['participante_desafio', 'participantes'], ['moderacao_desafio', 'moderações'], ['evidencia', 'evidências'],
    ['jurado_evidencia', 'jurados'], ['transacao_cp', 'lançamentos'],
  ]) console.log(`${rotulo}: ${sql(`SELECT count(*) FROM ${tabela}`)}`)
  console.log(sql("SELECT string_agg(status || '=' || n, ' ') FROM (SELECT status, count(*) n FROM desafio GROUP BY status ORDER BY status) s"))
  console.log('Contabilidade fechada: as duas views estão vazias.')
} finally {
  await moderador.fechar()
}
