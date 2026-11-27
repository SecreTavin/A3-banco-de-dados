// Fonte única do vídeo "Demonstracao": o texto falado, as legendas, os marcos de
// animação e a faixa "O que o banco garante" de cada capítulo.
//
// O ELEVENLABS.md é gerado daqui (npm run roteiro). Mudou uma fala? Mude aqui e
// rode o gerador de novo, para o texto do áudio e o do código nunca divergirem.
//
// Este arquivo é só dado: não importa nada do Remotion, para o Node conseguir
// lê-lo direto no script do roteiro.
//
// Regras do texto falado (`fala`):
// * é o que a voz LÊ: "cê pê", "dezesseis", "inteligência artificial";
// * nome de objeto do banco não é falado: fica na faixa (`faixaBanco`);
// * escrito para o Eleven v4: o v4 não aceita SSML, então a única marcação é a
//   tag [pause], no máximo uma por capítulo. Nada de <break>, nem de tags de
//   emoção: a entonação fica por conta da voz e da Stability.

/** Ritmo usado para estimar a duração da fala antes de o áudio existir. */
export const PALAVRAS_POR_SEGUNDO = 2.4;
/** Silêncio antes da fala, contado do início da cena (a transição assenta). */
export const ATRASO_FALA_SEGUNDOS = 0.5;
/** Silêncio depois da fala, antes da cena seguinte entrar. */
export const CAUDA_SEGUNDOS = 1.0;

export type Marco = {
  id: string;
  /** Segundos a partir do início da fala, no ritmo estimado. */
  em: number;
  descricao: string;
  /**
   * Correção manual, em segundos, depois de ouvir o áudio real. Somada depois
   * da escala proporcional. Ex.: 0.3 atrasa o marco em três décimos.
   */
  ajuste: number;
};

export type FaixaBanco = {
  /** Nome real do objeto no banco, em fonte mono. */
  objeto: string;
  /** Uma linha, na linguagem da banca. */
  detalhe: string;
  regra: string;
};

/** Como o capítulo entra: corte seco (a ação continua, sem sobreposição), fade ou slide. */
export type Entrada = 'corte' | 'fade' | 'slide';

type CenaBase = {
  numero: number;
  id: string;
  /** Coluna "Entrada" do DEMONSTRACAO.md. Fade e slide se sobrepõem à cena anterior. */
  entrada: Entrada;
  /** Rótulo de passo no topo da cena e na barra de progresso. */
  rotulo: string;
  /** O que a tela mostra, para quem for animar. */
  tela: string;
  fala: string;
  /** Forma escrita da fala, uma frase por item. */
  legendas: string[];
  entonacao: string;
  marcos: Marco[];
  faixaBanco: FaixaBanco | null;
  /** Duração mínima da cena, quando a fala é curta (abertura e passagem). */
  duracaoMinimaSegundos?: number;
};

export type Cena = CenaBase & {
  arquivoAudio: string;
  palavras: number;
  duracaoEstimadaSegundos: number;
};

const marco = (id: string, em: number, descricao: string, ajuste = 0): Marco => ({ id, em, descricao, ajuste });

/** Duração que a tag [pause] do v4 acrescenta, em segundos (estimativa). */
const SEGUNDOS_POR_PAUSA = 0.5;
const PAUSA = /\[pause\]/g;

/** Texto sem as marcações, como a voz pronuncia. */
export const textoLimpo = (fala: string) => fala.replace(PAUSA, ' ').replace(/\s+/g, ' ').trim();

export const contarPalavras = (fala: string) => textoLimpo(fala).split(' ').filter((p) => /[\p{L}\d]/u.test(p)).length;

/** Duração estimada da fala: palavras no ritmo padrão mais as pausas marcadas. */
export const estimarFala = (fala: string) => {
  const pausas = [...fala.matchAll(PAUSA)].length * SEGUNDOS_POR_PAUSA;
  return Math.round((contarPalavras(fala) / PALAVRAS_POR_SEGUNDO + pausas) * 10) / 10;
};

const base: CenaBase[] = [
  {
    numero: 0,
    id: 'abertura',
    entrada: 'corte',
    rotulo: 'Eu Duvido!',
    tela: 'Logo do Eu Duvido! sobre o papel claro. A frase entra embaixo do logo.',
    fala: 'Esta é a aplicação, do primeiro acesso ao pagamento.',
    legendas: ['Esta é a aplicação, do primeiro acesso ao pagamento.'],
    entonacao: 'Calma, de quem abre uma apresentação. Sem ênfase de anúncio.',
    marcos: [marco('frase', 0.2, 'A frase aparece embaixo do logo')],
    faixaBanco: null,
    duracaoMinimaSegundos: 5,
  },
  {
    numero: 1,
    id: 'entrar',
    entrada: 'fade',
    rotulo: '1 · Entrar',
    tela:
      'Login com o botão "Entrar com Google". No primeiro acesso, "Complete seu cadastro": apelido "Novato" e nascimento em 2014. "Criar conta e entrar" mostra a recusa da idade mínima.',
    fala:
      'O login é só com o Google: a gente não guarda senha. No primeiro acesso, o app pede apelido e data de nascimento. Com menos de dezesseis anos, a conta não nasce. [pause] Mesmo se o código falhasse, uma trigger no banco recusaria.',
    legendas: [
      'O login é só com o Google: a gente não guarda senha.',
      'No primeiro acesso, o app pede apelido e data de nascimento.',
      'Com menos de 16 anos, a conta não nasce.',
      'Mesmo se o código falhasse, uma trigger no banco recusaria.',
    ],
    entonacao: 'Explicativa e tranquila. Leve sorriso em "a gente não guarda senha".',
    marcos: [
      marco('clique-google', 2.0, 'Clique em "Entrar com Google"'),
      marco('cadastro', 4.8, '"Complete seu cadastro" aparece'),
      marco('digita', 6.0, 'Apelido e data de nascimento (2014) sendo preenchidos'),
      marco('clique-criar', 9.4, 'Clique em "Criar conta e entrar"'),
      marco('recusa', 10.4, 'Alerta: "É preciso ter ao menos 16 anos para usar o Eu Duvido!"'),
      marco('faixa', 13.2, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'trg_usuario_idade_minima',
      detalhe: 'BEFORE INSERT ON usuario: menor de 16 anos não vira linha',
      regra: 'RN26',
    },
  },
  {
    numero: 2,
    id: 'grupo',
    entrada: 'slide',
    rotulo: '2 · Grupo',
    tela:
      'Meus grupos → Banca do A3: Arthur, Luís, Mario e Octávio com 100 CP, filtro da IA "Moderado". O admin digita o e-mail do Rafael e clica em "Adicionar · entra com 100 CP". O Rafael aparece com o saldo rolando de 0 a 100.',
    fala:
      'Agora, o grupo. O filtro da inteligência artificial está no moderado, e o Octávio, que é o admin, adiciona o Rafael pelo e-mail. Ninguém digita saldo: [pause] ao entrar, uma trigger lança cem cê pê no livro-caixa.',
    legendas: [
      'Agora, o grupo.',
      'O filtro da IA está no moderado, e o Octávio, que é o admin, adiciona o Rafael pelo e-mail.',
      'Ninguém digita saldo: ao entrar, uma trigger lança 100 CP no livro-caixa.',
    ],
    entonacao: 'Ritmo de tutorial. Pequena pausa natural depois de "Agora, o grupo".',
    marcos: [
      marco('grupo', 0.0, 'Banca do A3 aberto, quatro membros com 100 CP'),
      marco('filtro', 1.6, 'Zoom em "filtro da IA: Moderado"'),
      marco('email', 4.6, 'Digita rafael@exemplo.com no campo de novo membro'),
      marco('clique-adicionar', 8.6, 'Clique em "Adicionar · entra com 100 CP"'),
      marco('saldo', 9.2, 'Rafael aparece; saldo rola de 0 a 100 CP'),
      marco('faixa', 11.0, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'trg_membro_credito_inicial',
      detalhe: 'AFTER INSERT ON membro_grupo: lança CREDITO_INICIAL +100 em transacao_cp',
      regra: 'RN06',
    },
  },
  {
    numero: 3,
    id: 'criar',
    entrada: 'slide',
    rotulo: '3 · Criar desafio',
    tela:
      'Novo desafio no grupo Banca do A3: "Correr 5 km abaixo de 25 minutos", categoria Esportes & Fitness, 20 CP. "Enviar para a moderação" → "A IA está lendo a proposta" → aprovado. Depois, "Beber uma garrafa de vodka em 10 minutos" → "Não passou no filtro Moderado", com o motivo.',
    fala:
      'O Mario duvida que o Arthur corre cinco quilômetros em menos de vinte e cinco minutos. Vinte cê pê por pessoa. A inteligência artificial avalia: aprovado. Uma garrafa de vodka em dez minutos? Não passa. [pause] Aprovada ou não, toda proposta fica gravada no banco.',
    legendas: [
      'O Mario duvida que o Arthur corre 5 km em menos de 25 minutos.',
      '20 CP por pessoa.',
      'A inteligência artificial avalia: aprovado.',
      'Uma garrafa de vodka em 10 minutos? Não passa.',
      'Aprovada ou não, toda proposta fica gravada no banco.',
    ],
    entonacao: 'Leve provocação na primeira frase. "Não passa" seco, com um toque de humor.',
    marcos: [
      marco('titulo', 0.0, 'Título sendo digitado'),
      marco('custo', 6.7, 'Destaque no custo: 20 CP'),
      marco('clique-enviar', 8.6, 'Clique em "Enviar para a moderação"'),
      marco('aprovado', 10.0, 'Aprovado: o desafio é criado'),
      marco('vodka', 11.0, 'Troca para a proposta da vodka, já enviada'),
      marco('recusa', 14.0, '"Não passou no filtro Moderado" com o motivo da IA'),
      marco('faixa', 15.2, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'moderacao_desafio',
      detalhe: 'aprovada ou recusada, toda proposta é gravada; a recusada não vira linha em desafio',
      regra: 'RN28',
    },
  },
  {
    numero: 4,
    id: 'aceitar',
    entrada: 'slide',
    rotulo: '4 · Aceitar e apostar',
    tela:
      'Detalhe do desafio, "Entrar por 20 CP". Luís: Apostador + Vai cumprir. Arthur: Desafiado. Mario: Desafiante + Não vai cumprir. Cada saldo cai de 100 para 80, o pote sobe 20 → 40 → 60 CP, e o status vai de Aberto para Em andamento.',
    fala:
      'O Luís aposta a favor, o Arthur aceita como desafiado e o Mario fica contra. A cada aceite, vinte cê pê saem da carteira e ficam retidos no desafio. [pause] É a procedure de débito em garantia: pote de sessenta, e calote nenhum.',
    legendas: [
      'O Luís aposta a favor, o Arthur aceita como desafiado e o Mario fica contra.',
      'A cada aceite, 20 CP saem da carteira e ficam retidos no desafio.',
      'É a procedure de débito em garantia: pote de 60, e calote nenhum.',
    ],
    entonacao: 'Três batidas na primeira frase, uma por pessoa. "Calote nenhum" com leve humor.',
    marcos: [
      marco('luis', 0.6, 'Luís entra como apostador: 100 → 80, pote 0 → 20'),
      marco('arthur', 2.6, 'Arthur entra como desafiado: pote 20 → 40'),
      marco('mario', 4.8, 'Mario entra como desafiante: pote 40 → 60'),
      marco('andamento', 6.0, 'Status muda de Aberto para Em andamento'),
      marco('retido', 7.4, 'Zoom no pote: 60 CP retidos'),
      marco('faixa', 12.6, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'CALL debitar_escrow(...)',
      detalhe: 'debita o membro e credita o desafio na mesma transação: o CP fica retido até o resultado',
      regra: 'RN18',
    },
  },
  {
    numero: 5,
    id: 'prova',
    entrada: 'fade',
    rotulo: '5 · Enviar a prova',
    tela:
      'Celular do Arthur (390x844). Desafio Em andamento, "Enviar a prova", Foto, "Escolher foto": o print da corrida. "Mandar para o júri". O status vai para Em votação e o cartão da prova lista o júri: Luís, Octávio e Rafael.',
    fala:
      'O Arthur corre e manda a prova pelo celular: o print do aplicativo de corrida. [pause] Nesse instante, o júri congela: Luís, Octávio e Rafael. Quem está no duelo não julga, e quem entrar no grupo depois não vota.',
    legendas: [
      'O Arthur corre e manda a prova pelo celular: o print do aplicativo de corrida.',
      'Nesse instante, o júri congela: Luís, Octávio e Rafael.',
      'Quem está no duelo não julga, e quem entrar no grupo depois não vota.',
    ],
    entonacao: 'Narrativa, um pouco mais leve. Destaque calmo em "o júri congela".',
    marcos: [
      marco('foto', 2.2, '"Escolher foto": o print da corrida aparece'),
      marco('clique-mandar', 5.4, 'Clique em "Mandar para o júri"'),
      marco('juri', 7.4, 'Status Em votação; cartão da prova com os três jurados'),
      marco('faixa', 11.0, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'evidencia + jurado_evidencia',
      detalhe: 'o júri é gravado no envio da prova; desafiante e desafiado ficam de fora',
      regra: 'RN14',
    },
  },
  {
    numero: 6,
    id: 'julgar',
    entrada: 'corte',
    rotulo: '6 · Julgar',
    tela:
      'Celular do Luís, aba Votação. Cartão "Arthur diz que cumpriu", "O que vale", a foto, "Faltam 2 votos para fechar… 2 de 3 jurados", prazo e "+2 CP para quem votar". Clique em "Vale", "Confirmar voto", e o diálogo "Voto registrado: falta 1 voto".',
    fala:
      'Na votação, o júri vê a prova e o que vale como cumprido. Com três jurados, o quórum é dois: metade mais um. O Luís vota: vale. [pause] Cada jurado tem um voto só, e quem garante é a chave primária.',
    legendas: [
      'Na votação, o júri vê a prova e o que vale como cumprido.',
      'Com 3 jurados, o quórum é 2: metade mais um.',
      'O Luís vota: vale.',
      'Cada jurado tem um voto só, e quem garante é a chave primária.',
    ],
    entonacao: 'Didática em "metade mais um". "Vale" curto, sem festa: a festa é no próximo capítulo.',
    marcos: [
      marco('o-que-vale', 1.4, 'Zoom em "O que vale" e na foto'),
      marco('quorum', 5.0, 'Zoom em "Fecha quando um lado chegar a 2 de 3 jurados"'),
      marco('clique-vale', 9.0, 'Clique em "Vale"'),
      marco('clique-confirmar', 10.0, 'Clique em "Confirmar voto"'),
      marco('registrado', 10.6, '"Voto registrado": falta 1 voto'),
      marco('faixa', 11.6, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'pk_jurado_evidencia (id_evidencia, id_usuario)',
      detalhe: 'um voto por jurado; quórum = ⌊3/2⌋ + 1 = 2 sobre o júri congelado',
      regra: 'RN04 · RN15',
    },
  },
  {
    numero: 7,
    id: 'apurar',
    entrada: 'corte',
    rotulo: '7 · Apurar e pagar',
    tela:
      'Tela dividida: à esquerda o celular do Luís, à direita o navegador do Octávio em Votação. O placar do Octávio vai de 0 para 1 sem recarregar: "Seu voto fecha o júri." O Octávio clica em "Vale" e "Confirmar voto": "Júri fechou: vale!", com Arthur +30, Luís +30, Mario perdeu 20 CP, "Você, pelo voto +2 CP" e "Apurado e pago pelo banco numa transação só".',
    fala:
      'Na tela do Octávio, o placar sobe sozinho. O voto seguinte fecha o júri: vale! [pause] Numa única transação, a procedure de apuração aceita a prova, paga o pote e dá dois cê pê a quem votou. O aviso ao vivo só sai depois do commit.',
    legendas: [
      'Na tela do Octávio, o placar sobe sozinho.',
      'O voto seguinte fecha o júri: vale!',
      'Numa única transação, a procedure de apuração aceita a prova, paga o pote e dá 2 CP a quem votou.',
      'O aviso ao vivo só sai depois do commit.',
    ],
    entonacao: 'O clímax, mas contido: um pouco mais de energia em "vale!". A frase da transação volta ao tom calmo e claro.',
    marcos: [
      marco('ao-vivo', 1.0, 'Placar do Octávio vai de 0 para 1 sem recarregar'),
      marco('clique-vale', 3.8, 'Octávio clica em "Vale"'),
      marco('clique-confirmar', 4.8, 'Clique em "Confirmar voto"'),
      marco('carimbo', 6.0, '"Júri fechou: vale!" com o selo'),
      marco('pagamento', 7.4, 'Arthur +30, Luís +30, Mario perdeu 20; "+2 CP" pelo voto'),
      marco('faixa', 8.2, 'Faixa do banco entra'),
      marco('transacao', 12.0, 'Destaque em "Apurado e pago pelo banco numa transação só"'),
    ],
    faixaBanco: {
      objeto: 'CALL apurar_votacao(...)',
      detalhe: 'prova ACEITA, pote pago e +2 por voto numa transação; o SignalR só avisa depois do COMMIT',
      regra: 'RN15 · RN17 · RN23',
    },
  },
  {
    numero: 8,
    id: 'ranking',
    entrada: 'slide',
    rotulo: '8 · Ranking e perfil',
    tela:
      'Ranking da Banca do A3: pódio Luís 112, Arthur 110, Octávio 102; abaixo Rafael 100 e Mario 80. Depois, o Perfil do Arthur (e-mail fictício): 110 CP no grupo e o extrato: +100 crédito de entrada, −20 entrada no desafio, +30 prêmio.',
    fala:
      'No ranking, o Luís lidera com cento e doze cê pê. No perfil do Arthur, o extrato conta a história: cem de entrada, vinte no desafio, trinta de prêmio. [pause] É um livro-caixa que só aceita lançamento novo, e as visões de conferência voltam vazias.',
    legendas: [
      'No ranking, o Luís lidera com 112 CP.',
      'No perfil do Arthur, o extrato conta a história: 100 de entrada, 20 no desafio, 30 de prêmio.',
      'É um livro-caixa que só aceita lançamento novo, e as views de conferência voltam vazias.',
    ],
    entonacao: 'Fechamento tranquilo. Os três números do extrato em ritmo de lista.',
    marcos: [
      marco('podio', 0.0, 'Pódio com os saldos rolando: 112, 110, 102'),
      marco('perfil', 4.6, 'Perfil do Arthur: 110 CP no grupo'),
      marco('extrato', 7.6, 'Extrato: +100, −20, +30 entram um a um'),
      marco('faixa', 12.4, 'Faixa do banco entra'),
    ],
    faixaBanco: {
      objeto: 'transacao_cp · vw_reconciliacao_saldo · vw_escrow_orfao',
      detalhe: 'UPDATE e DELETE bloqueados por trigger; as duas views voltam com 0 linhas',
      regra: 'RN24',
    },
  },
  {
    numero: 9,
    id: 'proximo',
    entrada: 'fade',
    rotulo: 'A regra mora no banco',
    tela: 'Volta ao logo. Texto "A regra mora no banco".',
    fala: 'Do primeiro acesso ao pagamento, cada regra é garantida pelo banco.',
    legendas: ['Do primeiro acesso ao pagamento, cada regra é garantida pelo banco.'],
    entonacao: 'Fechamento calmo e firme, ecoando a frase da abertura. Sem tom de anúncio.',
    marcos: [marco('fecho', 0.0, '"A regra mora no banco" aparece')],
    faixaBanco: null,
    duracaoMinimaSegundos: 8,
  },
];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export const cenas: Cena[] = base.map((cena) => ({
  ...cena,
  arquivoAudio: `demonstracao/audio/${doisDigitos(cena.numero)}-${cena.id}.mp3`,
  palavras: contarPalavras(cena.fala),
  duracaoEstimadaSegundos: estimarFala(cena.fala),
}));

/** Duração da cena com a fala estimada: atraso, fala e cauda, ou o mínimo. */
export const duracaoCenaSegundos = (cena: Cena, falaSegundos = cena.duracaoEstimadaSegundos) =>
  Math.max(cena.duracaoMinimaSegundos ?? 0, ATRASO_FALA_SEGUNDOS + falaSegundos + CAUDA_SEGUNDOS);

/** Sobreposição entre cenas na transição (fade ou slide). */
export const TRANSICAO_SEGUNDOS = 0.6;

/** Duração do vídeo inteiro: soma das cenas menos as sobreposições (o corte seco não sobrepõe). */
export const duracaoTotalSegundos = (falas: (number | null)[] = []) =>
  cenas.reduce(
    (soma, cena, i) =>
      soma + duracaoCenaSegundos(cena, falas[i] ?? undefined) - (i > 0 && cena.entrada !== 'corte' ? TRANSICAO_SEGUNDOS : 0),
    0,
  );
