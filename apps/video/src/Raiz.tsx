import { Composition } from 'remotion';
import { Demo, duracaoDemo } from './Demo';
import { FPS } from './tema';

export const Raiz = () => (
  <Composition
    id="Demo"
    component={Demo}
    durationInFrames={duracaoDemo}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
