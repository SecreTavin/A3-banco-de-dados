// Captura as telas reais do vídeo "Demonstracao" (capítulos 1 a 8), fazendo o
// ciclo do desafio pela interface, na ordem do roteiro, e conferindo o banco a
// cada passo. Roda só contra o sistema LOCAL e num banco sem usuários.
//
// Passo a passo em LEIAME.md, na pasta public/demonstracao/capturas/.
//
// Saída em public/demonstracao/capturas/:
//   * NN-nome.png      capturas a 2x (desktop 1440x900, celular 390x844);
//   * capturas.json    tamanho de cada captura e a caixa (x, y, w, h, em px de
//                      CSS) de cada elemento que a animação aponta ou amplia;
//   * conferencia.txt  o que o PostgreSQL mostrou em cada passo.
//
// O que NÃO é a aplicação real, e por quê:
//   * o botão do Google: o script do Google não se automatiza e o ambiente
//     local não tem GOOGLE_CLIENT_ID. Um substituto local desenha o botão e
//     devolve um token de cadastro assinado aqui. O formulário, a chamada de
//     cadastro e a recusa de idade são os reais;
//   * a IA de moderação: o moderador simulado abaixo aprova tudo, menos a vodka;
//   * a foto da prova: uma ilustração desenhada aqui, como em povoar-integrantes.mjs.
//
// Variáveis: EUDUVIDO_WEB (http://localhost:8080), EUDUVIDO_API
// (http://localhost:5080), EUDUVIDO_DB (euduvido-video-db-1), CHROME_PATH,
// EUDUVIDO_IA_PORTA (5099).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { assinar, consultaUsuario, gravarSessao, sessaoDe } from '../../../scripts/testes/sessao.mjs';

const WEB = process.env.EUDUVIDO_WEB ?? 'http://localhost:8080';
const API = process.env.EUDUVIDO_API ?? 'http://localhost:5080';
const CONTAINER_DB = process.env.EUDUVIDO_DB ?? 'euduvido-video-db-1';
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORTA_IA = Number(process.env.EUDUVIDO_IA_PORTA ?? 5099);
const DESTINO = fileURLToPath(new URL('../public/demonstracao/capturas/', import.meta.url));
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const NASCIMENTO_FICTICIO = '2004-01-15';

for (const url of [WEB, API]) {
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) {
    console.error(`Este script só roda contra o sistema local, não contra ${url}.`);
    process.exit(1);
  }
}

const sql = (consulta) =>
  execFileSync('docker', ['exec', CONTAINER_DB, 'psql', '-U', 'euduvido', '-d', 'euduvido', '-tA', '-c', consulta], {
    encoding: 'utf8',
  }).trim();

if (sql('SELECT count(*) FROM usuario') !== '0') {
  console.error('O banco já tem usuários. Recrie com scripts/demo/recriar-banco.sh --vazio --sim.');
  process.exit(1);
}

mkdirSync(DESTINO, { recursive: true });

// --- conferência no banco ----------------------------------------------------

const conferencia = [];
const anotar = (linha) => {
  conferencia.push(linha);
  console.log(linha);
};

/** Compara o resultado de uma consulta com o esperado; para tudo se divergir. */
function conferir(rotulo, consulta, esperado) {
  const obtido = sql(consulta);
  if (obtido !== esperado) throw new Error(`${rotulo}: esperado "${esperado}", o banco mostrou "${obtido}"`);
  anotar(`ok  ${rotulo}: ${obtido}`);
}

let idGrupo = 0;
let idDesafio = 0;

const saldos = () =>
  `SELECT string_agg(u.apelido || '=' || m.saldo_cp, ' ' ORDER BY u.apelido)
     FROM membro_grupo m JOIN usuario u USING (id_usuario) WHERE m.id_grupo = ${idGrupo}`;
const pote = () => `SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_desafio = ${idDesafio} AND id_usuario IS NULL`;
const statusDesafio = () => `SELECT status FROM desafio WHERE id_desafio = ${idDesafio}`;

// --- API, para preparar o que não aparece no vídeo ----------------------------

async function chamar(metodo, rota, corpo, token) {
  const resposta = await fetch(API + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  if (!resposta.ok) throw new Error(`${metodo} ${rota}: HTTP ${resposta.status} ${texto.slice(0, 300)}`);
  return texto ? JSON.parse(texto) : null;
}

const INTEGRANTES = [
  ['Arthur', 'Arthur Araujo Marzano', 'arthur@exemplo.com'],
  ['Luís', 'Luís Phillipe Pedra Souza', 'luis@exemplo.com'],
  ['Mario', 'Mario Lana Veloso Junior', 'mario@exemplo.com'],
  ['Octávio', 'Octávio Augusto Arruda dos Prazeres', 'octavio@exemplo.com'],
  ['Rafael', 'Rafael Martins Alves', 'rafael@exemplo.com'],
];

// --- moderador simulado, com a demora de uma IA real -------------------------

function iniciarModerador() {
  const servidor = http.createServer(async (req, res) => {
    let bruto = '';
    for await (const pedaco of req) bruto += pedaco;
    const proposta = (JSON.parse(bruto || '{}').messages ?? []).find((m) => m.role === 'user')?.content ?? '';
    const veredito = proposta.includes('Beber uma garrafa de vodka')
      ? { aprovado: false, motivo: 'Envolve consumo excessivo de álcool, com risco à saúde.' }
      : { aprovado: true, motivo: 'Desafio saudável entre amigos.' };
    // A tela mostra "A IA está lendo a proposta" enquanto espera: sem a demora,
    // o estado não fica visível o bastante para a captura.
    await new Promise((ok) => setTimeout(ok, 2500));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'chatcmpl-demonstracao',
        object: 'chat.completion',
        choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(veredito) }, finish_reason: 'stop' }],
      }),
    );
  });
  return new Promise((ok, falha) => {
    servidor.once('error', falha);
    servidor.listen(PORTA_IA, '0.0.0.0', () => ok(() => new Promise((fim) => (servidor.closeAllConnections(), servidor.close(fim)))));
  });
}

// --- navegador -----------------------------------------------------------------

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const CELULAR = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
/** Abaixo do cabeçalho fixo do celular, para nenhuma linha ficar cortada sob ele. */
const MARGEM_CELULAR = 76;

const navegador = await chromium.launch({ executablePath: CHROME, headless: true });
const manifesto = {};

/** Nada sai da máquina: toda requisição fora do localhost é abortada. */
async function soLocal(contexto) {
  await contexto.route(
    (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
    (rota) => rota.abort(),
  );
}

async function novaPagina(formato, extra = {}) {
  const contexto = await navegador.newContext({ ...formato, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', ...extra });
  await soLocal(contexto);
  const pagina = await contexto.newPage();
  return { contexto, pagina };
}

/** Abre uma sessão como `apelido`, assinada como em scripts/testes/sessao.mjs. */
async function entrarComo(apelido, formato, extra) {
  const aberta = await novaPagina(formato, extra);
  await aberta.pagina.goto(`${WEB}/login`);
  await gravarSessao(aberta.pagina, sessaoDe(sql(consultaUsuario(apelido.replaceAll("'", "''")))));
  return aberta;
}

async function assentar(pagina) {
  await pagina.waitForLoadState('networkidle');
  // Animações de entrada do app terminam antes da captura.
  await pagina.waitForTimeout(600);
}

/**
 * Captura a tela visível e grava a caixa de cada alvo. `alvos` é um mapa
 * nome → locator; o vídeo usa as caixas para o cursor, o zoom e os destaques.
 */
async function capturar(pagina, arquivo, alvos = {}) {
  await assentar(pagina);
  const caixas = {};
  for (const [nome, locator] of Object.entries(alvos)) {
    const caixa = await locator.first().boundingBox();
    if (!caixa) throw new Error(`${arquivo}: o alvo "${nome}" não está visível`);
    caixas[nome] = Object.fromEntries(Object.entries(caixa).map(([k, v]) => [k === 'width' ? 'w' : k === 'height' ? 'h' : k, Math.round(v)]));
  }
  await pagina.screenshot({ path: join(DESTINO, arquivo) });
  const { width, height } = pagina.viewportSize();
  manifesto[arquivo.replace('.png', '')] = { arquivo, largura: width, altura: height, alvos: caixas };
  console.log('    captura', arquivo);
}

/** Rola a área principal do app até o elemento, que fica a `margem` px do topo. */
async function rolarAte(pagina, locator, margem = 120) {
  await locator.first().evaluate((el, m) => {
    const area = el.closest('main') ?? document.scrollingElement;
    const topo = el.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop - m;
    area.scrollTo({ top: Math.max(0, topo), behavior: 'instant' });
  }, margem);
  await pagina.waitForTimeout(250);
}

// O primeiro, para um texto repetido na tela não travar o modo estrito do Playwright.
const texto = (pagina, t, exact = false) => pagina.getByText(t, { exact }).first();
const botao = (pagina, nome) => pagina.getByRole('button', { name: nome, exact: true });

// --- ilustração da prova -------------------------------------------------------

async function desenharProva() {
  const { contexto, pagina } = await novaPagina({ viewport: { width: 720, height: 960 }, deviceScaleFactor: 1 });
  await pagina.setContent(`<body style="margin:0;width:720px;height:960px;display:flex;flex-direction:column;justify-content:center;
    gap:18px;padding:0 64px;box-sizing:border-box;background:linear-gradient(160deg,#1f7a5c,#123f52);color:#fff;font-family:Arial,sans-serif">
    <div style="font-size:30px;letter-spacing:3px;text-transform:uppercase;opacity:.85">Corrida concluída</div>
    <div style="font-size:150px;font-weight:800;line-height:1">24:31</div>
    <div style="font-size:44px;font-weight:700">5,02 km</div>
    <div style="font-size:30px;opacity:.85">ritmo médio 4:53 /km</div></body>`);
  const png = await pagina.screenshot({ type: 'png' });
  writeFileSync(join(DESTINO, 'prova-corrida.png'), png);
  await contexto.close();
  return png;
}

// --- substituto local do script do Google ---------------------------------------

const GSI_LOCAL = `
window.google = { accounts: { id: {
  initialize(o) { window.__aoEntrar = o.callback },
  disableAutoSelect() {},
  renderButton(el, o) {
    el.innerHTML = '<button type="button" id="gsi-local" style="display:flex;align-items:center;justify-content:center;gap:10px;width:' +
      (o.width || 320) + 'px;height:44px;border:1px solid #dadce0;border-radius:22px;background:#fff;color:#3c4043;' +
      'font:500 15px Roboto,Arial,sans-serif;cursor:pointer">' +
      '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
      'Fazer login com o Google</button>';
    el.querySelector('button').onclick = () => window.__aoEntrar({ credential: 'credencial-local' });
  },
} } };`;

// --- o ciclo -------------------------------------------------------------------

const fecharModerador = await iniciarModerador();
const abertos = [];
const abrir = async (...args) => {
  const aberta = await entrarComo(...args);
  abertos.push(aberta.contexto);
  return aberta;
};

try {
  const provaPng = await desenharProva();

  anotar('== 1 · Entrar');
  {
    const { contexto, pagina } = await novaPagina(DESKTOP);
    abertos.push(contexto);
    const tokenCadastro = assinar('euduvido-cadastro', { [CLAIM_EMAIL]: 'novato@exemplo.com', nome: 'Novato Exemplo' }, 15);
    await pagina.route('**/api/auth/configuracao', (r) => r.fulfill({ json: { googleClientId: 'demonstracao-local' } }));
    await pagina.route('https://accounts.google.com/gsi/client**', (r) =>
      r.fulfill({ contentType: 'application/javascript', body: GSI_LOCAL }),
    );
    await pagina.route('**/api/auth/google', (r) =>
      r.fulfill({
        json: {
          token: null, usuario: null, cadastroPendente: true, tokenCadastro,
          nome: 'Novato Exemplo', email: 'novato@exemplo.com', avatarUrl: null,
        },
      }),
    );
    await pagina.goto(`${WEB}/login`);
    await pagina.locator('#gsi-local').waitFor();
    await capturar(pagina, '01-login.png', { google: pagina.locator('#gsi-local'), rodape: texto(pagina, 'não guarda senha') });
    await pagina.locator('#gsi-local').click();
    await texto(pagina, 'Complete seu cadastro').waitFor();
    await capturar(pagina, '01-cadastro-vazio.png');
    await pagina.getByLabel('Apelido').fill('Novato');
    await pagina.getByLabel('Data de nascimento').fill('2014-03-10');
    await capturar(pagina, '01-cadastro.png', {
      apelido: pagina.getByLabel('Apelido'),
      nascimento: pagina.getByLabel('Data de nascimento'),
      criar: botao(pagina, 'Criar conta e entrar'),
    });
    await botao(pagina, 'Criar conta e entrar').click();
    const alerta = pagina.getByRole('alert').filter({ hasText: '16 anos' });
    await alerta.waitFor();
    await capturar(pagina, '01-recusa.png', { alerta, criar: botao(pagina, 'Criar conta e entrar') });
    conferir('nenhum usuário criado para o menor de 16 anos', "SELECT count(*) FROM usuario WHERE email = 'novato@exemplo.com'", '0');
  }

  anotar('== preparação: os cinco integrantes e o grupo, pela API');
  const token = {};
  for (const [apelido, nome, email] of INTEGRANTES) {
    const tokenCadastro = assinar('euduvido-cadastro', { [CLAIM_EMAIL]: email, nome }, 15);
    const entrada = await chamar('POST', '/api/auth/cadastro', { tokenCadastro, apelido, dataNascimento: NASCIMENTO_FICTICIO });
    token[apelido] = entrada.token;
  }
  await chamar('POST', '/api/grupos', { nome: 'Banca do A3', descricao: 'O grupo da apresentação final.', nivelFiltro: 'MODERADO' }, token['Octávio']);
  idGrupo = Number(sql("SELECT id_grupo FROM grupo_amigos WHERE nome = 'Banca do A3'"));
  for (const apelido of ['Arthur', 'Luís', 'Mario']) {
    await chamar('POST', `/api/grupos/${idGrupo}/membros`, { email: INTEGRANTES.find((i) => i[0] === apelido)[2] }, token['Octávio']);
  }
  conferir('saldos antes do Rafael', saldos(), 'Arthur=100 Luís=100 Mario=100 Octávio=100');

  anotar('== 2 · Grupo');
  const octavio = await abrir('Octávio', DESKTOP);
  {
    const p = octavio.pagina;
    await p.goto(`${WEB}/grupos`);
    await texto(p, 'Banca do A3').waitFor();
    await capturar(p, '02-meus-grupos.png', { grupo: texto(p, 'Banca do A3') });
    await p.goto(`${WEB}/grupos/${idGrupo}`);
    const filtro = texto(p, 'filtro da IA', true);
    await filtro.waitFor();
    const email = p.getByLabel('E-mail do novo membro');
    const adicionar = botao(p, 'Adicionar · entra com 100 CP');
    await capturar(p, '02-grupo-antes.png', { filtro: filtro.locator('..'), email, adicionar });
    await email.fill('rafael@exemplo.com');
    await capturar(p, '02-email.png', { email, adicionar });
    await adicionar.click();
    await p.getByRole('listitem').filter({ hasText: 'Rafael' }).waitFor();
    await capturar(p, '02-grupo-depois.png', { rafael: p.getByRole('listitem').filter({ hasText: 'Rafael' }) });
    conferir('Rafael entra com 100', saldos(), 'Arthur=100 Luís=100 Mario=100 Octávio=100 Rafael=100');
    conferir(
      'CREDITO_INICIAL do Rafael lançado pela trigger',
      `SELECT t.tipo || ' ' || t.valor FROM transacao_cp t JOIN usuario u USING (id_usuario)
        WHERE t.id_grupo = ${idGrupo} AND u.apelido = 'Rafael'`,
      'CREDITO_INICIAL 100',
    );
  }

  anotar('== 3 · Criar desafio');
  {
    const p = octavio.pagina;
    const preencher = async (titulo, descricao, categoria, custo) => {
      await p.goto(`${WEB}/desafios/nova`);
      await botao(p, 'Enviar para a moderação').waitFor();
      await p.getByRole('button', { name: /Banca do A3/ }).click();
      await p.getByPlaceholder('Correr 10 km até domingo').fill(titulo);
      await p.getByPlaceholder('Print do app de corrida com 10 km e a data').fill(descricao);
      await botao(p, categoria).click();
      await botao(p, `${custo} CP`).click();
      await botao(p, '1 semana').click();
    };
    await p.goto(`${WEB}/desafios/nova`);
    await botao(p, 'Enviar para a moderação').waitFor();
    await capturar(p, '03-vazio.png');
    await preencher(
      'Correr 5 km abaixo de 25 minutos',
      'O Mario duvida que o Arthur corre 5 km em menos de 25 minutos. Vale o print do app de corrida com a distância e o tempo.',
      'Esportes & Fitness',
      20,
    );
    const enviar = botao(p, 'Enviar para a moderação');
    await capturar(p, '03-novo.png', {
      titulo: p.getByPlaceholder('Correr 10 km até domingo'),
      custo: botao(p, '20 CP'),
      previa: texto(p, 'Assim o grupo vai ver').locator('..'),
      enviar,
    });
    await enviar.click();
    await texto(p, 'A IA está lendo a proposta').waitFor();
    await p.waitForTimeout(400);
    await p.screenshot({ path: join(DESTINO, '03-avaliando.png') });
    manifesto['03-avaliando'] = { arquivo: '03-avaliando.png', largura: 1440, altura: 900, alvos: {} };
    console.log('    captura 03-avaliando.png');
    await p.waitForURL(/\/desafios\/\d+$/, { timeout: 20000 });
    idDesafio = Number(p.url().split('/').pop());
    await capturar(p, '03-criado.png', { titulo: texto(p, 'Correr 5 km abaixo de 25 minutos') });

    await preencher('Beber uma garrafa de vodka em 10 minutos', 'Tomar a garrafa inteira na festa de sábado, sem parar.', 'Prendas & Zoeira', 10);
    await botao(p, 'Enviar para a moderação').click();
    const recusa = p.getByRole('alert').filter({ hasText: 'Não passou no filtro' });
    await recusa.waitFor({ timeout: 20000 });
    await capturar(p, '03-recusa.png', { recusa, titulo: p.getByPlaceholder('Correr 10 km até domingo') });
    conferir('um desafio criado', `SELECT count(*) FROM desafio WHERE id_grupo = ${idGrupo}`, '1');
    conferir(
      'duas avaliações em moderacao_desafio',
      `SELECT string_agg(titulo || ' → ' || CASE WHEN aprovado THEN 'aprovada' ELSE 'recusada' END, ' | ' ORDER BY id_moderacao)
         FROM moderacao_desafio WHERE id_grupo = ${idGrupo}`,
      'Correr 5 km abaixo de 25 minutos → aprovada | Beber uma garrafa de vodka em 10 minutos → recusada',
    );
  }

  anotar('== 4 · Aceitar e apostar');
  const aceite = async (apelido, papel, aposta, arquivo, esperadoSaldos, esperadoPote) => {
    const { pagina: p } = await abrir(apelido, DESKTOP);
    await p.goto(`${WEB}/desafios/${idDesafio}`);
    const form = p.locator('form').filter({ hasText: 'Entrar por' });
    await form.waitFor();
    await rolarAte(p, form, 200);
    if (apelido === 'Luís') await capturar(p, '04-aberto.png', { form });
    await form.getByRole('radio', { name: papel, exact: true }).click();
    if (aposta) await form.getByRole('radio', { name: aposta, exact: true }).click();
    const entrar = form.getByRole('button', { name: /^Entrar como/ });
    await capturar(p, `${arquivo}-escolha.png`, {
      papel: form.getByRole('radio', { name: papel, exact: true }),
      aposta: form.getByRole('radio', { checked: true }).last(),
      entrar,
    });
    await entrar.click();
    await form.waitFor({ state: 'detached' });
    await rolarAte(p, p.locator('h1'), 120);
    await capturar(p, `${arquivo}.png`);
    conferir(`saldos depois de ${apelido}`, saldos(), esperadoSaldos);
    conferir(`pote depois de ${apelido}`, pote(), esperadoPote);
  };
  await aceite('Luís', 'Apostador', 'Vai cumprir', '04-luis', 'Arthur=100 Luís=80 Mario=100 Octávio=100 Rafael=100', '20');
  await aceite('Arthur', 'Desafiado', null, '04-arthur', 'Arthur=80 Luís=80 Mario=100 Octávio=100 Rafael=100', '40');
  await aceite('Mario', 'Desafiante', null, '04-mario', 'Arthur=80 Luís=80 Mario=80 Octávio=100 Rafael=100', '60');
  conferir('desafio em andamento', statusDesafio(), 'EM_ANDAMENTO');

  anotar('== 5 · Enviar a prova (celular do Arthur)');
  {
    const { pagina: p } = await abrir('Arthur', CELULAR);
    await p.goto(`${WEB}/desafios/${idDesafio}`);
    const form = p.locator('form').filter({ hasText: 'Mandar para o júri' });
    await form.waitFor();
    await rolarAte(p, form, 100);
    await capturar(p, '05-andamento.png', { form, foto: texto(p, 'Escolher foto') });
    await form.locator('input[type=file]').setInputFiles({ name: 'prova-corrida.png', mimeType: 'image/png', buffer: provaPng });
    await form.getByLabel('Comentário').fill('Terminei em 24:31.');
    const mandar = form.getByRole('button', { name: 'Mandar para o júri' });
    await esperarHabilitado(mandar);
    await rolarAte(p, mandar, 520);
    await capturar(p, '05-foto.png', { mandar, foto: form.locator('img').first() });
    await mandar.click();
    await form.waitFor({ state: 'detached' });
    const juri = texto(p, 'júri até');
    await juri.first().waitFor();
    // O cabeçalho do celular tem ~60 px: o corte cai na borda do cartão da prova.
    await rolarAte(p, texto(p, 'Prova #1', true).locator('..'), MARGEM_CELULAR);
    await capturar(p, '05-votacao.png', {
      jurados: p.locator('li').filter({ hasText: 'Octávio' }).first().locator('..'),
    });
    conferir('desafio em votação', statusDesafio(), 'EM_VOTACAO');
    conferir(
      'júri congelado em jurado_evidencia',
      `SELECT string_agg(u.apelido, ', ' ORDER BY u.apelido) FROM jurado_evidencia j JOIN usuario u USING (id_usuario)
        WHERE j.id_evidencia = (SELECT max(id_evidencia) FROM evidencia WHERE id_desafio = ${idDesafio})`,
      'Luís, Octávio, Rafael',
    );
  }

  anotar('== 6 e 7 · Julgar e apurar');
  {
    // O Octávio abre a Votação antes do voto do Luís. O placar dele muda sem
    // recarregar quando o Luís vota (SignalR depois do commit): a página não é
    // recarregada entre 07-antes e 07-fecha, então a mudança veio ao vivo.
    const po = octavio.pagina;
    await po.goto(`${WEB}/votacao`);
    const cardO = po.locator('article').filter({ hasText: 'Correr 5 km abaixo de 25 minutos' });
    await cardO.waitFor();
    await capturar(po, '07-antes.png', { card: cardO, placar: cardO.getByText(/para fechar/) });

    const { pagina: pl } = await abrir('Luís', CELULAR);
    await pl.goto(`${WEB}/votacao`);
    const cardL = pl.locator('article').filter({ hasText: 'Correr 5 km abaixo de 25 minutos' });
    await cardL.waitFor();
    await capturar(pl, '06-card.png', { quem: cardL.getByText('diz que cumpriu'), regra: cardL.getByText('O que vale') });
    const vale = cardL.getByRole('button', { name: 'Vale', exact: true });
    await rolarAte(pl, cardL.locator('img').first().locator('..'), MARGEM_CELULAR);
    await capturar(pl, '06-decisao.png', { placar: cardL.getByText(/para fechar/), vale });
    await vale.click();
    const confirmar = pl.getByRole('button', { name: 'Confirmar voto' });
    await confirmar.waitFor();
    await capturar(pl, '06-confirmar.png', { confirmar });
    const marcaVoto = Date.now();
    const navegacoes = [];
    po.on('framenavigated', (frame) => frame === po.mainFrame() && navegacoes.push(frame.url()));
    await confirmar.click();
    await pl.getByRole('dialog').filter({ hasText: 'Voto registrado' }).waitFor();
    await capturar(pl, '06-registrado.png', { dialogo: pl.getByRole('dialog') });

    const fecha = cardO.getByText('Seu voto fecha o júri.');
    await fecha.waitFor({ timeout: 15000 });
    if (navegacoes.length) throw new Error(`A Votação do Octávio recarregou: ${navegacoes.join(', ')}`);
    anotar(`ok  placar do Octávio mudou sem recarregar, ${((Date.now() - marcaVoto) / 1000).toFixed(1)} s depois do clique do Luís`);
    conferir('voto do Luís gravado', `SELECT count(*) FROM jurado_evidencia WHERE voto = 'VALIDO'`, '1');
    await capturar(po, '07-fecha.png', { card: cardO, placar: fecha, vale: cardO.getByRole('button', { name: 'Vale', exact: true }) });
    await cardO.getByRole('button', { name: 'Vale', exact: true }).click();
    const confirmarO = po.getByRole('button', { name: 'Confirmar voto' });
    await confirmarO.waitFor();
    await capturar(po, '07-confirmar.png', { confirmar: confirmarO });
    await confirmarO.click();
    const resultado = po.getByRole('dialog').filter({ hasText: 'Júri fechou' });
    await resultado.waitFor({ timeout: 15000 });
    await capturar(po, '07-resultado.png', {
      dialogo: resultado,
      pagamentos: resultado.locator('ul'),
      voce: resultado.getByText('Você, pelo voto'),
      banco: resultado.getByText('numa transação só'),
    });
    conferir('prova aceita', `SELECT status FROM evidencia WHERE id_desafio = ${idDesafio}`, 'ACEITA');
    conferir('desafio cumprido', statusDesafio(), 'FINALIZADA_CUMPRIU');
    conferir('saldos depois da apuração', saldos(), 'Arthur=110 Luís=112 Mario=80 Octávio=102 Rafael=100');
    conferir('pote liberado', pote(), '0');
  }

  anotar('== 8 · Ranking e perfil');
  {
    const p = octavio.pagina;
    await p.goto(`${WEB}/ranking?grupo=${idGrupo}`);
    await texto(p, 'Quem tem mais CP').waitFor();
    await capturar(p, '08-ranking.png', { podio: p.getByText('Luís').first() });
    // A+ (BotaoEscala): fonte 20% maior para o projetor. A escala fica no
    // localStorage, então volta ao normal antes das outras capturas.
    const maior = p.getByRole('button', { name: 'Aumentar a fonte em 20%' });
    const normal = p.getByRole('button', { name: 'Voltar a fonte ao tamanho normal' });
    await capturar(p, '08-a-normal.png', { escala: maior });
    await maior.click();
    await capturar(p, '08-a-mais.png', { escala: normal });
    await normal.click();

    const { pagina: pa } = await abrir('Arthur', DESKTOP);
    await pa.goto(`${WEB}/perfil`);
    await texto(pa, 'Extrato de CP').waitFor();
    await capturar(pa, '08-perfil.png', { saldo: texto(pa, 'Seu CP em cada grupo').locator('..'), extrato: texto(pa, 'Extrato de CP').locator('..') });
    conferir(
      'extrato do Arthur',
      `SELECT string_agg(tipo || ' ' || valor, ' | ' ORDER BY id_transacao) FROM transacao_cp t JOIN usuario u USING (id_usuario)
        WHERE u.apelido = 'Arthur' AND t.id_grupo = ${idGrupo}`,
      'CREDITO_INICIAL 100 | DESAFIO_ESCROW -20 | PREMIO 30',
    );
    conferir('vw_reconciliacao_saldo vazia', 'SELECT count(*) FROM vw_reconciliacao_saldo', '0');
    conferir('vw_escrow_orfao vazia', 'SELECT count(*) FROM vw_escrow_orfao', '0');
    anotar('-- lançamentos do grupo, em ordem:');
    anotar(
      sql(`SELECT string_agg(coalesce(u.apelido, '(desafio)') || ' ' || t.tipo || ' ' || t.valor, E'\\n' ORDER BY t.id_transacao)
             FROM transacao_cp t LEFT JOIN usuario u USING (id_usuario) WHERE t.id_grupo = ${idGrupo}`),
    );
  }

  writeFileSync(join(DESTINO, 'capturas.json'), `${JSON.stringify(manifesto, null, 2)}\n`);
  writeFileSync(join(DESTINO, 'conferencia.txt'), `${conferencia.join('\n')}\n`);
  console.log(`\nok: ${Object.keys(manifesto).length} capturas em ${DESTINO}`);
} finally {
  for (const contexto of abertos) await contexto.close().catch(() => {});
  await navegador.close();
  await fecharModerador();
}

async function esperarHabilitado(locator) {
  for (let i = 0; i < 50; i++) {
    if (await locator.isEnabled()) return;
    await new Promise((ok) => setTimeout(ok, 200));
  }
  throw new Error('O botão não habilitou: o envio da foto não terminou');
}
