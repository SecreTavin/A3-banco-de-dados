// Gera a narração do vídeo com a voz sintética do macOS (`say`), a partir de
// narracao.json: um MP3 por cena em public/narracao/<id>.mp3. Roda só no macOS,
// sem internet e sem chave de API. Para trocar uma fala, edite o JSON e rode de
// novo: npm run narrar
//
// O texto é o que a voz LÊ, então siglas vêm por extenso ou do jeito que se
// pronunciam ("cê pê", "Postgres"). O volume é normalizado para -16 LUFS, o
// padrão de voz em vídeo.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;
const { voz, palavrasPorMinuto, falas } = JSON.parse(readFileSync(join(RAIZ, 'narracao.json'), 'utf8'));
const DESTINO = join(RAIZ, 'public', 'narracao');
mkdirSync(DESTINO, { recursive: true });
const temporaria = mkdtempSync(join(tmpdir(), 'narracao-'));

try {
  for (const [id, texto] of Object.entries(falas)) {
    // WAV PCM: o AIFF padrão do `say` vem compactado, e o ffmpeg do Remotion não o lê.
    const wav = join(temporaria, `${id}.wav`);
    execFileSync('say', ['-v', voz, '-r', String(palavrasPorMinuto), '--file-format=WAVE', '--data-format=LEI16@22050', '-o', wav, texto]);
    execFileSync(
      'npx',
      ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-ar', '44100', '-ac', '1', '-b:a', '128k', join(DESTINO, `${id}.mp3`)],
      { cwd: RAIZ },
    );
    console.log(`ok ${id}.mp3`);
  }
} finally {
  rmSync(temporaria, { recursive: true, force: true });
}
