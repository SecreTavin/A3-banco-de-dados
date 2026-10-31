// O Worker só roda para /api/* e /hubs/* (run_worker_first no wrangler.jsonc);
// o resto é o build do frontend, servido direto como asset. Essas duas rotas
// vão para a API no Docker do Mac, pelo túnel cujo endereço o publicar.sh grava
// em API_ORIGIN (ADR 0019). Mesma origem para o navegador: sem CORS.
export default {
  async fetch(request, env) {
    if (!env.API_ORIGIN) return foraDoAr()

    const url = new URL(request.url)
    const destino = new URL(url.pathname + url.search, env.API_ORIGIN)

    try {
      // new Request(destino, request) preserva método, corpo, Authorization e
      // o Upgrade do WebSocket do SignalR.
      return await fetch(new Request(destino, request))
    } catch {
      return foraDoAr()
    }
  },
}

// O frontend lê `detail` para mostrar a mensagem de erro.
function foraDoAr() {
  return Response.json(
    { detail: 'A API está fora do ar: o túnel para o servidor não está ligado.' },
    { status: 503 },
  )
}
