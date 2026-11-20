#!/usr/bin/env bash
# Confere se o banco está no estado que o roteiro da banca espera
# (docs/06-encerramento/roteiro-da-demonstracao.md). Só lê; não muda nada.
#
#   scripts/demo/conferir-demo.sh
#
# Termina com código 0 se tudo bate e 1 se algo diverge. Rode antes de cada
# ensaio e na véspera da banca. Se algo divergir, o banco foi usado depois do
# seed: rode scripts/demo/recriar-banco.sh.
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ"

valor() {
  docker compose exec -T db psql -U euduvido -d euduvido -tA -c "$1" 2>/dev/null | tr -d '\r'
}

falhas=0
confere() { # descrição, esperado, consulta
  local obtido
  obtido="$(valor "$3")"
  if [[ "$obtido" == "$2" ]]; then
    printf '  \033[32m✔\033[0m %s\n' "$1"
  else
    printf '  \033[31m✘\033[0m %s (esperado: %s; no banco: %s)\n' "$1" "$2" "${obtido:-vazio}"
    falhas=$((falhas + 1))
  fi
}

saldo() { # apelido, grupo
  echo "SELECT m.saldo_cp FROM membro_grupo m JOIN usuario u USING (id_usuario)
         WHERE u.apelido = '$1' AND m.id_grupo = $2"
}

echo "Estado do banco para o roteiro da demonstração:"
confere "9 usuários do seed" 9 "SELECT count(*) FROM usuario"
confere "Passo 3: a Aninha ainda não está em Os Inimigos do Fim" 0 \
  "SELECT count(*) FROM membro_grupo WHERE id_grupo = 1 AND id_usuario = 6"
confere "Passo 3: saldo do Tavin em Os Inimigos do Fim = 80" 80 "$(saldo Tavin 1)"
confere "Passo 5: 'Tirar nota máxima no projeto A3' está ABERTA" ABERTA \
  "SELECT status FROM desafio WHERE id_desafio = 4"
confere "Passo 5: saldo do Biel = 110" 110 "$(saldo Biel 1)"
confere "Passo 5: saldo do Theus = 35" 35 "$(saldo Theus 1)"
confere "Passo 6: 'Ir fantasiado de dinossauro na aula' está EM_ANDAMENTO" EM_ANDAMENTO \
  "SELECT status FROM desafio WHERE id_desafio = 2"
confere "Passo 7: 'Correr 5km abaixo de 25 minutos' está EM_VOTACAO" EM_VOTACAO \
  "SELECT status FROM desafio WHERE id_desafio = 1"
confere "Passo 7: a prova tem 1 voto, do Theus" "Theus" \
  "SELECT string_agg(u.apelido, ',') FROM jurado_evidencia j JOIN usuario u USING (id_usuario)
    WHERE j.id_evidencia = 2 AND j.voto IS NOT NULL"
confere "Passo 7: a Lari ainda não votou" 1 \
  "SELECT count(*) FROM jurado_evidencia j JOIN usuario u USING (id_usuario)
    WHERE j.id_evidencia = 2 AND u.apelido = 'Lari' AND j.voto IS NULL"
confere "Passo 7: saldo da Lari = 100" 100 "$(saldo Lari 1)"
confere "Passo 9: vw_reconciliacao_saldo vazia" 0 "SELECT count(*) FROM vw_reconciliacao_saldo"
confere "Passo 9: vw_escrow_orfao vazia" 0 "SELECT count(*) FROM vw_escrow_orfao"

echo
if [[ $falhas -eq 0 ]]; then
  echo "Pronto para a demonstração."
else
  echo "$falhas item(ns) divergente(s). Recrie o banco: scripts/demo/recriar-banco.sh" >&2
  exit 1
fi
