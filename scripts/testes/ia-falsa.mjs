// Provedor de IA SIMULADO para testar a moderacao de desafios (RN28, ADR 0015).
//
// Fala o mesmo protocolo que a API usa com a Groq: POST {BaseUrl}/chat/completions,
// formato de chat da OpenAI. Serve para provar que a APLICACAO integra bem com um
// provedor que cumpre o contrato (aprova, recusa, cai, demora, rejeita a chave).
// Ele NAO diz nada sobre o comportamento do modelo real da Groq.
//
// O veredito vem de marcadores no titulo ou na descricao da proposta:
//
//   [RECUSAR]    recusa, com motivo
//   [RISCO]      aprova so no nivel LEVE; MODERADO e PESADO recusam (mostra que o
//                nivel de filtro do grupo chega ao prompt)
//   [ERRO]       responde HTTP 500
//   [LENTO]      demora mais que o timeout da API (EUDUVIDO_IA_ATRASO_MS)
//   [LIXO]       responde texto sem o JSON combinado
//   [PENSANDO]   responde <think>...</think> e o JSON dentro de uma cerca ```json
//   (nenhum)     aprova
//
// Cada requisicao recebida fica em `requisicoes`, para o teste conferir o que a
// aplicacao mandou (modelo, chave, nivel de filtro, texto).
//
// Uso isolado:   node scripts/testes/ia-falsa.mjs [porta]
// Uso no roteiro: import { iniciarIaFalsa } from './ia-falsa.mjs'
import http from 'node:http'
import { pathToFileURL } from 'node:url'

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function iniciarIaFalsa({ porta = 5099, chave = 'chave-de-teste', atrasoLentoMs = 6000 } = {}) {
  const estado = { chave, atrasoLentoMs, requisicoes: [] }

  const servidor = http.createServer(async (req, res) => {
    const responder = (status, corpo) => {
      if (res.writableEnded || res.destroyed) return
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(corpo))
    }
    const completar = (modelo, conteudo) =>
      responder(200, {
        id: 'chatcmpl-simulado',
        object: 'chat.completion',
        model: modelo,
        choices: [{ index: 0, message: { role: 'assistant', content: conteudo }, finish_reason: 'stop' }],
      })

    const caminho = new URL(req.url, 'http://x').pathname
    if (req.method !== 'POST' || !/^\/(v1\/)?chat\/completions$/.test(caminho)) {
      return responder(404, { error: { message: `rota desconhecida: ${req.method} ${caminho}` } })
    }

    let bruto = ''
    for await (const pedaco of req) bruto += pedaco
    let corpo = {}
    try {
      corpo = JSON.parse(bruto)
    } catch {
      /* corpo invalido: segue com objeto vazio e responde 400 abaixo */
    }

    const mensagens = Array.isArray(corpo.messages) ? corpo.messages : []
    const sistema = mensagens.find((m) => m.role === 'system')?.content ?? ''
    const usuario = mensagens.find((m) => m.role === 'user')?.content ?? ''
    const nivel = /Nível de filtro deste grupo: (\w+)\./.exec(sistema)?.[1] ?? null
    const proposta = /<desafio>\nTitulo: ([^\n]*)\nDescricao: ([\s\S]*)\n<\/desafio>/.exec(usuario)
    const titulo = proposta?.[1] ?? null
    const descricao = proposta?.[2] ?? null
    const texto = `${titulo ?? ''}\n${descricao ?? ''}`

    const registro = {
      hora: new Date().toISOString(),
      caminho,
      autorizacao: req.headers.authorization ?? null,
      modelo: corpo.model ?? null,
      temperatura: corpo.temperature ?? null,
      stream: corpo.stream ?? null,
      papeis: mensagens.map((m) => m.role),
      nivel,
      titulo,
      descricao,
      conteudoUsuario: usuario,
      veredito: null,
    }
    estado.requisicoes.push(registro)

    if (req.headers.authorization !== `Bearer ${estado.chave}`) {
      registro.veredito = 'chave-rejeitada'
      return responder(401, { error: { message: 'Invalid API Key', type: 'invalid_request_error' } })
    }
    if (!proposta) {
      registro.veredito = 'corpo-invalido'
      return responder(400, { error: { message: 'mensagem do usuario fora do formato esperado' } })
    }

    const aprovar = (motivo) => JSON.stringify({ aprovado: true, motivo })
    const recusar = (motivo) => JSON.stringify({ aprovado: false, motivo })
    const modelo = corpo.model ?? 'modelo-simulado'

    if (texto.includes('[ERRO]')) {
      registro.veredito = 'erro-500'
      return responder(500, { error: { message: 'falha simulada do provedor' } })
    }
    if (texto.includes('[LENTO]')) {
      registro.veredito = 'lento'
      await dormir(estado.atrasoLentoMs)
      return completar(modelo, aprovar('Resposta tardia (provedor simulado).'))
    }
    if (texto.includes('[LIXO]')) {
      registro.veredito = 'fora-do-formato'
      return completar(modelo, 'Desculpe, não consigo ajudar com isso.')
    }
    if (texto.includes('[PENSANDO]')) {
      registro.veredito = 'aprovado-com-raciocinio'
      return completar(
        modelo,
        `<think>vou avaliar com calma</think>\n\`\`\`json\n${aprovar('Aprovado depois de pensar (provedor simulado).')}\n\`\`\``,
      )
    }
    if (texto.includes('[RECUSAR]')) {
      registro.veredito = 'recusado'
      return completar(modelo, recusar('Recusado pelo provedor simulado: a proposta traz o marcador [RECUSAR].'))
    }
    if (texto.includes('[RISCO]')) {
      if (nivel === 'LEVE') {
        registro.veredito = 'aprovado'
        return completar(modelo, aprovar('Risco tolerado no nível LEVE (provedor simulado).'))
      }
      registro.veredito = 'recusado'
      return completar(modelo, recusar(`Risco físico incompatível com o nível ${nivel} (provedor simulado).`))
    }

    registro.veredito = 'aprovado'
    return completar(modelo, aprovar('Desafio saudável (provedor simulado).'))
  })

  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    // 0.0.0.0: o contêiner da API chega aqui por host.docker.internal.
    servidor.listen(porta, '0.0.0.0', () =>
      resolve({
        estado,
        porta,
        requisicoes: estado.requisicoes,
        fechar: () => new Promise((ok) => (servidor.closeAllConnections(), servidor.close(ok))),
      }),
    )
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const porta = Number(process.argv[2] ?? process.env.EUDUVIDO_IA_PORTA ?? 5099)
  const ia = await iniciarIaFalsa({ porta, atrasoLentoMs: Number(process.env.EUDUVIDO_IA_ATRASO_MS ?? 6000) })
  console.log(`Provedor de IA simulado em http://0.0.0.0:${ia.porta}/v1 (chave: ${ia.estado.chave})`)
  let vistas = 0
  setInterval(() => {
    for (const r of ia.requisicoes.slice(vistas)) {
      console.log(`${r.hora} nivel=${r.nivel} veredito=${r.veredito} titulo="${r.titulo}"`)
    }
    vistas = ia.requisicoes.length
  }, 500)
}
