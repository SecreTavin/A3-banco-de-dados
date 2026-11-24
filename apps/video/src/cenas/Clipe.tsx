import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { temArquivo } from '../arquivos';
import { cor, fonteMono, fonteTexto, fonteTitulo } from '../tema';

export type DadosClipe = {
  arquivo: string;
  titulo: string;
  descricao: string;
  falas?: string[];
};

/**
 * Cena filmada (gravada pelo time ou gerada por IA). Enquanto o arquivo não existe em
 * public/clipes/, mostra uma claquete com o que precisa ser gerado; assim o
 * tempo do vídeo já fica certo antes de o clipe chegar.
 */
export const Clipe = ({ arquivo, titulo, descricao, falas = [] }: DadosClipe) => {
  const caminho = `clipes/${arquivo}`;
  if (temArquivo(caminho)) {
    return (
      <AbsoluteFill style={{ background: '#000' }}>
        <OffthreadVideo src={staticFile(caminho)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: `repeating-linear-gradient(135deg, #161331 0 40px, #1b1740 40px 80px)`,
        color: '#f3efe6',
        fontFamily: fonteTexto,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 1200, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontFamily: fonteMono, fontSize: 24, color: cor.cpFundo }}>CLIPE PENDENTE · public/{caminho}</div>
        <div style={{ fontFamily: fonteTitulo, fontWeight: 800, fontSize: 72, letterSpacing: -2 }}>{titulo}</div>
        <div style={{ fontSize: 32, color: cor.tintaSuave, lineHeight: 1.4 }}>{descricao}</div>
        {falas.map((f) => (
          <div key={f} style={{ fontSize: 34, fontWeight: 700, borderLeft: `6px solid ${cor.cpFundo}`, paddingLeft: 20 }}>{f}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
