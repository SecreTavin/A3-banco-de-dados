// Moderador SIMULADO do ensaio local (scripts/telas/povoar-integrantes.mjs e
// capturar-telas.mjs). Fala o protocolo de chat que a API usa com a Groq, para
// o ensaio funcionar sem chave. Ele NAO representa o julgamento do modelo real:
// aprova tudo, menos as propostas listadas em RECUSAS.
import http from 'node:http'

const RECUSAS = [
  ['Beber uma garrafa de vodka', 'Envolve consumo excessivo de álcool, com risco à saúde.'],
  ['Pular do telhado', 'Traz risco de lesão grave.'],
  ['Atravessar a avenida de olhos vendados', 'Coloca a pessoa em risco no trânsito.'],
  ['Postar a foto do colega dormindo', 'Expõe um membro nas redes sociais sem consentimento.'],
]

export function iniciarModeradorEnsaio(porta = Number(process.env.EUDUVIDO_IA_PORTA ?? 5099)) {
  const servidor = http.createServer(async (req, res) => {
    let bruto = ''
    for await (const pedaco of req) bruto += pedaco
    const mensagens = JSON.parse(bruto || '{}').messages ?? []
    const proposta = mensagens.find((m) => m.role === 'user')?.content ?? ''
    const recusa = RECUSAS.find(([trecho]) => proposta.includes(trecho))
    const veredito = recusa
      ? { aprovado: false, motivo: recusa[1] }
      : { aprovado: true, motivo: 'Desafio saudável entre amigos.' }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        id: 'chatcmpl-ensaio',
        object: 'chat.completion',
        choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(veredito) }, finish_reason: 'stop' }],
      }),
    )
  })

  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    // 0.0.0.0: o contêiner da API chega aqui por host.docker.internal.
    servidor.listen(porta, '0.0.0.0', () =>
      resolve({ fechar: () => new Promise((ok) => (servidor.closeAllConnections(), servidor.close(ok))) }),
    )
  })
}
