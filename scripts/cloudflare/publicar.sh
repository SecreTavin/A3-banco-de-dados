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
# O túnel só é reaproveitado se o endereço dele responder em /health. Um túnel
# rápido expira (por exemplo, depois de o Mac dormir) com o processo ainda vivo
# e o Worker passaria a receber HTTP 530 (#58); nesse caso o script derruba o
# processo e sobe um túnel novo.
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

# O túnel está saudável quando o endereço público chega até a API.
tunel_responde() {
  local origem
  origem="$(endereco_do_tunel)"
  [[ -n "$origem" ]] && curl -fsS --max-time 10 "$origem/health" >/dev/null 2>&1
}

derrubar_tunel() {
  local pid
  pid="$(cat "$ESTADO/pid")"
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 10); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "$pid" 2>/dev/null; then kill -9 "$pid" 2>/dev/null || true; fi
  rm -f "$ESTADO/pid"
}

if [[ "${1:-}" == "parar" ]]; then
  if tunel_vivo; then derrubar_tunel; echo "Túnel derrubado."; else echo "Nenhum túnel rodando."; fi
  rm -f "$ESTADO/pid"
  exit 0
fi

command -v cloudflared >/dev/null || {
  echo "Instale o cloudflared: brew install cloudflared (macOS) ou" >&2
  echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ (Linux)" >&2
  exit 1
}

# O build sai da pasta atual, não da main do GitHub. Em 07/11 o site foi
# publicado de um checkout numa branch com trabalho não commitado (#58).
BRANCH="$(git -C "$WEB_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
if [[ "$BRANCH" != "main" ]]; then
  echo "AVISO: o checkout de $WEB_DIR está na branch '$BRANCH', não na main." >&2
  echo "       O site publicado vai refletir essa branch." >&2
fi
if [[ -n "$(git -C "$WEB_DIR" status --porcelain 2>/dev/null)" ]]; then
  echo "AVISO: há alterações não commitadas no checkout de $WEB_DIR; elas entram no build." >&2
fi

if ! curl -fsS "$API_LOCAL/health" >/dev/null; then
  echo "A API não responde em $API_LOCAL. Suba o Docker antes: docker compose up -d" >&2
  exit 1
fi

# Com login de verdade (ADR 0021), a chave padrao do repositorio permitiria
# forjar sessoes no site publico.
CHAVE_PADRAO="chave-de-desenvolvimento-nao-usar-em-producao-min-32-chars"
CHAVE_API="$(cd "$RAIZ" && docker compose exec -T api printenv Auth__Chave 2>/dev/null || true)"
if [[ -z "$CHAVE_API" || "$CHAVE_API" == "$CHAVE_PADRAO" ]]; then
  echo "A API esta com a chave de sessao padrao. Defina AUTH_CHAVE no .env" >&2
  echo "(openssl rand -base64 48) e rode docker compose up -d antes de publicar." >&2
  exit 1
fi

echo "==> Build do frontend ($WEB_DIR), com a API na mesma origem"
(cd "$WEB_DIR" && VITE_API_URL="" npm run build)
if [[ "$WEB_DIR/dist" != "$RAIZ/apps/web/dist" ]]; then
  rm -rf "$RAIZ/apps/web/dist" && cp -R "$WEB_DIR/dist" "$RAIZ/apps/web/dist"
fi

if tunel_vivo && tunel_responde; then
  echo "==> Túnel já está no ar e responde ($(endereco_do_tunel))"
else
  if tunel_vivo; then
    echo "==> O túnel $(endereco_do_tunel) não responde mais; derrubando o processo"
    derrubar_tunel
  fi
  echo "==> Subindo o túnel para $API_LOCAL"
  nohup cloudflared tunnel --no-autoupdate --url "$API_LOCAL" >"$ESTADO/log" 2>&1 &
  echo $! >"$ESTADO/pid"
  # Impede o Mac de dormir enquanto o túnel estiver no ar (só no macOS).
  if command -v caffeinate >/dev/null; then
    nohup caffeinate -i -w "$(cat "$ESTADO/pid")" >/dev/null 2>&1 &
  fi
  for _ in $(seq 1 30); do
    [[ -n "$(endereco_do_tunel)" ]] && break
    sleep 1
  done
  [[ -n "$(endereco_do_tunel)" ]] || { echo "O túnel não informou o endereço. Log: $ESTADO/log" >&2; exit 1; }
  # O DNS de um túnel novo leva alguns segundos para propagar.
  echo "==> Esperando o túnel responder em $(endereco_do_tunel)/health"
  for _ in $(seq 1 30); do
    tunel_responde && break
    sleep 2
  done
  if ! tunel_responde; then
    echo "AVISO: o túnel ainda não responde daqui. Pode ser só o DNS local;" >&2
    echo "       confira o site em instantes. Log: $ESTADO/log" >&2
  fi
fi

ORIGEM="$(endereco_do_tunel)"

echo "==> Publicando o Worker (API_ORIGIN=$ORIGEM)"
"${WRANGLER[@]}" deploy --config "$PASTA/wrangler.jsonc" --var "API_ORIGIN:$ORIGEM"

echo
echo "No ar: https://euduvido.secretavin.workers.dev"
echo "Enquanto este Mac estiver ligado, com o Docker e o túnel rodando."
