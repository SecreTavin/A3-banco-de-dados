import { getStaticFiles } from 'remotion';

/**
 * Se um arquivo opcional (clipe, narração, trilha) já está em public/. O vídeo
 * renderiza sem eles e os usa assim que aparecem, sem mudar código.
 */
export const temArquivo = (caminho: string) => getStaticFiles().some((f) => f.name === caminho);
