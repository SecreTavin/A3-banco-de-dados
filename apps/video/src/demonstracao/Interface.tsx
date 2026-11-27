// O que fica em volta da tela: coluna com o rótulo do passo e o painel de
// valores, a faixa "O que o banco garante", as legendas e a barra de progresso.
//
// Layout (1920x1080), para nada cobrir a interface:
//   y 40–793    capturas (moldura de navegador ou celular), à direita da coluna
//   y 806–898   faixa do banco
//   y 912–996   legendas (até duas linhas)
//   y 1008–1056 barra de progresso
import type { ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { contagem, Surgir, useMola } from '../ui';
import { cor, fonteMono, fonteTexto, fonteTitulo } from '../tema';
import { ATRASO_FALA, type Linha } from './linha';
import type { FaixaBanco } from './cenas';

export const AREA = { topo: 40, base: 793 } as const;
export const MARGEM = 80;

const limite = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Rótulo do passo ("3 · Criar desafio"), de quem é a tela e o painel do capítulo. */
export const Coluna = ({ rotulo, conta, largura, children }: { rotulo: string; conta: string; largura: number; children?: ReactNode }) => {
  const [numero, titulo] = rotulo.split(' · ');
  return (
    <div style={{ position: 'absolute', left: MARGEM, top: AREA.topo + 24, width: largura, fontFamily: fonteTexto, color: cor.texto }}>
      <Surgir>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 58,
              height: 58,
              borderRadius: 18,
              background: cor.primaria,
              color: '#fff',
              fontFamily: fonteTitulo,
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            {numero}
          </span>
          <span style={{ fontFamily: fonteTitulo, fontWeight: 600, fontSize: 22, letterSpacing: 2, color: cor.primaria, textTransform: 'uppercase' }}>
            Passo {numero} de 8
          </span>
        </div>
      </Surgir>
      <Surgir inicio={4}>
        <h1 style={{ margin: '20px 0 0', fontFamily: fonteTitulo, fontWeight: 800, fontSize: 62, lineHeight: 1.02, letterSpacing: -1.5 }}>{titulo}</h1>
      </Surgir>
      <Surgir inicio={8}>
        <p style={{ margin: '14px 0 0', fontSize: 24, lineHeight: 1.35, color: cor.textoSuave }}>{conta}</p>
      </Surgir>
      <div style={{ marginTop: 34 }}>{children}</div>
    </div>
  );
};

/** Cartão do painel lateral, com título pequeno. */
export const Painel = ({ titulo, inicio = 0, children }: { titulo: string; inicio?: number; children: ReactNode }) => (
  <Surgir inicio={inicio}>
    <div
      style={{
        background: cor.superficie,
        border: `1px solid ${cor.borda}`,
        borderRadius: 20,
        boxShadow: '0 10px 30px rgba(23, 19, 54, 0.08)',
        padding: '20px 24px',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: cor.textoFraco, marginBottom: 6 }}>
        {titulo}
      </div>
      {children}
    </div>
  </Surgir>
);

/** Linha do painel: rótulo à esquerda e valor à direita, entrando em `inicio`. */
export const Item = ({ inicio = 0, rotulo, apoio, valor }: { inicio?: number; rotulo: ReactNode; apoio?: ReactNode; valor?: ReactNode }) => {
  const p = useMola(inicio);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '9px 0',
        borderTop: `1px solid ${cor.borda}`,
        opacity: p,
        transform: `translateX(${(1 - p) * 24}px)`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.2 }}>{rotulo}</div>
        {apoio && <div style={{ fontSize: 17, color: cor.textoFraco, marginTop: 2 }}>{apoio}</div>}
      </div>
      <div style={{ flex: 'none' }}>{valor}</div>
    </div>
  );
};

/** Pílula dourada de CP. `sinal` mostra + ou − antes do número. */
export const ValorCP = ({ valor, sinal = false, grande = false }: { valor: number; sinal?: boolean; grande?: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 6,
      padding: grande ? '10px 24px' : '5px 14px',
      borderRadius: 999,
      background: cor.cpFundo,
      color: '#2a1b00',
      fontFamily: fonteTitulo,
      fontWeight: 800,
      fontSize: grande ? 46 : 22,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {sinal && valor > 0 ? '+' : ''}
    {valor < 0 ? `−${-valor}` : valor}
    <span style={{ fontSize: grande ? 24 : 15 }}>CP</span>
  </span>
);

/** Número de CP que rola de `de` até `para` a partir de `inicio`. */
export const CPRolando = ({ de, para, inicio, duracao = 24, sinal, grande }: {
  de: number; para: number; inicio: number; duracao?: number; sinal?: boolean; grande?: boolean;
}) => <ValorCP valor={contagem(useCurrentFrame(), de, para, inicio, duracao)} sinal={sinal} grande={grande} />;

/** Selo de status com a cor do app; troca de `antes` para `depois` no quadro `troca`. */
export const Status = ({ antes, depois, troca }: { antes: [string, string]; depois?: [string, string]; troca?: number }) => {
  const frame = useCurrentFrame();
  const mudou = depois && troca !== undefined && frame >= troca;
  const [texto, tom] = mudou ? depois : antes;
  const pulso = mudou ? interpolate(frame, [troca, troca + 6, troca + 14], [1, 1.12, 1], limite) : 1;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        borderRadius: 999,
        fontSize: 20,
        fontWeight: 700,
        color: tom,
        background: `color-mix(in srgb, ${tom} 13%, transparent)`,
        transform: `scale(${pulso})`,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: tom }} />
      {texto}
    </span>
  );
};

export const Mono = ({ children }: { children: ReactNode }) => (
  <span style={{ fontFamily: fonteMono, fontSize: '0.9em', color: cor.primaria }}>{children}</span>
);

/** Faixa "O que o banco garante": entra depois da ação e sai antes do próximo capítulo. */
export const Faixa = ({ faixa, entra, sai }: { faixa: FaixaBanco; entra: number; sai: number }) => {
  const frame = useCurrentFrame();
  const p = useMola(entra, { damping: 200, stiffness: 120 });
  const saida = interpolate(frame, [sai - 10, sai], [1, 0], limite);
  if (frame < entra) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: MARGEM,
        right: MARGEM,
        top: 806,
        height: 92,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: '0 30px',
        borderRadius: 20,
        background: cor.tinta,
        color: '#fff',
        fontFamily: fonteTexto,
        opacity: p * saida,
        transform: `translateY(${(1 - p) * 30 + (1 - saida) * 16}px)`,
        boxShadow: '0 12px 32px rgba(13, 11, 28, 0.25)',
      }}
    >
      <div style={{ flex: 'none', width: 170, fontSize: 15, fontWeight: 700, letterSpacing: 1.8, lineHeight: 1.3, textTransform: 'uppercase', color: cor.cpFundo }}>
        O que o banco garante
      </div>
      <div style={{ width: 2, alignSelf: 'stretch', margin: '18px 0', background: 'rgba(255,255,255,0.14)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fonteMono, fontWeight: 700, fontSize: 27, whiteSpace: 'nowrap' }}>{faixa.objeto}</div>
        <div style={{ marginTop: 4, fontSize: 21, color: cor.tintaSuave, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {faixa.detalhe}
        </div>
      </div>
      <div style={{ flex: 'none', padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>
        {faixa.regra}
      </div>
    </div>
  );
};

/**
 * Legendas queimadas: uma frase por vez, com o tempo da fala dividido pelo
 * número de caracteres de cada frase. A abertura não tem legenda: a frase já é
 * o texto da tela.
 */
export const Legendas = ({ linha }: { linha: Linha }) => {
  const frame = useCurrentFrame();
  for (const c of [...linha.cenas].reverse()) {
    if (c.cena.id === 'abertura') continue;
    const inicio = c.inicio + ATRASO_FALA;
    const fim = c.inicio + c.fimDaFala;
    if (frame < inicio || frame >= fim + 12) continue;
    const total = c.cena.legendas.reduce((soma, l) => soma + l.length, 0);
    let acumulado = 0;
    const faixas = c.cena.legendas.map((texto) => {
      const de = inicio + ((fim - inicio) * acumulado) / total;
      acumulado += texto.length;
      return { texto, de, ate: inicio + ((fim - inicio) * acumulado) / total };
    });
    const atual = faixas.find((f, i) => frame < f.ate || i === faixas.length - 1)!;
    const ultima = atual === faixas[faixas.length - 1];
    const entrada = interpolate(frame, [atual.de, atual.de + 4], [0, 1], limite);
    const opacidade = ultima ? entrada * interpolate(frame, [fim + 6, fim + 12], [1, 0], limite) : entrada;
    return (
      <div style={{ position: 'absolute', left: 160, right: 160, top: 912, height: 84, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth: 1500,
            textAlign: 'center',
            fontFamily: fonteTexto,
            fontWeight: 600,
            fontSize: 31,
            lineHeight: 1.3,
            color: cor.texto,
            opacity: opacidade,
            textWrap: 'balance',
          }}
        >
          {atual.texto}
        </div>
      </div>
    );
  }
  return null;
};

/** Barra de progresso por capítulos (1 a 8), baseada na Capitulos.tsx do trailer. */
export const Progresso = ({ linha }: { linha: Linha }) => {
  const frame = useCurrentFrame();
  const capitulos = linha.cenas.filter((c) => c.cena.numero >= 1 && c.cena.numero <= 8);
  const inicio = capitulos[0].inicio;
  const ultimo = capitulos[capitulos.length - 1];
  const fim = ultimo.inicio + ultimo.duracao;
  const visivel = interpolate(frame, [inicio, inicio + 12, fim - 12, fim], [0, 1, 1, 0], limite);
  if (visivel <= 0) return null;
  const ativo = [...capitulos].reverse().find((c) => frame >= c.inicio);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 1008,
        transform: `translateX(-50%) translateY(${(1 - visivel) * 16}px)`,
        opacity: visivel,
        display: 'flex',
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.94)',
        boxShadow: '0 6px 24px rgba(23,19,54,0.10)',
        fontFamily: fonteTexto,
        whiteSpace: 'nowrap',
      }}
    >
      {capitulos.map((c) => {
        const [numero, titulo] = c.cena.rotulo.split(' · ');
        const eAtivo = c === ativo;
        const passou = frame >= c.inicio + c.duracao;
        const progresso = interpolate(frame, [c.inicio, c.inicio + c.duracao], [0, 1], limite);
        return (
          <div
            key={c.cena.id}
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 17,
              fontWeight: 700,
              color: eAtivo ? cor.primaria : passou ? cor.textoSuave : cor.textoFraco,
              background: eAtivo ? cor.primariaFraca : 'transparent',
            }}
          >
            <span style={{ fontFamily: fonteTitulo, fontWeight: 800 }}>{numero}</span>
            {titulo}
            {eAtivo && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${progresso * 100}%`, background: cor.primaria }} />}
          </div>
        );
      })}
    </div>
  );
};

/** Ícone do app ("?!" no quadrado índigo, como na barra lateral), reconstruído com os tokens. */
export const Logo = ({ tamanho }: { tamanho: number }) => (
  <div
    style={{
      display: 'grid',
      placeItems: 'center',
      width: tamanho,
      height: tamanho,
      borderRadius: tamanho * 0.26,
      background: cor.primaria,
      boxShadow: '0 18px 40px rgba(68, 51, 204, 0.28)',
      fontFamily: fonteTitulo,
      fontWeight: 800,
      fontSize: tamanho * 0.56,
      letterSpacing: -tamanho * 0.04,
      lineHeight: 1,
    }}
  >
    <span>
      <span style={{ color: '#fff' }}>?</span>
      <span style={{ color: cor.cpFundo }}>!</span>
    </span>
  </div>
);
