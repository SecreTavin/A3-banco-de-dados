"""Roteiro de testes de ponta a ponta do Eu Duvido! (documento 17, nivel 5).

Exercita a aplicacao pela API real, como um usuario faria, e confere o efeito
de cada passo direto no banco. Precisa do sistema no ar e do banco recem-povoado
pelo seed, porque o roteiro altera os dados (vota, cancela, remove membro):

    docker compose down -v && docker compose up -d --build
    python3 scripts/testes/roteiro-e2e.py

E12 espera o comportamento sem chave da Groq (IA_API_KEY vazia): criar desafio
responde 503 e nada e gravado. Com a chave configurada, o desafio passa pela
moderacao e E12 deixa de se aplicar.
"""
import json, subprocess, urllib.request, urllib.error, datetime

import os

API = os.environ.get("EUDUVIDO_API", "http://localhost:5080")
CONTAINER_DB = os.environ.get("EUDUVIDO_DB", "euduvido-db-1")
resultados = []

def sql(q):
    return subprocess.check_output(
        ["docker", "exec", CONTAINER_DB, "psql", "-U", "euduvido", "-d", "euduvido", "-tA", "-c", q]
    ).decode().strip()

def chamar(metodo, rota, corpo=None, token=None):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(API + rota, data=dados, method=metodo)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, txt

def login(apelido):
    s, r = chamar("POST", "/api/auth/dev/login", {"apelido": apelido})
    assert s == 200, (apelido, s, r)
    return r["token"]

def caso(id_, descricao, ok, detalhe=""):
    resultados.append((id_, descricao, "Aprovado" if ok else "REPROVADO", detalhe))

def contabilidade():
    return sql("SELECT (SELECT count(*) FROM vw_reconciliacao_saldo) + (SELECT count(*) FROM vw_escrow_orfao)")

# --- E01 acesso -------------------------------------------------------------
s, us = chamar("GET", "/api/auth/dev/usuarios")
caso("E01", "Acesso: lista de usuários do login de desenvolvimento", s == 200 and len(us) == 9, f"HTTP {s}, {len(us)} usuários")
tavin, lari, biel, theus = (login(a) for a in ("Tavin", "Lari", "Biel", "Theus"))

# --- E02 consulta / relacionamento -------------------------------------------
s, grupos = chamar("GET", "/api/grupos", token=tavin)
caso("E02", "Consulta: grupos do usuário com saldo e nível de filtro", s == 200 and len(grupos) == 2 and all("nivelFiltro" in g for g in grupos),
     f"HTTP {s}, grupos: {[ (g['nome'], g['nivelFiltro'], g['saldoCp']) for g in grupos ]}")

s, pend = chamar("GET", "/api/validacao/pendentes", token=lari)
alvo = [p for p in (pend or []) if "5km" in json.dumps(p, ensure_ascii=False)]
caso("E03", "Consulta: Central de Votação mostra a evidência pendente da demo", s == 200 and len(alvo) == 1, f"HTTP {s}, {len(pend or [])} pendente(s)")

# --- E04 roteiro da demonstração: voto que fecha o quórum --------------------
antes = sql("SELECT string_agg(apelido||'='||saldo_cp, ' ' ORDER BY apelido) FROM membro_grupo m JOIN usuario u USING(id_usuario) WHERE id_grupo=1")
s, r = chamar("POST", "/api/validacao/evidencias/2/votos", {"voto": "VALIDO", "justificativa": "Print do Strava confere."}, lari)
estado = sql("SELECT d.status||'/'||e.status FROM desafio d JOIN evidencia e ON e.id_desafio=d.id_desafio WHERE e.id_evidencia=2")
depois = sql("SELECT string_agg(apelido||'='||saldo_cp, ' ' ORDER BY apelido) FROM membro_grupo m JOIN usuario u USING(id_usuario) WHERE id_grupo=1")
recomp = sql("SELECT count(*) FROM transacao_cp WHERE tipo='RECOMPENSA_VOTO' AND id_grupo=1")
caso("E04", "Demo: voto da Lari fecha o quórum, apura no banco e liquida o CP", s in (200, 204) and estado == "FINALIZADA_CUMPRIU/ACEITA" and recomp == "2" and contabilidade() == "0",
     f"HTTP {s}; {estado}; saldos antes [{antes}] depois [{depois}]; recompensas={recomp}")

s, r = chamar("POST", "/api/validacao/evidencias/2/votos", {"voto": "VALIDO", "justificativa": "de novo"}, lari)
caso("E05", "Validação: segundo voto na mesma evidência é recusado", s >= 400, f"HTTP {s}: {str(r)[:90]}")

# --- E06/E07 idade mínima (RN26) ---------------------------------------------
hoje = datetime.date.today()
s, r = chamar("POST", "/api/auth/dev/cadastro", {"nome": "Menor Teste", "email": "menor@email.com", "apelido": "Menor",
                                                 "dataNascimento": hoje.replace(year=hoje.year - 12).isoformat()})
existe = sql("SELECT count(*) FROM usuario WHERE email='menor@email.com'")
caso("E06", "RN26: cadastro de usuário com 12 anos é recusado", s == 422 and existe == "0", f"HTTP {s}: {str(r)[:90]}")
s, r = chamar("POST", "/api/auth/dev/cadastro", {"nome": "Julia Prado", "email": "julia@email.com", "apelido": "Ju",
                                                 "dataNascimento": "2004-04-04"})
caso("E07", "Inclusão: cadastro de usuário com 22 anos", s in (200, 201) and sql("SELECT count(*) FROM usuario WHERE email='julia@email.com'") == "1", f"HTTP {s}")

# --- E08 ADMIN adiciona membro ------------------------------------------------
s, r = chamar("POST", "/api/grupos/1/membros", {"email": "julia@email.com"}, tavin)
credito = sql("SELECT coalesce(sum(valor),0) FROM transacao_cp t JOIN usuario u USING(id_usuario) WHERE u.email='julia@email.com' AND t.id_grupo=1")
caso("E08", "RN25/RN06: ADMIN adiciona membro, que entra com 100 CP no ledger", s in (200, 201, 204) and credito == "100" and contabilidade() == "0", f"HTTP {s}, crédito={credito}")
s, r = chamar("POST", "/api/grupos/1/membros", {"email": "diego@email.com"}, biel)
caso("E09", "RN25: membro comum não pode adicionar membro", s == 403, f"HTTP {s}")

# --- E10/E11 nível de filtro (RN27) -------------------------------------------
s, r = chamar("PATCH", "/api/grupos/1/nivel-filtro", {"nivelFiltro": "PESADO"}, biel)
caso("E10", "RN27: membro comum não altera o nível de filtro", s == 403 and sql("SELECT nivel_filtro FROM grupo_amigos WHERE id_grupo=1") == "MODERADO", f"HTTP {s}")
s, r = chamar("PATCH", "/api/grupos/1/nivel-filtro", {"nivelFiltro": "PESADO"}, tavin)
n1 = sql("SELECT nivel_filtro FROM grupo_amigos WHERE id_grupo=1")
s2, r2 = chamar("PATCH", "/api/grupos/1/nivel-filtro", {"nivelFiltro": "EXTREMO"}, tavin)
chamar("PATCH", "/api/grupos/1/nivel-filtro", {"nivelFiltro": "MODERADO"}, tavin)
caso("E11", "Alteração: ADMIN muda o nível; valor inválido é recusado", s in (200, 204) and n1 == "PESADO" and s2 == 400, f"HTTP {s} → {n1}; inválido HTTP {s2}")

# --- E12 moderação sem IA disponível (RN28, ADR 0015) -------------------------
nd, nm = sql("SELECT count(*) FROM desafio"), sql("SELECT count(*) FROM moderacao_desafio")
s, r = chamar("POST", "/api/desafios", {"idGrupo": 1, "idCategoria": 1, "titulo": "Correr 10km", "descricao": "Biel duvida.",
                                        "valorCp": 10, "tipoRecompensa": "PRENDA_ACAO", "descricaoRecompensa": "Pagar o açaí",
                                        "dataLimite": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()}, tavin)
caso("E12", "RN28: sem IA disponível, criar desafio responde 503 e nada é gravado",
     s == 503 and sql("SELECT count(*) FROM desafio") == nd and sql("SELECT count(*) FROM moderacao_desafio") == nm, f"HTTP {s}")

# --- E13 participação e escrow (RN18) -----------------------------------------
saldo0 = sql("SELECT saldo_cp FROM membro_grupo WHERE id_grupo=3 AND id_usuario=3")
s, r = chamar("POST", "/api/desafios/9/participantes", {"papelDesafio": "DESAFIADO", "escolha": "VAI_CUMPRIR"}, theus)
saldo1 = sql("SELECT saldo_cp FROM membro_grupo WHERE id_grupo=3 AND id_usuario=3")
caso("E13", "RN18: aceitar desafio debita o CP e retém em escrow", s == 200 and int(saldo0) - int(saldo1) == 10 and contabilidade() == "0", f"HTTP {s}, saldo {saldo0}→{saldo1}")

# --- E14/E15 saída de membro (RN25, ADR 0018) ---------------------------------
s, r = chamar("DELETE", "/api/grupos/3/membros/7", token=biel)
caso("E14", "RN25: remoção de membro com desafio em andamento é recusada", s >= 400 and sql("SELECT count(*) FROM membro_grupo WHERE id_grupo=3 AND id_usuario=7") == "1", f"HTTP {s}: {str(r)[:80]}")
s, r = chamar("DELETE", "/api/grupos/2/membros/6", token=lari)
saida = sql("SELECT coalesce(sum(valor),0) FROM transacao_cp WHERE id_grupo=2 AND id_usuario=6 AND tipo='SAIDA_GRUPO'")
caso("E15", "Exclusão: ADMIN remove membro livre; saldo zerado com SAIDA_GRUPO", s in (200, 204) and int(saida) < 0 and contabilidade() == "0", f"HTTP {s}, SAIDA_GRUPO={saida}")

# --- E16 cancelamento (RN12) --------------------------------------------------
s, r = chamar("POST", "/api/desafios/2/cancelar", {"motivo": "Aula cancelada."}, biel)
st = sql("SELECT status FROM desafio WHERE id_desafio=2")
caso("E16", "RN12: criador cancela com motivo e o CP é estornado", s == 200 and st == "CANCELADA" and contabilidade() == "0", f"HTTP {s}, status={st}")

# --- E17 ranking / consultas da aplicação -------------------------------------
s, r = chamar("GET", "/api/ranking/grupos/1", token=tavin)
s2, r2 = chamar("GET", "/api/ranking/grupos/2", token=biel)
caso("E17", "Consulta: ranking do grupo; quem não é membro não vê", s == 200 and s2 in (403, 404), f"HTTP {s}; não-membro HTTP {s2}")

# --- E18 integridade final ----------------------------------------------------
caso("E18", "Contabilidade fechando ao fim de tudo (views vazias)", contabilidade() == "0", sql("SELECT string_agg(tipo||'='||n, ' ') FROM (SELECT tipo, count(*) n FROM transacao_cp GROUP BY 1 ORDER BY 1) x"))

for c in resultados:
    print(" | ".join(c))
print(f"\n{sum(c[2]=='Aprovado' for c in resultados)}/{len(resultados)} aprovados")
