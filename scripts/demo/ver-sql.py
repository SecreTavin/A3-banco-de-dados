#!/usr/bin/env python3
"""Mostra, ao vivo, cada comando SQL que a API manda ao PostgreSQL.

Feito para a banca: numa janela ao lado do navegador, cada clique na tela
aparece como o SELECT, INSERT, UPDATE ou CALL que ele gerou, com os parâmetros
já preenchidos. É o log do próprio PostgreSQL, então mostra também o que o
Dapper e as procedures recebem, e não só o que o EF Core registra.

    python3 scripts/demo/ver-sql.py              liga o log e acompanha
    python3 scripts/demo/ver-sql.py --desligar   só desliga o log

Liga com ALTER SYSTEM (sem reiniciar o banco) e desliga sozinho ao sair com
Ctrl+C. Os comandos do próprio psql ficam de fora, para a tela mostrar só o
que a aplicação faz. Funciona no Docker local e na VM: usa o `docker compose`
da pasta do repositório.

A tela vai para o projetor, e o banco tem contas reais: todo e-mail aparece como
'***@***'. O log do PostgreSQL continua com o valor original, então não projete
`docker compose logs`.
"""
import os
import re
import signal
import subprocess
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PSQL = ["docker", "compose", "exec", "-T", "db", "psql", "-U", "euduvido", "-d", "euduvido", "-q"]

# O prefixo marca o início de cada linha de log e traz o nome da aplicação
# entre colchetes: a API chega vazia; o psql, como [psql].
PREFIXO = "%m [%a] "
# A API chega como [[unknown]] (o Npgsql nao manda nome), por isso o nome pode
# ter colchetes dentro.
INICIO = re.compile(r"^(\d{4}-\d\d-\d\d (\d\d:\d\d:\d\d))\.\d+ \S+ \[(.*)\] (LOG|DETAIL|ERROR|STATEMENT):\s+(.*)$")
COMANDO = re.compile(r"^(?:execute [^:]+|statement):\s*(.*)$", re.S)
PARAMETROS = re.compile(r"\$(\d+) = ('(?:[^']|'')*'|NULL)")
# Aspas duplicadas sao o escape do SQL (o''brien@...). O "@" colado em ">" ou "<"
# fica de fora, porque e operador do PostgreSQL (@>, <@).
EMAIL = re.compile(r"(?:[^\s'\"(),;<>=]|'')+@[^\s'\"(),;<>=]+")

CORES = {
    "CALL": "\033[1;35m",
    "INSERT": "\033[32m",
    "UPDATE": "\033[33m",
    "DELETE": "\033[31m",
    "SELECT": "\033[36m",
}
CINZA, VERMELHO, NEGRITO, FIM = "\033[90m", "\033[1;31m", "\033[1m", "\033[0m"
LIMITE = int(os.environ.get("VER_SQL_LIMITE", "600"))


def psql(*comandos):
    # Um -c por comando: ALTER SYSTEM nao roda dentro de transacao, e varios
    # comandos no mesmo -c viram uma transacao so.
    args = [a for c in comandos for a in ("-c", c)]
    subprocess.run(PSQL + args, cwd=RAIZ, check=True, stdout=subprocess.DEVNULL)


def ligar():
    psql("ALTER SYSTEM SET log_statement = 'all'",
         f"ALTER SYSTEM SET log_line_prefix = '{PREFIXO}'",
         "SELECT pg_reload_conf()")


def desligar():
    psql("ALTER SYSTEM RESET log_statement",
         "ALTER SYSTEM RESET log_line_prefix",
         "SELECT pg_reload_conf()")


def compactar(sql):
    return re.sub(r"\s+", " ", sql).strip()


def preencher(sql, detalhe):
    valores = {int(n): v for n, v in PARAMETROS.findall(detalhe or "")}
    if not valores:
        return sql
    return re.sub(r"\$(\d+)\b", lambda m: valores.get(int(m.group(1)), m.group(0)), sql)


def mascarar(texto):
    return EMAIL.sub("***@***", texto)


def mostrar(hora, sql, detalhe):
    # Mascara antes de cortar no LIMITE, para um e-mail cortado nao escapar.
    sql = mascarar(compactar(preencher(sql, detalhe)))
    # SELECT 1 e DISCARD ALL sao do pool de conexoes, nao da aplicacao.
    if not sql or sql.upper() == "SELECT 1" or sql.upper().startswith(("SET ", "DISCARD", "SHOW ")):
        return
    verbo = sql.split(" ", 1)[0].upper()
    if len(sql) > LIMITE:
        sql = sql[:LIMITE] + " …"
    if verbo in ("SAVEPOINT", "RELEASE"):  # marcadores internos do EF Core
        return
    if verbo in ("BEGIN", "COMMIT", "ROLLBACK", "START"):
        print(f"{CINZA}{hora}  {NEGRITO}{sql}{FIM}", flush=True)
        return
    cor = CORES.get(verbo, "")
    print(f"{CINZA}{hora}{FIM}  {cor}{sql}{FIM}", flush=True)


def acompanhar():
    proc = subprocess.Popen(
        ["docker", "compose", "logs", "-f", "--no-log-prefix", "--since", "1s", "db"],
        cwd=RAIZ, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
    )
    pendente = None  # [hora, aplicacao, tipo, texto]

    def fechar(entrada, detalhe=None):
        hora, app, tipo, texto = entrada
        if app == "psql":
            return
        if tipo == "ERROR":
            print(f"{CINZA}{hora}{FIM}  {VERMELHO}ERRO: {mascarar(compactar(texto))}{FIM}", flush=True)
            return
        m = COMANDO.match(texto)
        if tipo == "LOG" and m:
            mostrar(hora, m.group(1), detalhe)

    for linha in proc.stdout:
        linha = linha.rstrip("\n")
        m = INICIO.match(linha)
        if not m:
            if pendente:
                pendente[3] += "\n" + linha
            continue
        _, hora, app, tipo, texto = m.groups()
        if tipo == "DETAIL" and pendente and pendente[2] == "LOG":
            fechar(pendente, texto)
            pendente = None
            continue
        if pendente:
            fechar(pendente)
        pendente = [hora, app, tipo, texto]


def main():
    if "--desligar" in sys.argv:
        desligar()
        print("Log de comandos desligado.")
        return
    ligar()
    print(f"{NEGRITO}Comandos que a aplicação manda ao PostgreSQL{FIM} (Ctrl+C para sair)")
    print(f"{CINZA}cores: {CORES['SELECT']}SELECT{CINZA} · {CORES['INSERT']}INSERT{CINZA} · "
          f"{CORES['UPDATE']}UPDATE{CINZA} · {CORES['CALL']}CALL{CINZA} · {NEGRITO}transação{FIM}\n", flush=True)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    try:
        acompanhar()
    except KeyboardInterrupt:
        pass
    finally:
        desligar()
        print("\nLog de comandos desligado.")


if __name__ == "__main__":
    main()
