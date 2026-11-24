import { Composition } from 'remotion';
import { Demo, montarLinha, type PropsDemo } from './Demo';
import { FPS } from './tema';

// A duração depende de quais clipes filmados já existem (ver montarLinha).
export const Raiz = () => (
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
);
