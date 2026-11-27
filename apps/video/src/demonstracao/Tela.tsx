// A "tela" de cada capítulo: capturas reais trocando no marco certo, dentro de
// uma moldura de navegador ou de celular, com câmera (zoom de 1,0 a 1,2 e o
// resto escurecido), cursor de trajetória curva e onda de clique.
//
// Toda coordenada que entra aqui (alvo, cursor, digitação) está em px de CSS da
// página capturada; `k` (px da moldura ÷ px de CSS) converte para o vídeo.
import type { CSSProperties } from 'react';
import { Easing, Img, interpolate, useCurrentFrame } from 'remotion';
import { cor, fonteTexto, s, sombra } from '../tema';
import { arquivoCaptura, CELULAR, DESKTOP, type Caixa, type NomeCaptura } from './capturas';

/** A partir do quadro `f`, a tela mostra `captura`. */
export type Plano = { f: number; captura: NomeCaptura };
/** A partir de `f`, a câmera vai até `alvo` (ou volta ao quadro inteiro). */
export type Foco = { f: number; alvo: Caixa | null; zoom?: number };
/** O cursor chega a (x, y) no quadro `f`; com `clique`, clica ali. */
export type Parada = { f: number; x: number; y: number; clique?: boolean };
/** Texto digitado num campo da captura, de `f` até `ate` (quando a captura já preenchida assume). */
export type Digitacao = { f: number; ate: number; caixa: Caixa; texto: string; porSegundo?: number; fonte?: number };

const TROCA = 6;
const MOVIMENTO = s(0.8);
const VIAGEM = s(0.9);
const ZOOM = 1.2;
const ESCURO = 0.3;
const ONDA = 14;

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const misturar = (a: number, b: number, p: number) => a + (b - a) * p;

type Estado = { cx: number; cy: number; z: number; caixa: Caixa | null; escuro: number };

const misturarCaixa = (a: Caixa | null, b: Caixa | null, p: number): Caixa | null => {
  if (!a || !b) return b ?? a;
  return { x: misturar(a.x, b.x, p), y: misturar(a.y, b.y, p), w: misturar(a.w, b.w, p), h: misturar(a.h, b.h, p) };
};

const misturarEstado = (a: Estado, b: Estado, p: number): Estado => ({
  cx: misturar(a.cx, b.cx, p),
  cy: misturar(a.cy, b.cy, p),
  z: misturar(a.z, b.z, p),
  caixa: misturarCaixa(a.caixa, b.caixa, p),
  escuro: misturar(a.escuro, b.escuro, p),
});

const FOLGA = 8;

/**
 * Zoom pedido (1,2 por padrão), reduzido até o alvo inteiro, com a folga do
 * destaque, caber na tela. No celular, um alvo da largura da tela fica perto de 1.
 */
const zoomQueCabe = (foco: Foco, cssW: number, cssH: number) => {
  const alvo = foco.alvo!;
  const cabe = Math.min(cssW / (alvo.w + FOLGA * 2 + 12), cssH / (alvo.h + FOLGA * 2 + 12));
  return Math.max(1, Math.min(foco.zoom ?? ZOOM, cabe));
};

/** Estado da câmera no quadro: cada foco parte de onde a câmera estava, com ease out. */
const camera = (focos: Foco[], frame: number, cssW: number, cssH: number): Estado => {
  const inicial: Estado = { cx: cssW / 2, cy: cssH / 2, z: 1, caixa: null, escuro: 0 };
  const progresso = (t: number) => Easing.out(Easing.cubic)(limitar(t / MOVIMENTO, 0, 1));
  let de = inicial;
  let para = inicial;
  let t0 = 0;
  for (const foco of focos) {
    if (frame < foco.f) break;
    de = misturarEstado(de, para, progresso(foco.f - t0));
    para = foco.alvo
      ? { cx: foco.alvo.x + foco.alvo.w / 2, cy: foco.alvo.y + foco.alvo.h / 2, z: zoomQueCabe(foco, cssW, cssH), caixa: foco.alvo, escuro: 1 }
      : { ...inicial, caixa: de.caixa };
    t0 = foco.f;
  }
  return misturarEstado(de, para, progresso(frame - t0));
};

/** Ponto numa curva suave entre a e b (Bézier quadrática, controle deslocado para o lado). */
const curva = (a: { x: number; y: number }, b: { x: number; y: number }, t: number, lado: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = (a.x + b.x) / 2 - dy * 0.22 * lado;
  const cy = (a.y + b.y) / 2 + dx * 0.22 * lado;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
};

const posicaoCursor = (paradas: Parada[], frame: number) => {
  if (frame <= paradas[0].f) return paradas[0];
  for (let i = 1; i < paradas.length; i++) {
    const a = paradas[i - 1];
    const b = paradas[i];
    if (frame > b.f) continue;
    const partida = Math.max(a.f, b.f - VIAGEM);
    const t = Easing.inOut(Easing.cubic)(limitar((frame - partida) / Math.max(1, b.f - partida), 0, 1));
    return curva(a, b, t, i % 2 === 0 ? 1 : -1);
  }
  return paradas[paradas.length - 1];
};

const Onda = ({ t, tamanho }: { t: number; tamanho: number }) => (
  <div
    style={{
      position: 'absolute',
      left: -tamanho * t,
      top: -tamanho * t,
      width: tamanho * 2 * t,
      height: tamanho * 2 * t,
      borderRadius: '50%',
      border: `3px solid ${cor.primaria}`,
      background: 'rgba(68, 51, 204, 0.12)',
      opacity: 1 - t,
    }}
  />
);

/** Cursor do mouse (navegador): visível o tempo todo entre `paradas[0].f` e `some`. */
const Cursor = ({ paradas, k, z, some }: { paradas: Parada[]; k: number; z: number; some?: number }) => {
  const frame = useCurrentFrame();
  const p = posicaoCursor(paradas, frame);
  const visivel =
    interpolate(frame, [paradas[0].f, paradas[0].f + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    (some === undefined ? 1 : interpolate(frame, [some, some + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  if (visivel <= 0) return null;
  const clique = paradas.find((q) => q.clique && frame >= q.f && frame < q.f + ONDA);
  const apertado = clique && frame < clique.f + 5 ? 0.86 : 1;
  return (
    <div style={{ position: 'absolute', left: p.x * k, top: p.y * k, opacity: visivel, transform: `scale(${1 / z})`, transformOrigin: '0 0' }}>
      {clique && <Onda t={(frame - clique.f) / ONDA} tamanho={34} />}
      <svg
        width="30"
        height="36"
        viewBox="0 0 17 20"
        style={{ position: 'absolute', left: -2, top: -2, transform: `scale(${apertado})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' }}
      >
        <path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill={cor.texto} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Toque do dedo (celular): aparece pouco antes de cada toque e some depois da onda. */
const Toque = ({ paradas, k, z }: { paradas: Parada[]; k: number; z: number }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {paradas
        .filter((q) => frame >= q.f - 10 && frame < q.f + ONDA + 4)
        .map((q) => {
          const opacidade = interpolate(frame, [q.f - 10, q.f - 4, q.f + ONDA - 2, q.f + ONDA + 4], [0, 1, 1, 0]);
          const t = (frame - q.f) / ONDA;
          return (
            <div key={q.f} style={{ position: 'absolute', left: q.x * k, top: q.y * k, transform: `scale(${1 / z})`, opacity: opacidade }}>
              {t >= 0 && t < 1 && <Onda t={t} tamanho={40} />}
              <div
                style={{
                  position: 'absolute',
                  left: -22,
                  top: -22,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(23, 19, 54, 0.28)',
                  border: '3px solid rgba(255,255,255,0.9)',
                  transform: `scale(${t >= 0 && t < 0.3 ? 0.85 : 1})`,
                }}
              />
            </div>
          );
        })}
    </>
  );
};

/** Texto entrando num campo da captura, com a máscara sobre o placeholder e o anel de foco. */
const Digitando = ({ d, k }: { d: Digitacao; k: number }) => {
  const frame = useCurrentFrame();
  if (frame < d.f || frame >= d.ate + TROCA) return null;
  const n = Math.floor(((frame - d.f) / 30) * (d.porSegundo ?? 14));
  const cursorPisca = Math.floor((frame - d.f) / 12) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: (d.caixa.x + 1.5) * k,
        top: (d.caixa.y + 1.5) * k,
        width: (d.caixa.w - 3) * k,
        height: (d.caixa.h - 3) * k,
        borderRadius: 9 * k,
        background: '#fff',
        boxShadow: `0 0 0 ${2 * k}px ${cor.primaria}, 0 0 0 ${5 * k}px rgba(68, 51, 204, 0.18)`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12 * k,
        fontFamily: fonteTexto,
        fontSize: (d.fonte ?? 16) * k,
        color: cor.texto,
        whiteSpace: 'pre',
        overflow: 'hidden',
      }}
    >
      {d.texto.slice(0, n)}
      <span style={{ width: 1.5 * k, height: 18 * k, marginLeft: 1, background: cursorPisca ? cor.texto : 'transparent' }} />
    </div>
  );
};

type PropsTela = {
  planos: Plano[];
  focos?: Foco[];
  cursor?: Parada[];
  /** Quadro em que o cursor some (o mouse sai de cena). */
  cursorSome?: number;
  digitacoes?: Digitacao[];
};

/** Área da captura: troca de planos, câmera, destaque, digitação e cursor. */
const TelaCaptura = ({ W, H, cssW, cssH, toque, planos, focos = [], cursor, cursorSome, digitacoes = [] }: PropsTela & {
  W: number; H: number; cssW: number; cssH: number; toque: boolean;
}) => {
  const frame = useCurrentFrame();
  const k = W / cssW;
  const cam = camera(focos, frame, cssW, cssH);
  const tx = limitar(W / 2 - cam.z * cam.cx * k, W - cam.z * W, 0);
  const ty = limitar(H / 2 - cam.z * cam.cy * k, H - cam.z * H, 0);
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: cor.fundo }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${cam.z})`, transformOrigin: '0 0' }}>
        {planos.map((plano, i) => {
          const proximo = planos[i + 1];
          if (i > 0 && frame < plano.f) return null;
          if (proximo && frame >= proximo.f + TROCA) return null;
          const opacidade = i === 0 ? 1 : interpolate(frame, [plano.f, plano.f + TROCA], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <Img
              key={`${plano.captura}-${plano.f}`}
              src={arquivoCaptura(plano.captura)}
              style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: opacidade }}
            />
          );
        })}
        {digitacoes.map((d) => (
          <Digitando key={d.f} d={d} k={k} />
        ))}
        {cam.caixa && cam.escuro > 0.01 && (
          <div
            style={{
              position: 'absolute',
              left: (cam.caixa.x - FOLGA) * k,
              top: (cam.caixa.y - FOLGA) * k,
              width: (cam.caixa.w + FOLGA * 2) * k,
              height: (cam.caixa.h + FOLGA * 2) * k,
              borderRadius: 12 * k,
              boxShadow: `0 0 0 ${2.5 / cam.z}px rgba(68, 51, 204, ${0.85 * cam.escuro}), 0 0 0 4000px rgba(13, 11, 28, ${ESCURO * cam.escuro})`,
            }}
          />
        )}
        {cursor && (toque ? <Toque paradas={cursor} k={k} z={cam.z} /> : <Cursor paradas={cursor} k={k} z={cam.z} some={cursorSome} />)}
      </div>
    </div>
  );
};

const BARRA = 40;

/** Altura total da moldura de navegador para uma largura. */
export const alturaNavegador = (largura: number) => BARRA + (largura * DESKTOP.altura) / DESKTOP.largura;

/** Moldura de navegador (desktop, 1440x900). */
export const Navegador = ({ largura, style, ...tela }: PropsTela & { largura: number; style?: CSSProperties }) => {
  const H = (largura * DESKTOP.altura) / DESKTOP.largura;
  return (
    <div
      style={{
        position: 'absolute',
        width: largura,
        borderRadius: 14,
        overflow: 'hidden',
        background: cor.superficie,
        boxShadow: `0 0 0 1px ${cor.borda}, ${sombra}`,
        ...style,
      }}
    >
      <div style={{ height: BARRA, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: cor.superficieAlta, borderBottom: `1px solid ${cor.borda}` }}>
        {['#e0796b', '#e6bf5a', '#7cbf7a'].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <div
          style={{
            margin: '0 auto',
            padding: '4px 22px',
            borderRadius: 8,
            background: cor.superficie,
            fontFamily: fonteTexto,
            fontSize: 15,
            fontWeight: 500,
            color: cor.textoSuave,
          }}
        >
          Eu Duvido!
        </div>
        <span style={{ width: 52 }} />
      </div>
      <TelaCaptura W={largura} H={H} cssW={DESKTOP.largura} cssH={DESKTOP.altura} toque={false} {...tela} />
    </div>
  );
};

const BORDA_CELULAR = 12;

/** Largura total da moldura de celular para uma altura. */
export const larguraCelular = (altura: number) => ((altura - BORDA_CELULAR * 2) * CELULAR.largura) / CELULAR.altura + BORDA_CELULAR * 2;

/** Moldura de celular (390x844). */
export const Celular = ({ altura, style, ...tela }: PropsTela & { altura: number; style?: CSSProperties }) => {
  const H = altura - BORDA_CELULAR * 2;
  const W = (H * CELULAR.largura) / CELULAR.altura;
  return (
    <div
      style={{
        position: 'absolute',
        padding: BORDA_CELULAR,
        borderRadius: 54,
        background: cor.tinta,
        boxShadow: `0 0 0 2px #2c2945, ${sombra}`,
        ...style,
      }}
    >
      <div style={{ borderRadius: 42, overflow: 'hidden' }}>
        <TelaCaptura W={W} H={H} cssW={CELULAR.largura} cssH={CELULAR.altura} toque {...tela} />
      </div>
    </div>
  );
};
