#!/usr/bin/env bash
# Liga contas Google reais aos usuários do seed, para a demonstração com login
# só pelo Google (ADR 0021): cada integrante entra no próprio celular como um
# personagem do roteiro (Tavin, Lari, Biel...).
#
#   scripts/demo/vincular-contas.sh
#
# Lê DEMO_CONTAS do ambiente ou do .env, no formato
#   DEMO_CONTAS="Tavin=fulano@gmail.com;Lari=ciclana@gmail.com"
# e troca o e-mail desses usuários numa transação só. O seed.sql não muda, e os
# e-mails reais ficam só no .env de quem demonstra (nunca no repositório).
# Rode depois de cada recriação do banco; o recriar-banco.sh já chama este.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"

if [[ -z "${DEMO_CONTAS:-}" && -f .env ]]; then
  DEMO_CONTAS="$(sed -n 's/^DEMO_CONTAS=//p' .env | tail -1 | sed -e 's/^"//' -e 's/"$//')"
fi
if [[ -z "${DEMO_CONTAS:-}" ]]; then
  echo "DEMO_CONTAS não está definido (.env ou ambiente). Nada a vincular."
  exit 0
fi

sql=""
IFS=';' read -ra pares <<< "$DEMO_CONTAS"
for par in "${pares[@]}"; do
  [[ -z "${par// }" ]] && continue
  apelido="$(echo "${par%%=*}" | xargs)"
  email="$(echo "${par#*=}" | xargs | tr '[:upper:]' '[:lower:]')"
  if [[ "$par" != *=* || -z "$apelido" || ! "$email" =~ ^[^@[:space:]\']+@[^@[:space:]\']+$ || "$apelido" == *\'* ]]; then
    echo "Par inválido em DEMO_CONTAS: '$par' (esperado Apelido=email@dominio)" >&2
    exit 1
  fi
  # O apelido pode repetir no modelo: o vínculo só vale se ele achar exatamente um.
  sql+="DO \$\$ BEGIN
  IF (SELECT count(*) FROM usuario WHERE apelido = '$apelido') <> 1 THEN
    RAISE EXCEPTION 'O apelido % precisa existir exatamente uma vez no banco', '$apelido';
  END IF;
END \$\$;
UPDATE usuario SET email = '$email' WHERE apelido = '$apelido';
"
done

echo "==> Vinculando contas Google aos usuários do seed"
if ! docker compose exec -T db psql -U euduvido -d euduvido -v ON_ERROR_STOP=1 -q -1 <<< "$sql"; then
  echo "Nada foi vinculado (a transação foi desfeita). Confira DEMO_CONTAS." >&2
  exit 1
fi

docker compose exec -T db psql -U euduvido -d euduvido -tA -F ' → ' -c \
  "SELECT apelido, email FROM usuario WHERE email NOT LIKE '%@email.com' ORDER BY id_usuario"
