"""Roteiro de testes de ponta a ponta do Eu Duvido! (documento 17, nivel 5).

Exercita a aplicacao pela API real, como um usuario faria, e confere o efeito
de cada passo direto no banco. Precisa do sistema no ar e do banco recem-povoado
pelo seed, porque o roteiro altera os dados (vota, cancela, remove membro):

    docker compose down -v && docker compose up -d --build
    python3 scripts/testes/roteiro-e2e.py

E12 espera o comportamento sem chave da Groq (IA_API_KEY vazia): criar desafio
responde 503 e nada e gravado. Com a chave configurada, o desafio passa pela
moderacao e E12 deixa de se aplicar.

O login e so pelo Google (ADR 0021), e o popup do Google nao se automatiza. O
roteiro cria a sessao assinando o JWT com a chave do ambiente de teste
(AUTH_CHAVE, ou o padrao de desenvolvimento), exatamente como a API faria.
"""
import base64, hashlib, hmac, time
import json, subprocess, urllib.request, urllib.error, datetime

import os

API = os.environ.get("EUDUVIDO_API", "http://localhost:5080")
CHAVE = os.environ.get("AUTH_CHAVE") or "chave-de-desenvolvimento-nao-usar-em-producao-min-32-chars"
CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/"
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

def _b64(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()

def assinar(audiencia, claims, minutos=60):
    """JWT HS256 com o mesmo emissor, audiencia e chave que a API usa."""
    corpo = {**claims, "iss": "euduvido", "aud": audiencia, "exp": int(time.time()) + minutos * 60}
    cabeca = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    carga = _b64(json.dumps(corpo).encode())
    assinatura = hmac.new(CHAVE.encode(), f"{cabeca}.{carga}".encode(), hashlib.sha256).digest()
    return f"{cabeca}.{carga}.{_b64(assinatura)}"

def login(apelido):
    """Sessao de um usuario do seed, como o login com Google entregaria."""
    id_, email = sql(f"SELECT id_usuario || '|' || email FROM usuario WHERE apelido = '{apelido}' ORDER BY id_usuario LIMIT 1").split("|")
    return assinar("euduvido", {CLAIM + "nameidentifier": id_, CLAIM + "name": apelido, CLAIM + "emailaddress": email})

def token_cadastro(email, nome):
    """O que a API devolve a quem entra pelo Google pela primeira vez."""
    return assinar("euduvido-cadastro", {CLAIM + "emailaddress": email, "nome": nome}, minutos=15)

def caso(id_, descricao, ok, detalhe=""):
    resultados.append((id_, descricao, "Aprovado" if ok else "REPROVADO", detalhe))

def contabilidade():
    return sql("SELECT (SELECT count(*) FROM vw_reconciliacao_saldo) + (SELECT count(*) FROM vw_escrow_orfao)")

# --- E01 acesso -------------------------------------------------------------
s_dev, _ = chamar("GET", "/api/auth/dev/usuarios")
s_cfg, cfg = chamar("GET", "/api/auth/configuracao")
s_g, r_g = chamar("POST", "/api/auth/google", {"credential": "token-forjado"})
caso("E01", "Acesso: só pelo Google; o login de desenvolvimento não existe e token falso é recusado",
     s_dev == 404 and s_cfg == 200 and s_g in (401, 503) and not (isinstance(r_g, dict) and r_g.get("token")),
     f"dev HTTP {s_dev}; configuração HTTP {s_cfg}; Google com token falso HTTP {s_g}")
tavin, lari, biel, theus = (login(a) for a in ("Tavin", "Lari", "Biel", "Theus"))

# --- E02 consulta / relacionamento -------------------------------------------
s, grupos = chamar("GET", "/api/grupos", token=tavin)
caso("E02", "Consulta: grupos do usuário com saldo e nível de filtro", s == 200 and len(grupos) == 2 and all("nivelFiltro" in g for g in grupos),
     f"HTTP {s}, grupos: {[ (g['nome'], g['nivelFiltro'], g['saldoCp']) for g in grupos ]}")

s, pend = chamar("GET", "/api/validacao/pendentes", token=lari)
alvo = [p for p in (pend or []) if "5km" in json.dumps(p, ensure_ascii=False)]
caso("E03", "Consulta: Central de Votação mostra a evidência pendente da demo", s == 200 and len(alvo) == 1, f"HTTP {s}, {len(pend or [])} pendente(s)")

# --- E19/E20 votos do júri com a votação aberta (RN29, #83) -------------------
# Evidência 2 do seed (desafio 1): desafiado Tavin, desafiante Biel; júri Theus,
# Lari e Lipe. Theus já votou com justificativa; Lari e Lipe ainda não. Roda antes
# do E04, enquanto a evidência está EM_VOTACAO.
def jurado_da_prova(token, id_desafio, id_evidencia, apelido):
    s, d = chamar("GET", f"/api/desafios/{id_desafio}", token=token)
    ev = next((e for e in (d or {}).get("evidencias", []) if e["idEvidencia"] == id_evidencia), None) if s == 200 else None
    return s, next((j for j in (ev or {}).get("jurados", []) if j["apelido"] == apelido), None)

JUSTIFICATIVA_THEUS = sql("SELECT justificativa FROM jurado_evidencia WHERE id_evidencia=2 AND id_usuario=3")
s_l, theus_p_lari = jurado_da_prova(lari, 1, 2, "Theus")
s_t, theus_p_tavin = jurado_da_prova(tavin, 1, 2, "Theus")
s_b, theus_p_biel = jurado_da_prova(biel, 1, 2, "Theus")
oculto = bool(theus_p_lari) and theus_p_lari["votou"] and theus_p_lari["voto"] is None \
    and theus_p_lari["justificativa"] is None and theus_p_lari["dataVoto"] is None
visivel = lambda j: bool(j) and j["voto"] == "VALIDO" and j["justificativa"] == JUSTIFICATIVA_THEUS and j["dataVoto"]
caso("E19", "RN29: jurado que ainda não votou só sabe quem votou; desafiado e desafiante veem voto e comentário",
     s_l == s_t == s_b == 200 and oculto and visivel(theus_p_tavin) and visivel(theus_p_biel),
     f"Lari vê {theus_p_lari and {k: theus_p_lari[k] for k in ('votou', 'voto', 'justificativa')}}; "
     f"Tavin vê {theus_p_tavin and theus_p_tavin['voto']}; Biel vê {theus_p_biel and theus_p_biel['voto']}")

s_t, provas_tavin = chamar("GET", "/api/validacao/minhas-provas", token=tavin)
s_l, provas_lari = chamar("GET", "/api/validacao/minhas-provas", token=lari)
s_a, _ = chamar("GET", "/api/validacao/minhas-provas")
prova = next((p for p in (provas_tavin or []) if p["idEvidencia"] == 2), None) if s_t == 200 else None
voto_theus = next((j for j in (prova or {}).get("jurados", []) if j["apelido"] == "Theus"), None)
caso("E20", "#83: o desafiado acompanha a própria prova no júri, com placar e comentários; outros não a recebem",
     s_t == s_l == 200 and s_a == 401 and prova is not None and prova["votosFavoraveis"] == 1 and prova["quorum"] == 2
     and len(prova["jurados"]) == 3 and visivel(voto_theus) and all(p["idEvidencia"] != 2 for p in provas_lari),
     f"Tavin HTTP {s_t}, placar {prova and (prova['votosFavoraveis'], prova['votosContra'], prova['quorum'])}; "
     f"Lari HTTP {s_l}, {len(provas_lari or [])} prova(s); sem login HTTP {s_a}")

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

# --- E21 votos do júri com a votação fechada (RN29, #83) ----------------------
lipe = login("Lipe")
s_p, lari_p_lipe = jurado_da_prova(lipe, 1, 2, "Lari")
s_t, provas_tavin = chamar("GET", "/api/validacao/minhas-provas", token=tavin)
caso("E21", "RN29: votação fechada mostra tudo até a quem não votou; a prova sai das provas do desafiado no júri",
     s_p == 200 and bool(lari_p_lipe) and lari_p_lipe["voto"] == "VALIDO" and lari_p_lipe["justificativa"] == "Print do Strava confere."
     and s_t == 200 and all(p["idEvidencia"] != 2 for p in provas_tavin),
     f"Lipe vê o voto da Lari: {lari_p_lipe and (lari_p_lipe['voto'], lari_p_lipe['justificativa'])}; "
     f"provas do Tavin no júri: {[p['idEvidencia'] for p in provas_tavin or []]}")

# --- E06/E07 idade mínima (RN26) ---------------------------------------------
hoje = datetime.date.today()
s, r = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro("menor@email.com", "Menor Teste"), "apelido": "Menor",
                                             "dataNascimento": hoje.replace(year=hoje.year - 12).isoformat()})
existe = sql("SELECT count(*) FROM usuario WHERE email='menor@email.com'")
caso("E06", "RN26: cadastro de usuário com 12 anos é recusado", s == 422 and existe == "0", f"HTTP {s}: {str(r)[:90]}")
s, r = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro("julia@email.com", "Julia Prado"), "apelido": "Ju",
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

# E19 a E21 rodam no meio da sequência (antes e depois do voto da demo); a saída sai em ordem de ID.
for c in sorted(resultados, key=lambda c: int(c[0][1:])):
    print(" | ".join(c))
print(f"\n{sum(c[2]=='Aprovado' for c in resultados)}/{len(resultados)} aprovados")
