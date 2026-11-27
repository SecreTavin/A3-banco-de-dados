// Duração guiada pelo áudio. `getAudioDurationInSeconds` (@remotion/media-utils)
// está descontinuada; a documentação do Remotion indica ler os metadados com o
// Mediabunny: https://www.remotion.dev/docs/mediabunny/metadata
//
// O `mediabunny` está fixado na mesma versão que o Remotion 4.0.545 já instala
// (1.66.0), para não haver duas cópias no bundle.
import { ALL_FORMATS, Input, UrlSource } from 'mediabunny';
import { staticFile, type CalculateMetadataFunction } from 'remotion';
import { temArquivo } from '../arquivos';
import { cenas } from './cenas';
import { montarLinha, type PropsDemonstracao } from './linha';

/** Duração, em segundos, de um arquivo de mídia servido pelo Remotion. */
export const duracaoDoAudio = async (src: string) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, { getRetryDelay: () => null }),
  });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

/**
 * Lê a duração real de cada public/demonstracao/audio/NN-id.mp3 que existir.
 * Sem o arquivo, a cena usa a duração estimada de cenas.ts: o vídeo renderiza
 * hoje, sem nenhum mp3, e se ajusta sozinho quando os áudios chegarem.
 */
export const calcularMetadados: CalculateMetadataFunction<PropsDemonstracao> = async ({ props }) => {
  const falas = await Promise.all(
    cenas.map((cena) => (temArquivo(cena.arquivoAudio) ? duracaoDoAudio(staticFile(cena.arquivoAudio)) : null)),
  );
  return { durationInFrames: montarLinha(falas).duracao, props: { ...props, falas } };
};
