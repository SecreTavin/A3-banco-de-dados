// Os capítulos do vídeo "Demonstracao". Cada um amarra as capturas reais aos
// marcos de cenas.ts: `m.<marco>` é o quadro do marco dentro da cena, já
// escalado pela duração real do áudio. Os deslocamentos curtos (o clique vem
// 0,3 s antes da tela trocar) ficam em segundos absolutos.
import type { ComponentType, ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { contagem, Palco, Surgir, useMola } from '../ui';
import { cor, fonteTitulo, s } from '../tema';
import { caixa, centro, type Caixa } from './capturas';
import {
  AREA,
  Coluna,
  CPRolando,
  Faixa,
  Item,
  Logo,
  MARGEM,
  Mono,
  Painel,
  Status,
  ValorCP,
} from './Interface';
import { TRANSICAO, type CenaNaLinha } from './linha';
import { alturaNavegador, Celular, larguraCelular, Navegador } from './Tela';

type Props = { c: CenaNaLinha };

const ALTURA_AREA = AREA.base - AREA.topo;
/** Navegador à direita da coluna, ocupando a altura toda da área. */
const NAV_LARGURA = 1140;
const NAV = { left: 1920 - MARGEM - NAV_LARGURA, top: AREA.topo };
const COLUNA = NAV.left - MARGEM - 56;
/** Celular dos capítulos 5 e 6, centrado no espaço à direita da coluna. */
const CEL_ALTURA = ALTURA_AREA;
const CEL = { left: (NAV.left + 1920 - MARGEM) / 2 - larguraCelular(CEL_ALTURA) / 2 - 60, top: AREA.topo };

const p = (c: Caixa) => centro(c);

/** Estrutura comum: fundo, coluna, a(s) tela(s) e a faixa do banco no fim. */
const Capitulo = ({ c, conta, largura = COLUNA, painel, children }: Props & {
  conta: string; largura?: number; painel?: ReactNode; children: ReactNode;
}) => (
  <Palco>
    <Coluna rotulo={c.cena.rotulo} conta={conta} largura={largura}>
      {painel}
    </Coluna>
    {children}
    {c.cena.faixaBanco && c.marcos.faixa !== undefined && (
      <Faixa faixa={c.cena.faixaBanco} entra={c.marcos.faixa} sai={c.duracao - (c.saidaComTransicao ? TRANSICAO : 0) - s(0.3)} />
    )}
  </Palco>
);

// ── 0 · Abertura ───────────────────────────────────────────────────────────

const Abertura = ({ c }: Props) => (
  <Palco>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <Surgir>
        <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
          <Logo tamanho={180} />
          <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 150, letterSpacing: -5, color: cor.texto }}>Eu Duvido!</div>
        </div>
      </Surgir>
      <Surgir inicio={c.marcos.frase}>
        <p style={{ margin: 0, fontSize: 44, fontWeight: 500, color: cor.textoSuave }}>{c.cena.legendas[0]}</p>
      </Surgir>
    </div>
  </Palco>
);

// ── 1 · Entrar ─────────────────────────────────────────────────────────────

const Entrar = ({ c }: Props) => {
  const m = c.marcos;
  // O campo de data tem o ícone do calendário: em vez de digitar por cima, a
  // captura já preenchida (com o foco no campo) entra logo depois do clique.
  const digitaFim = m.digita + s(0.3);
  const nascimento = caixa('01-cadastro', 'nascimento');
  return (
    <Capitulo
      c={c}
      conta="Primeiro acesso: o Google já identificou a pessoa, falta o cadastro."
      painel={
        <Painel titulo="Cadastro" inicio={m.cadastro}>
          <Item inicio={m.cadastro} rotulo="Apelido" valor={<span style={{ fontSize: 23 }}>Novato</span>} />
          <Item inicio={m.digita} rotulo="Nascimento" valor={<span style={{ fontSize: 23 }}>10/03/2014</span>} />
          <Item
            inicio={m.recusa}
            rotulo={<Status antes={['Recusado: menos de 16 anos', cor.perdeu]} />}
            apoio={<>linhas novas em <Mono>usuario</Mono>: 0</>}
          />
        </Painel>
      }
    >
      <Navegador
        largura={NAV_LARGURA}
        style={NAV}
        planos={[
          { f: 0, captura: '01-login' },
          { f: m.cadastro, captura: '01-cadastro-vazio' },
          { f: digitaFim, captura: '01-cadastro' },
          { f: m.recusa, captura: '01-recusa' },
        ]}
        focos={[
          { f: s(0.6), alvo: caixa('01-login', 'google') },
          { f: m.cadastro, alvo: caixa('01-cadastro', 'cartao'), zoom: 1.15 },
          { f: m.digita, alvo: nascimento },
          { f: m['clique-criar'] - s(0.6), alvo: caixa('01-cadastro', 'criar') },
          { f: m.recusa, alvo: caixa('01-recusa', 'alerta') },
        ]}
        cursor={[
          { f: s(0.3), x: 1180, y: 700 },
          { f: m['clique-google'], ...p(caixa('01-login', 'google')), clique: true },
          { f: m.digita, ...p(nascimento), clique: true },
          { f: m['clique-criar'], ...p(caixa('01-cadastro', 'criar')), clique: true },
        ]}
      />
    </Capitulo>
  );
};

// ── 2 · Grupo ──────────────────────────────────────────────────────────────

const Grupo = ({ c }: Props) => {
  const m = c.marcos;
  const email = caixa('02-grupo-antes', 'email');
  const adicionar = caixa('02-grupo-antes', 'adicionar');
  const texto = 'rafael@exemplo.com';
  const digita = m.email + s(0.4);
  const digitaFim = digita + s(texto.length / 14 + 0.4);
  const membros = ['Arthur', 'Luís', 'Mario', 'Octávio'];
  return (
    <Capitulo
      c={c}
      conta="Navegador do Octávio, admin da Banca do A3."
      painel={
        <>
          <Painel titulo="Filtro da IA" inicio={m.filtro}>
            <Item rotulo="Banca do A3" valor={<Status antes={['Moderado', cor.primaria]} />} />
          </Painel>
          <Painel titulo="Saldo no grupo" inicio={s(0.3)}>
            {membros.map((nome, i) => (
              <Item key={nome} inicio={s(0.4) + i * 3} rotulo={nome} valor={<ValorCP valor={100} />} />
            ))}
            <Item
              inicio={m.saldo}
              rotulo="Rafael"
              apoio={<Mono>CREDITO_INICIAL</Mono>}
              valor={<CPRolando de={0} para={100} inicio={m.saldo + 4} duracao={s(1.2)} />}
            />
          </Painel>
        </>
      }
    >
      <Navegador
        largura={NAV_LARGURA}
        style={NAV}
        planos={[
          { f: 0, captura: '02-grupo-antes' },
          { f: digitaFim, captura: '02-email' },
          { f: m.saldo, captura: '02-grupo-depois' },
        ]}
        focos={[
          { f: m.filtro, alvo: caixa('02-grupo-antes', 'filtro') },
          { f: m.email, alvo: { x: email.x, y: email.y, w: adicionar.x + adicionar.w - email.x, h: email.h } },
          { f: m.saldo, alvo: caixa('02-grupo-depois', 'rafael') },
        ]}
        digitacoes={[{ f: digita, ate: digitaFim, caixa: email, texto, porSegundo: 14 }]}
        cursor={[
          { f: s(0.8), x: 1000, y: 420 },
          { f: m.email + s(0.2), ...p(email), clique: true },
          { f: m['clique-adicionar'], ...p(adicionar), clique: true },
        ]}
        cursorSome={m.saldo - s(0.1)}
      />
    </Capitulo>
  );
};

// ── 3 · Criar desafio ──────────────────────────────────────────────────────

const Criar = ({ c }: Props) => {
  const m = c.marcos;
  const titulo = caixa('03-novo', 'titulo');
  const texto = 'Correr 5 km abaixo de 25 minutos';
  const digita = m.titulo + s(0.5);
  const novo = digita + s(texto.length / 16 + 0.6);
  const avaliando = m['clique-enviar'] + s(0.25);
  const proposta = (nome: string, de: number, aprovada: boolean, troca: number) => (
    <Item
      inicio={de}
      rotulo={<span style={{ fontSize: 21 }}>{nome}</span>}
      valor={<Status antes={['avaliando…', cor.textoFraco]} depois={aprovada ? ['aprovada', cor.cumpriu] : ['recusada', cor.perdeu]} troca={troca} />}
    />
  );
  return (
    <Capitulo
      c={c}
      conta="Navegador do Octávio. A IA é o moderador do grupo, no filtro Moderado."
      painel={
        <>
          <Painel titulo="Custo para entrar" inicio={m.custo}>
            <Item rotulo="Por pessoa" valor={<ValorCP valor={20} />} />
          </Painel>
          <Painel titulo="Propostas avaliadas" inicio={avaliando}>
            {proposta('Correr 5 km abaixo de 25 minutos', avaliando, true, m.aprovado)}
            {proposta('Beber uma garrafa de vodka em 10 minutos', m.vodka, false, m.recusa)}
          </Painel>
        </>
      }
    >
      <Navegador
        largura={NAV_LARGURA}
        style={NAV}
        planos={[
          { f: 0, captura: '03-vazio' },
          { f: novo, captura: '03-novo' },
          { f: avaliando, captura: '03-avaliando' },
          { f: m.aprovado, captura: '03-criado' },
          { f: m.vodka, captura: '03-recusa' },
        ]}
        focos={[
          { f: m.titulo + s(0.2), alvo: titulo },
          { f: novo + s(0.3), alvo: caixa('03-novo', 'previa') },
          { f: m.custo, alvo: caixa('03-novo', 'custo') },
          { f: m['clique-enviar'] - s(0.6), alvo: caixa('03-novo', 'enviar') },
          { f: avaliando, alvo: caixa('03-avaliando', 'moderacao') },
          { f: m.aprovado, alvo: caixa('03-criado', 'cabecalho') },
          { f: m.vodka, alvo: caixa('03-recusa', 'titulo') },
          { f: m.recusa, alvo: caixa('03-recusa', 'recusa') },
        ]}
        digitacoes={[{ f: digita, ate: novo, caixa: titulo, texto, porSegundo: 16 }]}
        cursor={[
          { f: s(0.6), x: 760, y: 560 },
          { f: m.titulo + s(0.5), ...p(titulo), clique: true },
          { f: m['clique-enviar'], ...p(caixa('03-novo', 'enviar')), clique: true },
        ]}
        cursorSome={m.aprovado}
      />
    </Capitulo>
  );
};

// ── 4 · Aceitar e apostar ──────────────────────────────────────────────────

const Aceitar = ({ c }: Props) => {
  const m = c.marcos;
  const frame = useCurrentFrame();
  const passos = [m.luis, m.arthur, m.mario];
  const pote = passos.reduce((v, f, i) => (frame >= f ? contagem(frame, i * 20, (i + 1) * 20, f, s(0.8)) : v), 0);
  const pessoa = (nome: string, papel: string, f: number) => (
    <Item inicio={s(0.3)} rotulo={nome} apoio={papel} valor={<CPRolando de={100} para={80} inicio={f} duracao={s(0.8)} />} />
  );
  return (
    <Capitulo
      c={c}
      conta="Cada um na sua conta: Luís, Arthur e Mario."
      painel={
        <>
          <Painel titulo="Pote do desafio" inicio={s(0.2)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <ValorCP valor={pote} grande />
              <Status antes={['Aberto', cor.aberta]} depois={['Em andamento', cor.emAndamento]} troca={m.andamento} />
            </div>
          </Painel>
          <Painel titulo="Saldo de cada um" inicio={s(0.3)}>
            {pessoa('Luís', 'apostador · vai cumprir', m.luis)}
            {pessoa('Arthur', 'desafiado', m.arthur)}
            {pessoa('Mario', 'desafiante · não vai cumprir', m.mario)}
          </Painel>
        </>
      }
    >
      <Navegador
        largura={NAV_LARGURA}
        style={NAV}
        planos={[
          { f: 0, captura: '04-luis-escolha' },
          { f: m.luis, captura: '04-luis' },
          { f: m.arthur, captura: '04-arthur' },
          { f: m.mario, captura: '04-mario' },
        ]}
        focos={[
          { f: 0, alvo: caixa('04-luis-escolha', 'form'), zoom: 1.12 },
          { f: m.luis, alvo: caixa('04-luis', 'duelo') },
          { f: m.arthur, alvo: caixa('04-arthur', 'duelo') },
          { f: m.andamento, alvo: caixa('04-mario', 'etapas'), zoom: 1.15 },
          { f: m.retido, alvo: caixa('04-mario', 'pote') },
        ]}
        cursor={[
          { f: 0, x: 900, y: 600 },
          { f: m.luis - s(0.3), ...p(caixa('04-luis-escolha', 'entrar')), clique: true },
        ]}
        cursorSome={m.luis + s(0.3)}
      />
    </Capitulo>
  );
};

// ── 5 · Enviar a prova ─────────────────────────────────────────────────────

const Prova = ({ c }: Props) => {
  const m = c.marcos;
  const juri = ['Luís', 'Octávio', 'Rafael'];
  return (
    <Capitulo
      c={c}
      conta="Celular do Arthur, o desafiado."
      painel={
        <>
          <Painel titulo="Desafio" inicio={s(0.3)}>
            <Item rotulo="Status" valor={<Status antes={['Em andamento', cor.emAndamento]} depois={['Em votação', cor.emVotacao]} troca={m.juri} />} />
          </Painel>
          <Painel titulo="Júri congelado no envio" inicio={m.juri}>
            {juri.map((nome, i) => (
              <Item key={nome} inicio={m.juri + i * 5} rotulo={nome} valor={<Status antes={['jurado', cor.emVotacao]} />} />
            ))}
            <Item inicio={m.juri + s(1)} rotulo={<span style={{ color: cor.textoFraco }}>Arthur e Mario</span>} apoio="no duelo: não julgam" />
          </Painel>
        </>
      }
    >
      <Celular
        altura={CEL_ALTURA}
        style={CEL}
        planos={[
          { f: 0, captura: '05-andamento' },
          { f: m.foto, captura: '05-foto' },
          { f: m.juri, captura: '05-votacao' },
        ]}
        focos={[
          { f: s(0.4), alvo: caixa('05-andamento', 'form'), zoom: 1.1 },
          { f: m.foto, alvo: caixa('05-foto', 'foto') },
          { f: m['clique-mandar'] - s(0.6), alvo: caixa('05-foto', 'mandar') },
          { f: m.juri, alvo: caixa('05-votacao', 'jurados') },
        ]}
        cursor={[
          { f: m.foto - s(0.3), ...p(caixa('05-andamento', 'foto')), clique: true },
          { f: m['clique-mandar'], ...p(caixa('05-foto', 'mandar')), clique: true },
        ]}
      />
    </Capitulo>
  );
};

// ── 6 · Julgar ─────────────────────────────────────────────────────────────

const Julgar = ({ c }: Props) => {
  const m = c.marcos;
  const decisao = m.quorum - s(0.4);
  const confirmar = m['clique-vale'] + s(0.25);
  return (
    <Capitulo
      c={c}
      conta="Celular do Luís, um dos três jurados."
      painel={
        <>
          <Painel titulo="Quórum" inicio={m.quorum}>
            <Item rotulo="3 jurados" valor={<span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 30 }}>⌊3/2⌋ + 1 = 2</span>} />
          </Painel>
          <Painel titulo="Placar" inicio={m.quorum + s(0.4)}>
            <Item rotulo={<span style={{ color: cor.cumpriu }}>Vale</span>} valor={<Numero de={0} para={1} inicio={m.registrado} />} />
            <Item rotulo={<span style={{ color: cor.perdeu }}>Não vale</span>} valor={<Numero de={0} para={0} inicio={0} />} />
            <Item inicio={m.registrado + s(0.3)} rotulo="Falta 1 voto" apoio="para o júri fechar" />
          </Painel>
        </>
      }
    >
      <Celular
        altura={CEL_ALTURA}
        style={CEL}
        planos={[
          { f: 0, captura: '06-card' },
          { f: decisao, captura: '06-decisao' },
          { f: confirmar, captura: '06-confirmar' },
          { f: m.registrado, captura: '06-registrado' },
        ]}
        focos={[
          { f: m['o-que-vale'], alvo: caixa('06-card', 'oQueVale') },
          { f: m.quorum, alvo: caixa('06-decisao', 'quorum') },
          { f: m['clique-vale'] - s(0.5), alvo: caixa('06-decisao', 'vale') },
          { f: confirmar + s(0.1), alvo: caixa('06-confirmar', 'confirmar') },
          { f: m.registrado, alvo: caixa('06-registrado', 'dialogo'), zoom: 1.1 },
        ]}
        cursor={[
          { f: m['clique-vale'], ...p(caixa('06-decisao', 'vale')), clique: true },
          { f: m['clique-confirmar'], ...p(caixa('06-confirmar', 'confirmar')), clique: true },
        ]}
      />
    </Capitulo>
  );
};

const Numero = ({ de, para, inicio }: { de: number; para: number; inicio: number }) => {
  const valor = contagem(useCurrentFrame(), de, para, inicio, s(0.5));
  return <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{valor}</span>;
};

// ── 7 · Apurar e pagar ─────────────────────────────────────────────────────

const COLUNA_7 = 400;
const CEL_7 = { left: MARGEM + COLUNA_7 + 40, top: AREA.topo };
const NAV_7_LEFT = CEL_7.left + larguraCelular(CEL_ALTURA) + 40;
const NAV_7_LARGURA = 1920 - MARGEM - NAV_7_LEFT;
const NAV_7 = { left: NAV_7_LEFT, top: AREA.topo + (ALTURA_AREA - alturaNavegador(NAV_7_LARGURA)) / 2 };

const Apurar = ({ c }: Props) => {
  const m = c.marcos;
  const frame = useCurrentFrame();
  const confirmar = m['clique-vale'] + s(0.25);
  const ganho = (nome: string, valor: number, f: number, apoio?: string) => (
    <Item inicio={f} rotulo={nome} apoio={apoio} valor={<CPRolando de={0} para={valor} inicio={f + 3} duracao={s(0.8)} sinal />} />
  );
  return (
    <Capitulo
      c={c}
      largura={COLUNA_7}
      conta="À esquerda, o celular do Luís. À direita, o navegador do Octávio."
      painel={
        // A coluna é estreita: o placar dá lugar ao pagamento, para nada passar por baixo da faixa.
        <>
          {frame < m.pagamento && (
            <div style={{ opacity: interpolate(frame, [m.pagamento - 8, m.pagamento], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              <Painel titulo="Placar do Octávio" inicio={m['ao-vivo']}>
                <Item rotulo="Vale" apoio="sem recarregar a página" valor={<Numero de={1} para={2} inicio={m.carimbo} />} />
              </Painel>
            </div>
          )}
          <Painel titulo="Pagamento" inicio={m.pagamento}>
            {ganho('Arthur', 30, m.pagamento, 'prêmio')}
            {ganho('Luís', 30, m.pagamento + 4, 'prêmio')}
            <Item inicio={m.pagamento + 8} rotulo="Mario" apoio="desafiante" valor={<span style={{ fontSize: 21, fontWeight: 700, color: cor.perdeu }}>perdeu 20 CP</span>} />
            {ganho('Luís e Octávio', 2, m.pagamento + 12, 'pelo voto, cada um')}
          </Painel>
        </>
      }
    >
      <Celular
        altura={CEL_ALTURA}
        style={CEL_7}
        planos={[{ f: 0, captura: '06-registrado' }]}
      />
      <Navegador
        largura={NAV_7_LARGURA}
        style={NAV_7}
        planos={[
          { f: 0, captura: '07-antes' },
          { f: m['ao-vivo'], captura: '07-fecha' },
          { f: confirmar, captura: '07-confirmar' },
          { f: m.carimbo, captura: '07-resultado' },
        ]}
        focos={[
          { f: s(0.2), alvo: caixa('07-fecha', 'placarCartao') },
          { f: m['clique-vale'] - s(0.5), alvo: caixa('07-fecha', 'vale') },
          { f: confirmar + s(0.1), alvo: caixa('07-confirmar', 'confirmar') },
          { f: m.carimbo, alvo: caixa('07-resultado', 'dialogo'), zoom: 1.12 },
          { f: m.pagamento, alvo: caixa('07-resultado', 'pagamentos') },
          { f: m.transacao, alvo: caixa('07-resultado', 'banco') },
        ]}
        cursor={[
          { f: s(0.6), x: 1100, y: 760 },
          { f: m['clique-vale'], ...p(caixa('07-fecha', 'vale')), clique: true },
          { f: m['clique-confirmar'], ...p(caixa('07-confirmar', 'confirmar')), clique: true },
        ]}
        cursorSome={m.carimbo}
      />
    </Capitulo>
  );
};

// ── 8 · Ranking e perfil ───────────────────────────────────────────────────

const Ranking = ({ c }: Props) => {
  const m = c.marcos;
  const frame = useCurrentFrame();
  const aMais = m.perfil - s(1.4);
  const ranking: [string, number][] = [
    ['Luís', 112],
    ['Arthur', 110],
    ['Octávio', 102],
    ['Rafael', 100],
    ['Mario', 80],
  ];
  const extrato: [string, number][] = [
    ['Crédito de entrada no grupo', 100],
    ['Entrada no desafio', -20],
    ['Prêmio do desafio', 30],
  ];
  const trocaPainel = interpolate(frame, [m.perfil - 6, m.perfil + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Capitulo
      c={c}
      conta="Navegador do Octávio, depois o perfil do Arthur."
      painel={
        <div style={{ position: 'relative' }}>
          <div style={{ opacity: 1 - trocaPainel, position: trocaPainel >= 1 ? 'absolute' : 'relative' }}>
            {trocaPainel < 1 && (
              <Painel titulo="Ranking · Banca do A3" inicio={s(0.2)}>
                {ranking.map(([nome, saldo], i) => (
                  <Item
                    key={nome}
                    inicio={s(0.3) + i * 3}
                    rotulo={`${i + 1}º ${nome}`}
                    valor={<CPRolando de={100} para={saldo} inicio={m.podio + s(0.4) + i * 3} duracao={s(1.2)} />}
                  />
                ))}
              </Painel>
            )}
          </div>
          {frame >= m.perfil && (
            <div style={{ opacity: trocaPainel }}>
              <Painel titulo="Extrato do Arthur" inicio={m.perfil}>
                {extrato.map(([rotulo, valor], i) => (
                  <Item key={rotulo} inicio={m.extrato + i * s(0.6)} rotulo={<span style={{ fontSize: 21 }}>{rotulo}</span>} valor={<ValorCP valor={valor} sinal />} />
                ))}
                <Item inicio={m.extrato + s(2)} rotulo="Saldo no grupo" valor={<CPRolando de={0} para={110} inicio={m.extrato + s(2)} duracao={s(1)} />} />
              </Painel>
            </div>
          )}
        </div>
      }
    >
      <Navegador
        largura={NAV_LARGURA}
        style={NAV}
        planos={[
          { f: 0, captura: '08-ranking' },
          { f: aMais - s(0.3), captura: '08-a-normal' },
          { f: aMais + s(0.15), captura: '08-a-mais' },
          { f: m.perfil, captura: '08-perfil' },
        ]}
        focos={[
          { f: m.podio + s(0.2), alvo: caixa('08-ranking', 'podioInteiro'), zoom: 1.12 },
          { f: aMais - s(0.7), alvo: null },
          { f: m.perfil, alvo: caixa('08-perfil', 'saldo') },
          { f: m.extrato, alvo: caixa('08-perfil', 'extrato') },
        ]}
        cursor={[
          { f: aMais - s(0.9), x: 300, y: 620 },
          { f: aMais, ...p(caixa('08-a-normal', 'escala')), clique: true },
        ]}
        cursorSome={m.perfil - s(0.2)}
      />
    </Capitulo>
  );
};

// ── 9 · A regra mora no banco ──────────────────────────────────────────────
// O vídeo passa entre os slides 9 e 10; a demonstração ao vivo fica para o fim
// da apresentação. Por isso o fecho não anuncia o "ao vivo".

const Proximo = ({ c }: Props) => {
  const entra = useMola(c.marcos['fecho']);
  return (
    <Palco>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 44 }}>
        <Surgir>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <Logo tamanho={96} />
            <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 64, letterSpacing: -2 }}>Eu Duvido!</span>
          </div>
        </Surgir>
        <div style={{ opacity: entra, transform: `scale(${0.92 + entra * 0.08})` }}>
          <span style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 120, letterSpacing: -4, color: cor.texto }}>A regra mora no banco</span>
        </div>
      </div>
    </Palco>
  );
};

export const CAPITULOS: Record<string, ComponentType<Props>> = {
  abertura: Abertura,
  entrar: Entrar,
  grupo: Grupo,
  criar: Criar,
  aceitar: Aceitar,
  prova: Prova,
  julgar: Julgar,
  apurar: Apurar,
  ranking: Ranking,
  proximo: Proximo,
};
