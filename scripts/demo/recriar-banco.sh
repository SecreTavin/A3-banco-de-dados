#!/usr/bin/env bash
# Recria o banco da demonstração a partir do schema.sql e do seed.sql, com o
# sistema no ar, e confere o estado que o roteiro da banca espera.
#
#   scripts/demo/recriar-banco.sh          pede para digitar RECRIAR antes de apagar
#   scripts/demo/recriar-banco.sh --sim    não pergunta (para quem já conferiu)
#   scripts/demo/recriar-banco.sh --vazio  sem o seed: só o schema e as categorias,
#                                          para começar com usuários reais
#
# Funciona no Docker local e na VM: usa o `docker compose` da pasta do
# repositório, com os overrides que estiverem nela. Não depende do initdb do
# contêiner (a VM desliga o seed no initdb), porque aplica os dois arquivos
# direto pelo psql. O volume do banco não é apagado; só o schema public.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"

SCHEMA="database/scripts/ddl/schema.sql"
SEED="database/scripts/dml/seed.sql"
CATEGORIAS="database/scripts/dml/categorias.sql"
PSQL=(docker compose exec -T db psql -U euduvido -d euduvido -v ON_ERROR_STOP=1 -q)

docker compose ps --status running --services 2>/dev/null | grep -qx db || {
  echo "O contêiner do banco não está no ar. Rode antes: docker compose up -d" >&2
  exit 1
}

SIM=0; VAZIO=0
for arg in "$@"; do
  case "$arg" in
    --sim) SIM=1 ;;
    --vazio) VAZIO=1 ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 1 ;;
  esac
done

if [[ $SIM -eq 0 ]]; then
  if [[ $VAZIO -eq 1 ]]; then
    echo "Isto APAGA todos os dados do banco e deixa só o schema e as categorias."
  else
    echo "Isto APAGA todos os dados do banco e volta ao seed da demonstração."
  fi
  read -r -p "Digite RECRIAR para continuar: " resposta
  [[ "$resposta" == "RECRIAR" ]] || { echo "Nada foi feito."; exit 1; }
fi

echo "==> Parando a API (ela reconecta ao subir de novo)"
docker compose stop api >/dev/null

echo "==> Apagando o schema public"
"${PSQL[@]}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION euduvido;"

echo "==> Aplicando $SCHEMA"
"${PSQL[@]}" < "$SCHEMA"

if [[ $VAZIO -eq 1 ]]; then
  echo "==> Aplicando $CATEGORIAS"
  "${PSQL[@]}" < "$CATEGORIAS"
else
  echo "==> Aplicando $SEED"
  "${PSQL[@]}" < "$SEED"
fi

echo "==> Subindo a API"
docker compose start api >/dev/null
for _ in $(seq 1 30); do
  docker compose exec -T api curl -fsS http://localhost:8080/health >/dev/null 2>&1 && break
  sleep 2
done

if [[ $VAZIO -eq 1 ]]; then
  echo
  echo "Banco vazio: só as categorias. Cada pessoa se cadastra ao entrar com o Google."
  exit 0
fi

# Login so pelo Google: liga as contas da demonstracao (DEMO_CONTAS), se houver.
"$RAIZ/scripts/demo/vincular-contas.sh"

echo
"$RAIZ/scripts/demo/conferir-demo.sh"
