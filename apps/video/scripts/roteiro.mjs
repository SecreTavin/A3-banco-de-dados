// Gera ELEVENLABS.md a partir de src/demonstracao/cenas.ts, a fonte única do
// vídeo "Demonstracao". Não edite o .md à mão: mude cenas.ts e rode
//
//     npm run roteiro
//
// O Node 22.18+ lê o .ts direto (remove os tipos), por isso cenas.ts não importa
// nada do Remotion.
import { writeFileSync } from 'node:fs';
import {
  ATRASO_FALA_SEGUNDOS,
  CAUDA_SEGUNDOS,
  PALAVRAS_POR_SEGUNDO,
  TRANSICAO_SEGUNDOS,
  cenas,
  duracaoCenaSegundos,
  duracaoTotalSegundos,
} from '../src/demonstracao/cenas.ts';

const DESTINO = new URL('../ELEVENLABS.md', import.meta.url);

const num = (n, casas = 1) => n.toFixed(casas).replace('.', ',');
const minutos = (segundos) => {
  const total = Math.round(segundos);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
const celula = (texto) => texto.replaceAll('|', '\\|');

const arquivo = (cena) => `public/${cena.arquivoAudio}`;
const nomeArquivo = (cena) => cena.arquivoAudio.split('/').pop();

const duracaoTotal = duracaoTotalSegundos();
const falaTotal = cenas.reduce((soma, cena) => soma + cena.duracaoEstimadaSegundos, 0);

const tabela = [
  '| # | Arquivo de saída | Fala estimada | Cena | Texto exato para colar | Entonação |',
  '| --- | --- | --- | --- | --- | --- |',
  ...cenas.map(
    (cena) =>
      `| ${cena.numero} | \`${nomeArquivo(cena)}\` | ${num(cena.duracaoEstimadaSegundos)} s (${cena.palavras} palavras) | ${num(duracaoCenaSegundos(cena))} s | \`${celula(cena.fala)}\` | ${celula(cena.entonacao)} |`,
  ),
].join('\n');

const blocos = cenas
  .map((cena) => {
    const marcos = cena.marcos.map((m) => `| ${num(m.em)} s | ${celula(m.descricao)} |`).join('\n');
    const faixa = cena.faixaBanco
      ? `**Faixa "O que o banco garante":** \`${cena.faixaBanco.objeto}\`: ${cena.faixaBanco.detalhe} (${cena.faixaBanco.regra}).`
      : '**Faixa "O que o banco garante":** nenhuma.';
    return `### ${cena.numero} · \`${cena.id}\` → \`${arquivo(cena)}\`

**Tela:** ${cena.tela}

**Texto para colar** (${cena.palavras} palavras, cerca de ${num(cena.duracaoEstimadaSegundos)} s):

\`\`\`text
${cena.fala}
\`\`\`

**Entonação:** ${cena.entonacao}

| Marco (a partir do início da fala) | O que acontece na tela |
| --- | --- |
${marcos}

${faixa}`;
  })
  .join('\n\n');

const conteudo = `<!-- Gerado por scripts/roteiro.mjs a partir de src/demonstracao/cenas.ts. Não edite à mão: rode npm run roteiro. -->

# Roteiro de áudio do vídeo "Demonstracao" (ElevenLabs)

São ${cenas.length} falas, uma por capítulo, cada uma gerada numa tomada e salva com o
nome da tabela em \`apps/video/public/demonstracao/audio/\`. O vídeo renderiza sem
elas, com as durações estimadas, e se reajusta sozinho quando cada mp3 aparece.

**Duração estimada:** ${minutos(duracaoTotal)} de vídeo, com ${minutos(falaTotal)} de fala. A conta usa
${num(PALAVRAS_POR_SEGUNDO)} palavras por segundo, ${num(ATRASO_FALA_SEGUNDOS)} s de silêncio antes de cada fala,
${num(CAUDA_SEGUNDOS)} s depois e ${num(TRANSICAO_SEGUNDOS)} s de sobreposição em cada transição de fade ou slide (o corte seco não sobrepõe).

## Falas

${tabela}

"Cena" é o tempo do capítulo no vídeo: o silêncio antes, a fala e o silêncio depois.
O respiro do começo e do fim é dado pela linha do tempo, não pelo áudio: não
acrescente pausa nas pontas do texto.

## Configuração recomendada (ponto de partida)

Conferido na documentação do ElevenLabs em 26/11/2026. Os valores são ponto de
partida: ouça o capítulo 3 e ajuste antes de gerar os outros.

**Modelo: Eleven Multilingual v2** (\`eleven_multilingual_v2\`). O texto acima foi escrito
para ele.

| Modelo | Quando usar | Por que não aqui |
| --- | --- | --- |
| **Multilingual v2** | Narração longa e estável. Lista "Portuguese (Brazil)" como variante e aceita \`<break time="0.4s" />\` (até 3 s) | É o recomendado |
| Eleven v3 | Fala expressiva, com tags como \`[calm]\` ou \`[pause]\` | Varia mais de uma geração para outra, e são dez tomadas que precisam soar iguais. Não aceita \`<break>\`: se trocar de modelo, troque cada \`<break .../>\` por reticências |
| Eleven v4 | O mais novo, também com tags de voz | Não aceita SSML nem os controles de Style e Speed. Mesma troca de \`<break>\` do v3 |

**Configurações da voz:**

| Controle | Valor inicial | Por quê |
| --- | --- | --- |
| Stability | **0,65** | Acima do padrão (0,50): numa apresentação formal, vale mais a voz igual nas dez tomadas do que a emoção. Acima de 0,75 tende a ficar monótona |
| Similarity | **0,75** | É o padrão. Valores muito altos podem distorcer o áudio |
| Style | **0** | A documentação recomenda deixar em zero: aumentar deixa o modelo menos estável |
| Speaker Boost | **Ligado** | Aproxima da voz original. Custa latência, que não importa para arquivo gerado |
| Speed | **1,0** | Faixa de 0,7 a 1,2. Se soar corrido, teste 0,95 em todas as falas, nunca em uma só |

**Voz:** na Voice Library, filtre por idioma *Portuguese* e sotaque *Brazilian*, com
uso *Narrative* ou *Educational*. Procure uma voz calma e clara, de colega que
apresenta o trabalho, não de locutor de propaganda. Gere o capítulo 3 com duas ou
três candidatas e escolha uma. Depois, **use a mesma voz e os mesmos valores em todos**.

**Pronúncia:** os números e siglas já estão escritos como devem ser lidos ("cê
pê", "dezesseis", "inteligência artificial"). Se a voz tropeçar numa palavra em
inglês, troque só a palavra e anote aqui:

| Palavra | Se soar errado, tente |
| --- | --- |
| trigger | trígger |
| procedure | procídiur |
| commit | cômit |

## Checklist

- [ ] Abrir o ElevenLabs em *Text to Speech*, modelo **Eleven Multilingual v2**.
- [ ] Escolher a voz brasileira (veja acima) e aplicar as configurações da tabela.
- [ ] Gerar o capítulo 3 (\`03-criar.mp3\`) e ouvir. Ajustar a voz ou a estabilidade antes de seguir.
- [ ] Gerar **um capítulo por vez**, colando o texto do bloco do capítulo sem mudar nada.
- [ ] Ouvir cada tomada inteira. Se errar uma palavra, gerar de novo a fala toda, não um pedaço.
- [ ] Baixar em mp3 e salvar com o nome exato da tabela em \`apps/video/public/demonstracao/audio/\`.
- [ ] Abrir o Studio (\`npm run studio\`, composição **Demonstracao**) e conferir se cada fala casa com a tela.
- [ ] Anotar no registro de IA a voz, o modelo e os valores usados.

## Marcos por capítulo

Os marcos são os momentos em que a animação acontece, contados do início da fala no
ritmo estimado. Quando o mp3 real existe, eles escalam na proporção da duração real.
Para corrigir um marco depois de ouvir, mude o \`ajuste\` dele em \`src/demonstracao/cenas.ts\`.

${blocos}
`;

writeFileSync(DESTINO, conteudo);
console.log(`ok ELEVENLABS.md: ${cenas.length} falas, vídeo estimado em ${minutos(duracaoTotal)}`);
