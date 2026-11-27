import { Composition } from 'remotion';
import { Demo, montarLinha, type PropsDemo } from './Demo';
import { calcularMetadados } from './demonstracao/audio';
import { Demonstracao } from './demonstracao/Demonstracao';
import type { PropsDemonstracao } from './demonstracao/linha';
import { FPS } from './tema';

export const Raiz = () => (
  <>
    {/* Trailer. A duração depende de quais clipes filmados já existem (ver montarLinha). */}
    <Composition
      id="Demo"
      component={Demo}
      defaultProps={{ claquetes: false } satisfies PropsDemo}
      calculateMetadata={({ props }) => ({ durationInFrames: montarLinha(props).duracao })}
      durationInFrames={1}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* Passeio pelas telas reais. A duração vem dos mp3 da narração, ou da estimativa. */}
    <Composition
      id="Demonstracao"
      component={Demonstracao}
      defaultProps={{ falas: [] } satisfies PropsDemonstracao}
      calculateMetadata={calcularMetadados}
      durationInFrames={1}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
