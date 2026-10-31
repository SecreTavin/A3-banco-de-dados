#!/usr/bin/env bash
# Publica o Eu Duvido em https://euduvido.secretavin.workers.dev (ADR 0019).
#
#   scripts/cloudflare/publicar.sh          sobe o túnel (se preciso) e publica
#   scripts/cloudflare/publicar.sh parar    derruba o túnel; o site mostra "API fora do ar"
#
# O frontend vai para um Worker da Cloudflare. A API continua no Docker deste
# Mac (docker compose up -d) e chega à internet por um túnel rápido do
# cloudflared. O endereço do túnel muda a cada subida, então o script publica o
# Worker de novo com o endereço atual em API_ORIGIN.
#
# WEB_DIR=<pasta> gera o build de outro checkout do apps/web (ex.: uma worktree
# de uma branch ainda não mesclada).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
PASTA="$RAIZ/scripts/cloudflare"
WEB_DIR="${WEB_DIR:-$RAIZ/apps/web}"
API_LOCAL="http://localhost:5080"
ESTADO="${TMPDIR:-/tmp}/euduvido-tunel"
WRANGLER=(npx --yes wrangler@4.156.0)

mkdir -p "$ESTADO"

tunel_vivo() {
  [[ -f "$ESTADO/pid" ]] && kill -0 "$(cat "$ESTADO/pid")" 2>/dev/null
}

endereco_do_tunel() {
  grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$ESTADO/log" 2>/dev/null | head -1
}

if [[ "${1:-}" == "parar" ]]; then
  if tunel_vivo; then kill "$(cat "$ESTADO/pid")"; echo "Túnel derrubado."; else echo "Nenhum túnel rodando."; fi
  rm -f "$ESTADO/pid"
  exit 0
fi

command -v cloudflared >/dev/null || { echo "Instale o cloudflared: brew install cloudflared" >&2; exit 1; }

if ! curl -fsS "$API_LOCAL/health" >/dev/null; then
  echo "A API não responde em $API_LOCAL. Suba o Docker antes: docker compose up -d" >&2
  exit 1
fi

echo "==> Build do frontend ($WEB_DIR), com a API na mesma origem"
(cd "$WEB_DIR" && VITE_API_URL="" npm run build)
if [[ "$WEB_DIR/dist" != "$RAIZ/apps/web/dist" ]]; then
  rm -rf "$RAIZ/apps/web/dist" && cp -R "$WEB_DIR/dist" "$RAIZ/apps/web/dist"
fi

if tunel_vivo && [[ -n "$(endereco_do_tunel)" ]]; then
  echo "==> Túnel já está no ar"
else
  echo "==> Subindo o túnel para $API_LOCAL"
  nohup cloudflared tunnel --no-autoupdate --url "$API_LOCAL" >"$ESTADO/log" 2>&1 &
  echo $! >"$ESTADO/pid"
  # Impede o Mac de dormir enquanto o túnel estiver no ar.
  nohup caffeinate -i -w "$(cat "$ESTADO/pid")" >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    [[ -n "$(endereco_do_tunel)" ]] && break
    sleep 1
  done
fi

ORIGEM="$(endereco_do_tunel)"
[[ -n "$ORIGEM" ]] || { echo "O túnel não informou o endereço. Log: $ESTADO/log" >&2; exit 1; }

echo "==> Publicando o Worker (API_ORIGIN=$ORIGEM)"
"${WRANGLER[@]}" deploy --config "$PASTA/wrangler.jsonc" --var "API_ORIGIN:$ORIGEM"

echo
echo "No ar: https://euduvido.secretavin.workers.dev"
echo "Enquanto este Mac estiver ligado, com o Docker e o túnel rodando."
