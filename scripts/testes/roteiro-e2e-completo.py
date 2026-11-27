"""Roteiro completo de ponta a ponta, pela API (docs/05-qualidade/roteiro-e2e.md).

Cada caso leva o ID do cenario no roteiro completo (A03, D19, V26...). Os casos
que o roteiro-e2e.py ja cobre (E01 a E30) nao se repetem aqui.

Cada cenario monta o proprio mundo: usuarios novos, grupo novo e desafio
inserido por SQL (a criacao pela API depende da IA e e coberta pelo nivel 5c).
As acoes - aceitar, enviar prova, votar, cancelar, sair - passam pela API, e o
efeito e conferido no PostgreSQL. Por isso roda em qualquer banco semeado, mas
ESCREVE nele. Os cenarios que a analise apontou como risco (D25, D32, V11, V27,
P05, C02, S05) reprovaram na primeira execucao e foram corrigidos em 27/11/2026;
aqui eles conferem a regra decidida.

Fases, nesta ordem:
  1. cenarios comuns;
  2. prazos: as datas vao para o passado por SQL e a API e reiniciada, porque o
     PrazosWorker roda ao subir;
  3. configuracao: a API e recriada sem IA, com um Client ID do Google e com o
     validador do Google simulado (ADR 0024), que aceita ID tokens assinados
     por GOOGLE_SIMULADO_CHAVE no lugar dos do Google;
  4. banco fora do ar: o contêiner do banco para e volta.
As fases 2 a 4 mexem nos conteineres; rode numa pilha propria:

    export COMPOSE_PROJECT_NAME=euduvido-e2e
    docker compose down -v && docker compose up -d --build --wait
    EUDUVIDO_DB=euduvido-e2e-db-1 EUDUVIDO_API_CONTAINER=euduvido-e2e-api-1 \\
        python3 scripts/testes/roteiro-e2e-completo.py

Ao terminar, a API volta a configuracao padrao do compose.
"""
import base64, datetime, hashlib, hmac, json, os, subprocess, threading, time
import urllib.error, urllib.request

API = os.environ.get("EUDUVIDO_API", "http://localhost:5080")
CHAVE = os.environ.get("AUTH_CHAVE") or "chave-de-desenvolvimento-nao-usar-em-producao-min-32-chars"
CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/"
CONTAINER_DB = os.environ.get("EUDUVIDO_DB", "euduvido-db-1")
CONTAINER_API = os.environ.get("EUDUVIDO_API_CONTAINER", "euduvido-api-1")
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RODADA = int(time.time())
GOOGLE_CLIENT_ID_TESTE = "e2e.apps.googleusercontent.com"
GOOGLE_SIMULADO_CHAVE = os.environ.get("GOOGLE_SIMULADO_CHAVE") or "chave-do-google-simulado-so-para-testes-e2e"
resultados = []
ORFAOS_ESPERADOS = set()  # potes que o V27 deixa presos de proposito, se o defeito existir

# --- infraestrutura ------------------------------------------------------------

def sql(q):
    return subprocess.check_output(
        ["docker", "exec", CONTAINER_DB, "psql", "-U", "euduvido", "-d", "euduvido", "-tAq", "-c", q]
    ).decode().strip()

def num(q):
    return int(sql(q) or 0)

def chamar(metodo, rota, corpo=None, token=None, dados=None, tipo="application/json", cabecalhos=None):
    if dados is None and corpo is not None:
        dados = json.dumps(corpo).encode()
    req = urllib.request.Request(API + rota, data=dados, method=metodo)
    if dados is not None:
        req.add_header("Content-Type", tipo)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            bruto = r.read()
            if cabecalhos is not None:
                cabecalhos.update(dict(r.headers))
            return r.status, _corpo(bruto, r.headers.get("Content-Type", ""))
    except urllib.error.HTTPError as e:
        return e.code, _corpo(e.read(), e.headers.get("Content-Type", ""))

def _corpo(bruto, tipo):
    if "json" in tipo:
        try:
            return json.loads(bruto.decode())
        except Exception:
            return bruto.decode(errors="replace")
    return bruto

def codigo(r):
    return r.get("title") if isinstance(r, dict) else None

def _b64(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()

def assinar(audiencia, claims, minutos=60, chave=CHAVE):
    corpo = {**claims, "iss": "euduvido", "aud": audiencia, "exp": int(time.time()) + minutos * 60}
    cabeca = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    carga = _b64(json.dumps(corpo).encode())
    assinatura = hmac.new(chave.encode(), f"{cabeca}.{carga}".encode(), hashlib.sha256).digest()
    return f"{cabeca}.{carga}.{_b64(assinatura)}"

def tok(id_usuario, minutos=60, chave=CHAVE):
    email, apelido = sql(f"SELECT email || '|' || apelido FROM usuario WHERE id_usuario = {id_usuario}").split("|")
    return assinar("euduvido", {CLAIM + "nameidentifier": str(id_usuario), CLAIM + "name": apelido,
                                CLAIM + "emailaddress": email}, minutos, chave)

def token_google(email, nome, verificado=True):
    """ID token no formato do Google, assinado com a chave do validador simulado (ADR 0024)."""
    corpo = {"iss": "euduvido-google-simulado", "aud": GOOGLE_CLIENT_ID_TESTE, "email": email, "email_verified": verificado,
             "name": nome, "picture": "https://lh3.googleusercontent.com/a/e2e", "exp": int(time.time()) + 600}
    cabeca = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    carga = _b64(json.dumps(corpo).encode())
    assinatura = hmac.new(GOOGLE_SIMULADO_CHAVE.encode(), f"{cabeca}.{carga}".encode(), hashlib.sha256).digest()
    return f"{cabeca}.{carga}.{_b64(assinatura)}"

def token_cadastro(email, nome, minutos=15):
    return assinar("euduvido-cadastro", {CLAIM + "emailaddress": email, "nome": nome}, minutos)

def caso(id_, descricao, ok, detalhe=""):
    resultados.append((id_, descricao, "Aprovado" if ok else "REPROVADO", str(detalhe)[:400]))
    print(" | ".join(resultados[-1]), flush=True)

def nao_coberto(id_, descricao, motivo):
    resultados.append((id_, descricao, "NAO COBERTO", motivo))
    print(" | ".join(resultados[-1]), flush=True)

def executar(id_, descricao, fn):
    """Roda um cenario; excecao vira reprovacao com a mensagem, sem derrubar o roteiro."""
    try:
        ok, detalhe = fn()
    except Exception as e:  # noqa: BLE001 - o roteiro registra e segue
        ok, detalhe = False, f"excecao: {type(e).__name__}: {e}"
    caso(id_, descricao, ok, detalhe)

def contabilidade():
    excluir = ",".join(str(d) for d in ORFAOS_ESPERADOS) or "0"
    return num("SELECT (SELECT count(*) FROM vw_reconciliacao_saldo) + "
               f"(SELECT count(*) FROM vw_escrow_orfao WHERE id_desafio NOT IN ({excluir}))")

def esperar(condicao, segundos=60, passo=1.0):
    fim = time.time() + segundos
    while time.time() < fim:
        try:
            if condicao():
                return True
        except Exception:
            pass
        time.sleep(passo)
    return False

def api_saudavel():
    try:
        with urllib.request.urlopen(API + "/health", timeout=5) as r:
            return r.status == 200
    except Exception:
        return False

def compose(*args, env_extra=None):
    env = {**os.environ, **(env_extra or {})}
    subprocess.run(["docker", "compose", *args], cwd=RAIZ, env=env, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def recriar_api(env_extra=None):
    compose("up", "-d", "--no-deps", "--force-recreate", "api", env_extra=env_extra)
    if not esperar(api_saudavel, 120):
        raise RuntimeError("a API nao voltou saudavel depois de recriada")

def reiniciar_api():
    subprocess.run(["docker", "restart", CONTAINER_API], check=True, stdout=subprocess.DEVNULL)
    if not esperar(api_saudavel, 120):
        raise RuntimeError("a API nao voltou saudavel depois de reiniciada")

# --- montagem do mundo de cada cenario -----------------------------------------

_seq = [0]

def novo_usuario(apelido, nascimento="2000-01-01"):
    _seq[0] += 1
    email = f"{apelido.lower()}.{RODADA}.{_seq[0]}@e2e.local"
    return num(f"INSERT INTO usuario (nome, email, apelido, data_nascimento) VALUES "
               f"('{apelido} E2E', '{email}', '{apelido}', '{nascimento}') RETURNING id_usuario")

def novo_grupo(apelidos, nivel="MODERADO"):
    """Primeiro apelido vira ADMIN. Devolve (id_grupo, {apelido: id_usuario})."""
    ids = {a: novo_usuario(a) for a in apelidos}
    admin = ids[apelidos[0]]
    _seq[0] += 1
    g = num(f"INSERT INTO grupo_amigos (nome, descricao, id_criador, nivel_filtro) VALUES "
            f"('Grupo completo {RODADA}-{_seq[0]}', 'roteiro-e2e-completo', {admin}, '{nivel}') RETURNING id_grupo")
    valores = ", ".join(f"({g}, {i}, '{'ADMIN' if i == admin else 'MEMBRO'}')" for i in ids.values())
    sql(f"INSERT INTO membro_grupo (id_grupo, id_usuario, papel) VALUES {valores}")
    return g, ids

def novo_desafio(g, criador, valor=10, horas=24 * 7, titulo="Desafio do roteiro completo"):
    d = num(f"INSERT INTO desafio (id_grupo, id_criador, id_categoria, titulo, descricao, valor_cp, tipo_recompensa, data_limite) "
            f"VALUES ({g}, {criador}, 1, '{titulo}', 'Montado pelo roteiro completo', {valor}, 'PRENDA_ACAO', "
            f"CURRENT_TIMESTAMP + INTERVAL '{horas} hours') RETURNING id_desafio")
    nivel = sql(f"SELECT nivel_filtro FROM grupo_amigos WHERE id_grupo = {g}")
    sql(f"INSERT INTO moderacao_desafio (id_grupo, id_criador, id_desafio, nivel_filtro, titulo, descricao, aprovado) "
        f"VALUES ({g}, {criador}, {d}, '{nivel}', '{titulo}', 'Montado pelo roteiro completo', TRUE)")
    return d

def aceitar(d, u, papel, escolha):
    return chamar("POST", f"/api/desafios/{d}/participantes", {"papelDesafio": papel, "escolha": escolha}, tok(u))

def enviar_prova(d, u, tipo="LINK", url="https://exemplo.com/prova", comentario=None):
    s, r = chamar("POST", f"/api/desafios/{d}/evidencias",
                  {"tipoMidia": tipo, "urlComprovante": url, "comentario": comentario}, tok(u))
    return s, r, (r.get("idEvidencia") if s == 201 and isinstance(r, dict) else None)

def votar(e, u, voto, justificativa=None):
    return chamar("POST", f"/api/validacao/evidencias/{e}/votos", {"voto": voto, "justificativa": justificativa}, tok(u))

def duelo(jurados=3, valor=10, desafiado="VAI_CUMPRIR", desafiante="NAO_VAI_CUMPRIR", apostas=(), em_andamento=True):
    """Grupo com Desafiado, Desafiante, apostadores e jurados; desafio aceito pelos dois.
    `apostas` = escolhas dos apostadores, que tambem sao jurados (RN14 so exclui os duelistas)."""
    nomes = ["Duda", "Tito"] + [f"Apo{i}" for i in range(len(apostas))] + [f"Jur{i}" for i in range(jurados)]
    g, ids = novo_grupo(nomes)
    w = {"g": g, "desafiado": ids["Duda"], "desafiante": ids["Tito"],
         "apostadores": [ids[f"Apo{i}"] for i in range(len(apostas))],
         "jurados": [ids[f"Jur{i}"] for i in range(jurados)]}
    w["d"] = novo_desafio(g, w["desafiante"], valor)
    if em_andamento:
        falhas = []
        s, _ = aceitar(w["d"], w["desafiado"], "DESAFIADO", desafiado); falhas += [] if s == 200 else [s]
        for u, esc in zip(w["apostadores"], apostas):
            s, _ = aceitar(w["d"], u, "APOSTADOR", esc); falhas += [] if s == 200 else [s]
        s, _ = aceitar(w["d"], w["desafiante"], "DESAFIANTE", desafiante); falhas += [] if s == 200 else [s]
        if falhas:
            raise RuntimeError(f"montagem do duelo falhou: {falhas}")
    return w

def saldo(g, u):
    return num(f"SELECT saldo_cp FROM membro_grupo WHERE id_grupo = {g} AND id_usuario = {u}")

def status_d(d):
    return sql(f"SELECT status FROM desafio WHERE id_desafio = {d}")

def status_e(e):
    return sql(f"SELECT status FROM evidencia WHERE id_evidencia = {e}")

def lancamentos(d, tipo, usuario=True):
    filtro = "IS NOT NULL" if usuario else "IS NULL"
    return num(f"SELECT count(*) FROM transacao_cp WHERE id_desafio = {d} AND tipo = '{tipo}' AND id_usuario {filtro}")

def recompensas_voto(e_ids):
    # RECOMPENSA_VOTO nao leva id da evidencia: conta pelos jurados que votaram nelas.
    return num("SELECT count(*) FROM jurado_evidencia WHERE voto IS NOT NULL AND id_evidencia IN (" +
               ",".join(map(str, e_ids)) + ")")

def agora_menos(dias):
    return f"CURRENT_TIMESTAMP - INTERVAL '{dias} days'"

def vencer_evidencia(e):
    sql(f"UPDATE evidencia SET data_envio = {agora_menos(8)}, data_limite_votacao = {agora_menos(1)} WHERE id_evidencia = {e}")

def vencer_desafio(d):
    sql(f"UPDATE desafio SET data_criacao = {agora_menos(10)}, data_limite = {agora_menos(1)} WHERE id_desafio = {d}")

def png(tamanho_extra=0):
    import struct, zlib
    def bloco(tipo, dados):
        return struct.pack(">I", len(dados)) + tipo + dados + struct.pack(">I", zlib.crc32(tipo + dados) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", ihdr) + bloco(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
            + bloco(b"IEND", b"") + b"\x00" * tamanho_extra)

def multipart(campo, nome, conteudo, tipo):
    limite = f"----e2e{RODADA}"
    partes = []
    if campo:
        partes.append(f"--{limite}\r\nContent-Disposition: form-data; name=\"{campo}\"; filename=\"{nome}\"\r\n"
                      f"Content-Type: {tipo}\r\n\r\n".encode() + conteudo + b"\r\n")
    else:
        partes.append(f"--{limite}\r\nContent-Disposition: form-data; name=\"outro\"\r\n\r\nnada\r\n".encode())
    corpo = b"".join(partes) + f"--{limite}--\r\n".encode()
    return corpo, f"multipart/form-data; boundary={limite}"

def enviar_foto(conteudo, nome, tipo, u, campo="arquivo"):
    corpo, ctype = multipart(campo, nome, conteudo, tipo)
    return chamar("POST", "/api/midia", token=tok(u), dados=corpo, tipo=ctype)

def em_paralelo(*funcoes):
    resultados_ = [None] * len(funcoes)
    barreira = threading.Barrier(len(funcoes))
    def rodar(i, f):
        barreira.wait()
        resultados_[i] = f()
    threads = [threading.Thread(target=rodar, args=(i, f)) for i, f in enumerate(funcoes)]
    for t in threads: t.start()
    for t in threads: t.join()
    return resultados_

hoje = datetime.date.today()
TAVIN = num("SELECT id_usuario FROM usuario WHERE email = 'octavio@email.com'")

# ===============================================================================
# 1. Acesso e cadastro
# ===============================================================================

def a10():
    nasc_hoje = hoje.replace(year=hoje.year - 16)
    nasc_amanha = nasc_hoje + datetime.timedelta(days=1)
    s1, _ = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro(f"dezesseis.{RODADA}@e2e.local", "Dezesseis Hoje"),
                                                 "apelido": "Faz16", "dataNascimento": nasc_hoje.isoformat()})
    s2, r2 = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro(f"quase16.{RODADA}@e2e.local", "Quase Dezesseis"),
                                                  "apelido": "Quase16", "dataNascimento": nasc_amanha.isoformat()})
    return s1 == 201 and s2 == 422 and codigo(r2) == "Usuario.IdadeMinima", f"16 anos hoje: {s1}; 16 anos amanha: {s2} {codigo(r2)}"
executar("A10", "Cadastro no limite da idade: 16 anos hoje entra, 16 anos amanha nao (RN26)", a10)

def a11():
    email = f"expirado.{RODADA}@e2e.local"
    s1, r1 = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro(email, "Expirado", minutos=-5),
                                                  "apelido": "Exp", "dataNascimento": "2000-01-01"})
    bom = token_cadastro(email, "Adulterado")
    cab, carga, ass = bom.split(".")
    carga_falsa = _b64(json.dumps({**json.loads(base64.urlsafe_b64decode(carga + "==")), CLAIM + "emailaddress": "octavio2@email.com"}).encode())
    s2, r2 = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": f"{cab}.{carga_falsa}.{ass}",
                                                  "apelido": "Adult", "dataNascimento": "2000-01-01"})
    nada = num(f"SELECT count(*) FROM usuario WHERE email IN ('{email}', 'octavio2@email.com')") == 0
    return (s1, s2) == (401, 401) and codigo(r1) == codigo(r2) == "Auth.CadastroExpirado" and nada, f"expirado {s1} {codigo(r1)}; adulterado {s2} {codigo(r2)}"
executar("A11", "Token de cadastro expirado ou adulterado e recusado e nada e gravado", a11)

def a12():
    s, r = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro("octavio@email.com", "Outro Octavio"),
                                                "apelido": "Clone", "dataNascimento": "2000-01-01"})
    return s == 409 and codigo(r) == "Usuario.EmailEmUso" and num("SELECT count(*) FROM usuario WHERE email = 'octavio@email.com'") == 1, f"HTTP {s} {codigo(r)}"
executar("A12", "Cadastro com e-mail que ja tem conta responde 409", a12)

def a13():
    base = {"tokenCadastro": token_cadastro(f"apelido.{RODADA}@e2e.local", "Apelido Teste"), "dataNascimento": "2000-01-01"}
    s1, _ = chamar("POST", "/api/auth/cadastro", {**base, "apelido": "  "})
    s2, _ = chamar("POST", "/api/auth/cadastro", {**base, "apelido": "x" * 51})
    return (s1, s2) == (400, 400) and num(f"SELECT count(*) FROM usuario WHERE email = 'apelido.{RODADA}@e2e.local'") == 0, f"vazio {s1}; 51 caracteres {s2}"
executar("A13", "Apelido vazio ou com 51 caracteres e recusado", a13)

def a14():
    base = {"tokenCadastro": token_cadastro(f"nasc.{RODADA}@e2e.local", "Nascimento Teste"), "apelido": "Nasc"}
    s1, _ = chamar("POST", "/api/auth/cadastro", base)
    s2, _ = chamar("POST", "/api/auth/cadastro", {**base, "dataNascimento": "1899-12-31"})
    return (s1, s2) == (400, 400), f"sem data {s1}; 1899 {s2}"
executar("A14", "Data de nascimento ausente ou antes de 1900 e recusada", a14)

def a15():
    # Repete o apelido de um usuario do proprio roteiro: repetir o de um ator do seed
    # (Tavin, Lari...) confundiria os roteiros que buscam esses atores pelo apelido.
    apelido = f"Xara{RODADA % 100000}"
    novo_usuario(apelido)
    s, r = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro(f"xara.{RODADA}@e2e.local", "Outro Xara"),
                                                "apelido": apelido, "dataNascimento": "2000-01-01"})
    iguais = num(f"SELECT count(*) FROM usuario WHERE apelido = '{apelido}'")
    return s == 201 and iguais == 2, f"HTTP {s}; usuarios com o apelido {apelido}: {iguais}"
executar("A15", "Apelido repetido e aceito: quem identifica o usuario e o id", a15)

# ===============================================================================
# 2. Sessao e seguranca
# ===============================================================================

PROTEGIDOS = [
    ("GET", "/api/categorias"), ("GET", "/api/desafios"), ("GET", "/api/desafios/1"), ("POST", "/api/desafios"),
    ("POST", "/api/desafios/1/participantes"), ("POST", "/api/desafios/1/cancelar"), ("GET", "/api/grupos"),
    ("GET", "/api/grupos/1"), ("POST", "/api/grupos"), ("PATCH", "/api/grupos/1/nivel-filtro"),
    ("POST", "/api/grupos/1/membros"), ("DELETE", "/api/grupos/1/membros/2"), ("GET", "/api/ranking/grupos/1"),
    ("GET", "/api/ranking/grupos/1/maiores-desafios"), ("GET", "/api/perfil"),
    ("POST", "/api/validacao/evidencias/1/votos"), ("GET", "/api/validacao/pendentes"),
    ("GET", "/api/validacao/minhas-provas"), ("POST", "/api/desafios/1/evidencias"), ("POST", "/api/midia"),
    ("GET", "/api/midia/00000000000000000000000000000000.png"),
]

def s01():
    falhas = []
    for metodo, rota in PROTEGIDOS:
        if rota == "/api/midia":
            # O roteamento escolhe o endpoint pelo Content-Type: JSON aqui daria 415 antes do login.
            corpo, ctype = multipart("arquivo", "x.png", png(), "image/png")
            s, _ = chamar(metodo, rota, dados=corpo, tipo=ctype)
        else:
            s, _ = chamar(metodo, rota, {} if metodo in ("POST", "PATCH") else None)
        if s != 401:
            falhas.append(f"{metodo} {rota} -> {s}")
    return not falhas, f"{len(PROTEGIDOS) - len(falhas)} de {len(PROTEGIDOS)} responderam 401" + (f"; falhas: {falhas}" if falhas else "")
executar("S01", "Todo endpoint protegido responde 401 sem token", s01)

def s02():
    s, _ = chamar("GET", "/api/grupos", token=tok(TAVIN, minutos=-5))
    return s == 401, f"token vencido ha 5 min: HTTP {s}"
executar("S02", "Token expirado e recusado", s02)

def s03():
    s1, _ = chamar("GET", "/api/grupos", token=tok(TAVIN, chave="outra-chave-qualquer-com-mais-de-32-caracteres!!"))
    cab, carga, ass = tok(TAVIN).split(".")
    claims = json.loads(base64.urlsafe_b64decode(carga + "=="))
    claims[CLAIM + "nameidentifier"] = "2"
    s2, _ = chamar("GET", "/api/grupos", token=f"{cab}.{_b64(json.dumps(claims).encode())}.{ass}")
    sem_assinatura = _b64(json.dumps({"alg": "none", "typ": "JWT"}).encode()) + "." + carga + "."
    s3, _ = chamar("GET", "/api/grupos", token=sem_assinatura)
    return (s1, s2, s3) == (401, 401, 401), f"outra chave {s1}; claim trocada {s2}; alg none {s3}"
executar("S03", "Token com outra chave, claim adulterada ou sem assinatura e recusado", s03)

# ===============================================================================
# 3. Grupos
# ===============================================================================

def g02():
    u = novo_usuario("Solo")
    s, r = chamar("GET", "/api/grupos", token=tok(u))
    return s == 200 and r == [], f"HTTP {s}: {r}"
executar("G02", "Usuario sem grupo recebe lista vazia", g02)

def g04():
    w = duelo(jurados=1, valor=15)
    s, r = chamar("GET", f"/api/grupos/{w['g']}", token=tok(w["desafiado"]))
    escrow = num(f"SELECT coalesce(sum(cp_em_escrow), 0) FROM vw_cp_em_escrow WHERE id_grupo = {w['g']}")
    return s == 200 and r["cpEmJogo"] == escrow == 30 and r["desafiosAtivos"] == 1, f"cpEmJogo {r.get('cpEmJogo') if isinstance(r, dict) else r}; vw_cp_em_escrow {escrow}"
executar("G04", "cpEmJogo do grupo bate com vw_cp_em_escrow", g04)

def g06():
    s, _ = chamar("GET", "/api/grupos/999999", token=tok(TAVIN))
    return s == 404, f"HTTP {s}"
executar("G06", "Grupo inexistente responde 404", g06)

def g29():
    g, ids = novo_grupo(["Unico"])
    s, _ = chamar("DELETE", f"/api/grupos/{g}/membros/{ids['Unico']}", token=tok(ids["Unico"]))
    restam = num(f"SELECT count(*) FROM membro_grupo WHERE id_grupo = {g}")
    saida = num(f"SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_grupo = {g} AND tipo = 'SAIDA_GRUPO'")
    return s == 204 and restam == 0 and saida == -100 and contabilidade() == 0, f"HTTP {s}; membros restantes {restam}; SAIDA_GRUPO {saida} (o grupo fica sem membros)"
executar("G29", "Unico membro, que e ADMIN, sai e o grupo fica vazio", g29)

# ===============================================================================
# 4. Desafios
# ===============================================================================

def d03():
    s, r = chamar("GET", "/api/desafios?status=ABERTA", token=tok(TAVIN))
    esperado = num(f"SELECT count(*) FROM desafio d JOIN membro_grupo m ON m.id_grupo = d.id_grupo AND m.id_usuario = {TAVIN} WHERE d.status = 'ABERTA'")
    return s == 200 and len(r) == esperado and all(x["status"] == "ABERTA" for x in r), f"{len(r) if isinstance(r, list) else r} na API, {esperado} no banco"
executar("D03", "Filtro de status na lista de desafios", d03)

def d35():
    w = duelo(jurados=3)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    j1, j2, j3 = w["jurados"]
    votar(e, j1, "VALIDO", "Vale, confere")
    votar(e, j2, "INVALIDO", "Nao mostra o combinado")
    def voto_de(visto_por, alvo):
        _, det = chamar("GET", f"/api/desafios/{w['d']}", token=tok(visto_por))
        ev = next(x for x in det["evidencias"] if x["idEvidencia"] == e)
        return next(j for j in ev["jurados"] if j["idUsuario"] == alvo)
    j2_por_j1, j1_por_j3 = voto_de(j1, j2), voto_de(j3, j1)
    ok = status_e(e) == "EM_VOTACAO" and j2_por_j1["voto"] == "INVALIDO" and j2_por_j1["justificativa"] == "Nao mostra o combinado" \
        and j1_por_j3["voto"] is None and j1_por_j3["votou"]
    return ok, f"quem votou ve {j2_por_j1['voto']}; o pendente ve {j1_por_j3['voto']} (votou={j1_por_j3['votou']})"
executar("D35", "RN29: jurado que ja votou ve os votos dos outros com a votacao aberta", d35)

def d06():
    w = duelo(jurados=1, em_andamento=False)
    s, _ = chamar("GET", f"/api/desafios/{w['d']}", token=tok(TAVIN))
    return s == 404, f"HTTP {s}"
executar("D06", "Quem nao e do grupo nao ve o desafio (404)", d06)

def d12():
    g, ids = novo_grupo(["Cria"])
    base = {"idGrupo": g, "idCategoria": 1, "titulo": "Titulo ok", "descricao": "ok", "valorCp": 10,
            "tipoRecompensa": "PRENDA_ACAO", "dataLimite": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)).isoformat()}
    s1, _ = chamar("POST", "/api/desafios", {**base, "descricao": "x" * 2001}, tok(ids["Cria"]))
    s2, _ = chamar("POST", "/api/desafios", {**base, "descricaoRecompensa": "x" * 256}, tok(ids["Cria"]))
    return (s1, s2) == (400, 400) and num(f"SELECT count(*) FROM moderacao_desafio WHERE id_grupo = {g}") == 0, f"descricao 2001: {s1}; recompensa 256: {s2}"
executar("D12", "Descricao e recompensa acima do limite sao barradas antes da IA", d12)

def d14():
    g, ids = novo_grupo(["Cria"])
    s, r = chamar("POST", "/api/desafios", {"idGrupo": g, "idCategoria": 99999, "titulo": "Categoria fantasma", "descricao": "ok",
                                           "valorCp": 10, "tipoRecompensa": "PRENDA_ACAO",
                                           "dataLimite": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)).isoformat()}, tok(ids["Cria"]))
    return s == 400 and codigo(r) == "Desafio.CategoriaInexistente" and num(f"SELECT count(*) FROM moderacao_desafio WHERE id_grupo = {g}") == 0, f"HTTP {s} {codigo(r)}"
executar("D14", "Categoria inexistente e recusada sem chamar a IA", d14)

def d19():
    w = duelo(jurados=1, em_andamento=False)
    aceitar(w["d"], w["desafiado"], "DESAFIADO", "VAI_CUMPRIR")
    apostador = w["jurados"][0]
    s, _ = aceitar(w["d"], apostador, "APOSTADOR", "NAO_VAI_CUMPRIR")
    return s == 200 and saldo(w["g"], apostador) == 90 and status_d(w["d"]) == "ABERTA" and contabilidade() == 0, f"HTTP {s}; saldo {saldo(w['g'], apostador)}; status {status_d(w['d'])}"
executar("D19", "Apostador entra com o desafio ABERTA: debitado e status inalterado", d19)

def d20_d21():
    w = duelo(jurados=2, em_andamento=False)
    aceitar(w["d"], w["desafiado"], "DESAFIADO", "VAI_CUMPRIR")
    outro = w["jurados"][0]
    s1, r1 = aceitar(w["d"], outro, "DESAFIADO", "VAI_CUMPRIR")
    s2, r2 = aceitar(w["d"], w["desafiado"], "APOSTADOR", "NAO_VAI_CUMPRIR")
    caso("D20", "Papel DESAFIADO ja ocupado: 409 e nada debitado (RN09)",
         s1 == 409 and codigo(r1) == "Desafio.PapelJaOcupado" and saldo(w["g"], outro) == 100, f"HTTP {s1} {codigo(r1)}; saldo {saldo(w['g'], outro)}")
    caso("D21", "Quem ja participa nao entra de novo com outro papel",
         s2 == 409 and codigo(r2) == "Desafio.JaParticipa" and saldo(w["g"], w["desafiado"]) == 90, f"HTTP {s2} {codigo(r2)}; saldo {saldo(w['g'], w['desafiado'])}")
try:
    d20_d21()
except Exception as e:
    caso("D20", "Papel DESAFIADO ja ocupado", False, e); caso("D21", "Quem ja participa", False, e)

def d22():
    g, ids = novo_grupo(["Cria", "Pobre"])
    d = novo_desafio(g, ids["Cria"], valor=150)
    s, r = aceitar(d, ids["Pobre"], "DESAFIADO", "VAI_CUMPRIR")
    return s == 409 and codigo(r) == "Desafio.SaldoInsuficiente" and saldo(g, ids["Pobre"]) == 100, f"HTTP {s} {codigo(r)}; saldo {saldo(g, ids['Pobre'])}"
executar("D22", "Saldo menor que o custo: 409 e saldo intacto (RN08)", d22)

def d23():
    w = duelo(jurados=2)
    s1, r1 = aceitar(w["d"], w["jurados"][0], "APOSTADOR", "VAI_CUMPRIR")
    w2 = duelo(jurados=1, em_andamento=False)
    chamar("POST", f"/api/desafios/{w2['d']}/cancelar", {"motivo": "fim"}, tok(w2["desafiante"]))
    s2, r2 = aceitar(w2["d"], w2["jurados"][0], "APOSTADOR", "VAI_CUMPRIR")
    return (s1, s2) == (409, 409) and codigo(r1) == codigo(r2) == "Desafio.NaoAceitaParticipante", f"EM_ANDAMENTO {s1} {codigo(r1)}; CANCELADA {s2} {codigo(r2)}"
executar("D23", "Nao se entra em desafio EM_ANDAMENTO nem em desafio encerrado", d23)

def d24():
    w = duelo(jurados=1, em_andamento=False)
    s1, _ = aceitar(w["d"], w["desafiado"], "REI", "VAI_CUMPRIR")
    s2, _ = aceitar(w["d"], w["desafiado"], "DESAFIADO", "TALVEZ")
    return (s1, s2) == (400, 400) and saldo(w["g"], w["desafiado"]) == 100, f"papel invalido {s1}; escolha invalida {s2}"
executar("D24", "Papel ou escolha fora do dominio: 400", d24)

def d25():
    w = duelo(jurados=1, em_andamento=False)
    s, _ = aceitar(w["d"], TAVIN, "APOSTADOR", "VAI_CUMPRIR")
    return s == 404, f"HTTP {s} (esperado 404, como o GET do desafio)"
executar("D25", "Quem nao e do grupo tenta aceitar: 404, sem revelar o desafio", d25)

def d26_d33():
    s1, _ = aceitar(999999, TAVIN, "APOSTADOR", "VAI_CUMPRIR")
    s2, _ = chamar("POST", "/api/desafios/999999/cancelar", {"motivo": "x"}, tok(TAVIN))
    caso("D26", "Aceitar desafio inexistente: 404", s1 == 404, f"HTTP {s1}")
    caso("D33", "Cancelar desafio inexistente: 404", s2 == 404, f"HTTP {s2}")
d26_d33()

def d28():
    g, ids = novo_grupo(["Cria"])
    d = novo_desafio(g, ids["Cria"])
    s, _ = chamar("POST", f"/api/desafios/{d}/cancelar", {"motivo": "Ninguem topou"}, tok(ids["Cria"]))
    lanc = num(f"SELECT count(*) FROM transacao_cp WHERE id_desafio = {d}")
    return s == 200 and status_d(d) == "CANCELADA" and lanc == 0, f"HTTP {s}; {status_d(d)}; lancamentos {lanc}"
executar("D28", "Cancelar ABERTA sem participantes: CANCELADA sem lancamentos", d28)

def d29_d30_d31():
    w = duelo(jurados=1)
    s1, r1 = chamar("POST", f"/api/desafios/{w['d']}/cancelar", {"motivo": "   "}, tok(w["desafiante"]))
    s2, r2 = chamar("POST", f"/api/desafios/{w['d']}/cancelar", {"motivo": "Nao sou o criador"}, tok(w["desafiado"]))
    caso("D29", "Cancelar sem motivo: 400", s1 == 400 and codigo(r1) == "Desafio.MotivoObrigatorio" and status_d(w["d"]) == "EM_ANDAMENTO", f"HTTP {s1} {codigo(r1)}")
    caso("D30", "Quem nao e o criador nao cancela: 403", s2 == 403 and codigo(r2) == "Desafio.SomenteCriadorCancela" and status_d(w["d"]) == "EM_ANDAMENTO", f"HTTP {s2} {codigo(r2)}")
    chamar("POST", f"/api/desafios/{w['d']}/cancelar", {"motivo": "Agora sim"}, tok(w["desafiante"]))
    s3, r3 = chamar("POST", f"/api/desafios/{w['d']}/cancelar", {"motivo": "De novo"}, tok(w["desafiante"]))
    caso("D31", "Cancelar desafio ja encerrado: 409", s3 == 409 and codigo(r3) == "Desafio.JaEncerrado" and contabilidade() == 0, f"HTTP {s3} {codigo(r3)}")
try:
    d29_d30_d31()
except Exception as e:
    for i in ("D29", "D30", "D31"): caso(i, "cancelamento", False, e)

def d32():
    w = duelo(jurados=3)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    votar(e, w["jurados"][0], "VALIDO")
    s, _ = chamar("POST", f"/api/desafios/{w['d']}/cancelar", {"motivo": "Cancelado com prova no juri"}, tok(w["desafiante"]))
    sv, rv = votar(e, w["jurados"][1], "VALIDO")
    rec = num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'")
    ok = s == 200 and status_d(w["d"]) == "CANCELADA" and status_e(e) == "EXPIRADA" and sv == 409         and codigo(rv) == "Evidencia.NaoEstaEmVotacao" and rec == 0 and contabilidade() == 0
    return ok, f"cancelar {s}; evidencia {status_e(e)}; voto depois do cancelamento HTTP {sv} {codigo(rv)}; recompensas de voto {rec}"
executar("D32", "RN12: cancelar com prova no juri expira a prova; ninguem vota nem recebe CP depois", d32)

# ===============================================================================
# 5. Evidencia e votacao
# ===============================================================================

def v03_v04():
    w1, w2 = duelo(jurados=1), duelo(jurados=1)
    s1, _, e1 = enviar_prova(w1["d"], w1["desafiado"], tipo="TEXTO", url="Corri os 5 km no parque, o Tito viu")
    s2, _, e2 = enviar_prova(w2["d"], w2["desafiado"], tipo="VIDEO", url="https://video.exemplo.com/prova.mp4")
    caso("V03", "Prova TEXTO (relato sem URL) e aceita", s1 == 201 and status_d(w1["d"]) == "EM_VOTACAO", f"HTTP {s1}")
    caso("V04", "Prova VIDEO e aceita", s2 == 201 and status_d(w2["d"]) == "EM_VOTACAO", f"HTTP {s2}")
v03_v04()

def v05():
    w = duelo(jurados=2, apostas=("VAI_CUMPRIR",))
    resp = [enviar_prova(w["d"], u)[:2] for u in (w["desafiante"], w["apostadores"][0], w["jurados"][0])]
    ok = all(s == 403 and codigo(r) == "Evidencia.SomenteDesafiadoEnvia" for s, r in resp) and status_d(w["d"]) == "EM_ANDAMENTO"
    return ok, "desafiante/apostador/membro: " + ", ".join(str(s) for s, _ in resp)
executar("V05", "So o Desafiado envia prova (403 para os demais)", v05)

def v06():
    aberto = duelo(jurados=1, em_andamento=False)
    aceitar(aberto["d"], aberto["desafiado"], "DESAFIADO", "VAI_CUMPRIR")
    s1, r1, _ = enviar_prova(aberto["d"], aberto["desafiado"])
    cancelado = duelo(jurados=1)
    chamar("POST", f"/api/desafios/{cancelado['d']}/cancelar", {"motivo": "fim"}, tok(cancelado["desafiante"]))
    s2, r2, _ = enviar_prova(cancelado["d"], cancelado["desafiado"])
    fim = duelo(jurados=1)
    _, _, e = enviar_prova(fim["d"], fim["desafiado"])
    votar(e, fim["jurados"][0], "VALIDO")
    s3, r3, _ = enviar_prova(fim["d"], fim["desafiado"])
    cods = {codigo(r1), codigo(r2), codigo(r3)}
    return (s1, s2, s3) == (409, 409, 409) and cods == {"Evidencia.DesafioNaoAceitaEvidencia"} and status_d(fim["d"]) == "FINALIZADA_CUMPRIU", \
        f"ABERTA {s1}; CANCELADA {s2}; FINALIZADA {s3}; {cods}"
executar("V06", "Prova em desafio ABERTA, CANCELADA ou finalizado: 409", v06)

def v07_v08_v16():
    w = duelo(jurados=3)
    _, _, e1 = enviar_prova(w["d"], w["desafiado"])
    s, r, _ = enviar_prova(w["d"], w["desafiado"])
    caso("V07", "Segunda prova com a primeira ainda no juri: 409", s == 409 and codigo(r) == "Evidencia.AnteriorEmVotacao", f"HTTP {s} {codigo(r)}")
    for j in w["jurados"][:2]:
        votar(e1, j, "INVALIDO", "Nao mostra")
    rec = num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'")
    caso("V16", "Votos INVALIDO ate o quorum: RECUSADA, 2 CP por votante, desafio segue EM_VOTACAO",
         status_e(e1) == "RECUSADA" and rec == 2 and status_d(w["d"]) == "EM_VOTACAO" and saldo(w["g"], w["jurados"][0]) == 102,
         f"evidencia {status_e(e1)}; desafio {status_d(w['d'])}; recompensas {rec}; saldo do jurado {saldo(w['g'], w['jurados'][0])}")
    s2, _, e2 = enviar_prova(w["d"], w["desafiado"])
    ordem = num(f"SELECT ordem FROM evidencia WHERE id_evidencia = {e2}") if e2 else 0
    juri = num(f"SELECT count(*) FROM jurado_evidencia WHERE id_evidencia = {e2}") if e2 else 0
    caso("V08", "Nova prova depois de uma RECUSADA: ordem 2 e juri novo", s2 == 201 and ordem == 2 and juri == 3, f"HTTP {s2}; ordem {ordem}; jurados {juri}")
try:
    v07_v08_v16()
except Exception as e:
    for i in ("V07", "V16", "V08"): caso(i, "envio e recusa", False, e)

def v09_v10():
    w = duelo(jurados=1)
    invalidos_url = [("LINK", "ftp://exemplo.com/x"), ("LINK", "www.exemplo.com"), ("FOTO", "javascript:alert(1)"), ("VIDEO", "video")]
    r09 = [enviar_prova(w["d"], w["desafiado"], t, u)[0] for t, u in invalidos_url]
    r10 = [enviar_prova(w["d"], w["desafiado"], "AUDIO", "https://x.com")[0],
           enviar_prova(w["d"], w["desafiado"], "LINK", "")[0],
           enviar_prova(w["d"], w["desafiado"], "LINK", "https://x.com/" + "a" * 490)[0],
           enviar_prova(w["d"], w["desafiado"], "LINK", "https://x.com", "c" * 1001)[0]]
    sem_prova = num(f"SELECT count(*) FROM evidencia WHERE id_desafio = {w['d']}") == 0
    caso("V09", "LINK, FOTO ou VIDEO sem http(s): 400", r09 == [400] * 4 and sem_prova, f"{r09}")
    caso("V10", "Tipo invalido, URL vazia, URL com 501 e comentario com 1001: 400", r10 == [400] * 4 and sem_prova, f"{r10}")
v09_v10()

def v11():
    g, ids = novo_grupo(["Duda", "Tito"])
    d = novo_desafio(g, ids["Tito"])
    aceitar(d, ids["Duda"], "DESAFIADO", "VAI_CUMPRIR")
    aceitar(d, ids["Tito"], "DESAFIANTE", "NAO_VAI_CUMPRIR")
    s, r, e = enviar_prova(d, ids["Duda"])
    provas = num(f"SELECT count(*) FROM evidencia WHERE id_desafio = {d}")
    return s == 409 and codigo(r) == "Evidencia.SemJuri" and provas == 0 and status_d(d) == "EM_ANDAMENTO",         f"HTTP {s} {codigo(r)}; provas gravadas: {provas}"
executar("V11", "RN14: grupo so com os duelistas recusa a prova, que ficaria sem juri", v11)

def v13_v14_v21():
    w = duelo(jurados=2)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    retard = novo_usuario("Retard")
    sql(f"INSERT INTO membro_grupo (id_grupo, id_usuario) VALUES ({w['g']}, {retard})")
    ve = lambda u: any(p["idEvidencia"] == e for p in chamar("GET", "/api/validacao/pendentes", token=tok(u))[1])
    caso("V13", "Pendentes nao mostra a prova ao Desafiado nem ao Desafiante", not ve(w["desafiado"]) and not ve(w["desafiante"]) and ve(w["jurados"][0]), "")
    caso("V14", "Pendentes nao mostra a prova a quem entrou depois do envio (juri congelado)", not ve(retard), "")
    votos = [votar(e, u, "VALIDO") for u in (w["desafiado"], w["desafiante"], retard, TAVIN)]
    ok = all(s == 403 and codigo(r) == "Evidencia.NaoEhValidador" for s, r in votos) and \
        num(f"SELECT count(*) FROM jurado_evidencia WHERE id_evidencia = {e} AND voto IS NOT NULL") == 0
    caso("V21", "Desafiado, Desafiante, Retardatario e Forasteiro nao votam (403)", ok, "; ".join(f"{s} {codigo(r)}" for s, r in votos))
try:
    v13_v14_v21()
except Exception as e:
    for i in ("V13", "V14", "V21"): caso(i, "juri", False, e)

def v17_j03():
    w = duelo(jurados=3)
    provas = []
    for _ in range(3):
        _, _, e = enviar_prova(w["d"], w["desafiado"])
        provas.append(e)
        for j in w["jurados"][:2]:
            votar(e, j, "INVALIDO")
    premio = num(f"SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_desafio = {w['d']} AND tipo = 'PREMIO' AND id_usuario = {w['desafiante']}")
    s4, r4, _ = enviar_prova(w["d"], w["desafiado"])
    ok = status_d(w["d"]) == "FINALIZADA_PERDEU" and premio == 20 and saldo(w["g"], w["desafiado"]) == 90 and s4 == 409 and contabilidade() == 0
    detalhe = f"desafio {status_d(w['d'])}; premio ao desafiante {premio}; quarta prova HTTP {s4}"
    caso("V17", "Terceira prova RECUSADA encerra contra o desafiado; pote aos NAO_VAI_CUMPRIR", ok, detalhe)
    caso("J03", "Jornada: tres provas recusadas e o desafio perdido", ok and recompensas_voto(provas) == 6, detalhe + f"; votos pagos {recompensas_voto(provas)}")
try:
    v17_j03()
except Exception as e:
    caso("V17", "terceira recusa", False, e); caso("J03", "tres recusas", False, e)

def v19():
    w = duelo(jurados=4)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    for j, voto in zip(w["jurados"], ("VALIDO", "VALIDO", "INVALIDO", "INVALIDO")):
        votar(e, j, voto)
    return status_e(e) == "EM_VOTACAO" and status_d(w["d"]) == "EM_VOTACAO", f"4 jurados, quorum 3, 2 x 2: evidencia {status_e(e)}"
executar("V19", "Empate dentro do prazo mantem a votacao aberta (RN16)", v19)

def v22():
    w = duelo(jurados=3)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    votar(e, w["jurados"][0], "VALIDO"); votar(e, w["jurados"][1], "VALIDO")
    s, r = votar(e, w["jurados"][2], "INVALIDO")
    return s == 409 and codigo(r) == "Evidencia.NaoEstaEmVotacao", f"HTTP {s} {codigo(r)}"
executar("V22", "Voto em prova ja decidida: 409", v22)

def v24_v25():
    w = duelo(jurados=1)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    s1, _ = votar(e, w["jurados"][0], "TALVEZ")
    s2, _ = votar(e, w["jurados"][0], "VALIDO", "j" * 256)
    s3, _ = votar(999999, w["jurados"][0], "VALIDO")
    caso("V24", "Voto TALVEZ e justificativa com 256 caracteres: 400", (s1, s2) == (400, 400) and status_e(e) == "EM_VOTACAO", f"{s1}, {s2}")
    caso("V25", "Voto em prova inexistente: 404", s3 == 404, f"HTTP {s3}")
v24_v25()

def v26():
    w = duelo(jurados=3, valor=25, apostas=("VAI_CUMPRIR", "VAI_CUMPRIR"))
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"]:
        votar(e, j, "VALIDO")
    premios = sql(f"SELECT string_agg(valor::text, ',' ORDER BY id_transacao) FROM transacao_cp WHERE id_desafio = {w['d']} AND tipo = 'PREMIO' AND id_usuario IS NOT NULL")
    valores = [int(x) for x in premios.split(",")] if premios else []
    return status_d(w["d"]) == "FINALIZADA_CUMPRIU" and sum(valores) == 100 and sorted(valores) == [33, 33, 34] and valores[0] == 34 and contabilidade() == 0, \
        f"pote 100 entre 3 vencedores: {valores}"
executar("V26", "Pote que nao divide exato: o resto vai ao primeiro vencedor e a soma fecha (RN23)", v26)

def v32():
    s, r = chamar("GET", "/api/validacao/minhas-provas", token=tok(novo_usuario("SemProva")))
    return s == 200 and r == [], f"HTTP {s}: {r}"
executar("V32", "minhas-provas de quem nao tem prova no juri: lista vazia", v32)

# ===============================================================================
# 6. Foto da prova
# ===============================================================================

def m_foto():
    w = duelo(jurados=1)
    u = w["desafiado"]
    jpg = b"\xff\xd8\xff\xe0" + b"\x00" * 64
    webp = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 64
    s_jpg, r_jpg = enviar_foto(jpg, "prova.jpg", "image/jpeg", u)
    s_webp, _ = enviar_foto(webp, "prova.webp", "image/webp", u)
    caso("M02", "JPG e WebP sao aceitos", (s_jpg, s_webp) == (201, 201), f"JPG {s_jpg}; WebP {s_webp}")
    s, _ = enviar_foto(b"", "", "", u, campo=None)
    caso("M03", "Envio sem arquivo: 400", s == 400, f"HTTP {s}")
    s, _ = enviar_foto(png(9 * 1024 * 1024), "grande.png", "image/png", u)
    caso("M04", "Foto acima de 8 MB: 400", s == 400, f"HTTP {s}")
    s, _ = enviar_foto(b"isto e um texto qualquer", "texto.png", "image/png", u)
    caso("M05", "Texto com extensao .png: 400 (tipo pelos primeiros bytes)", s == 400, f"HTTP {s}")
    original = png()
    s, r = enviar_foto(original, "prova.png", "image/png", u)
    url = r.get("url") if isinstance(r, dict) else ""
    cab = {}
    s_get, corpo = chamar("GET", url, token=tok(u), cabecalhos=cab)
    caso("M07", "Foto lida de volta: mesmos bytes e Cache-Control private",
         s == 201 and s_get == 200 and corpo == original and "private" in cab.get("Cache-Control", ""), f"POST {s}; GET {s_get}; {cab.get('Cache-Control')}")
    s1, _ = chamar("GET", "/api/midia/..%2F..%2Fetc%2Fpasswd", token=tok(u))
    s2, _ = chamar("GET", "/api/midia/foto-qualquer.png", token=tok(u))
    caso("M08", "Nome com ../ ou fora do formato: 404", (s1, s2) == (404, 404), f"../ {s1}; formato {s2}")
    s, _ = chamar("GET", "/api/midia/" + "ab" * 16 + ".png", token=tok(u))
    caso("M09", "Nome valido que nao existe: 404", s == 404, f"HTTP {s}")
    s, corpo = chamar("GET", url, token=tok(TAVIN))
    caso("M10", "Forasteiro logado le a foto pela URL (ADR 0022 exige so login)", s == 200 and corpo == original, f"HTTP {s}")
try:
    m_foto()
except Exception as e:
    for i in ("M02", "M03", "M04", "M05", "M07", "M08", "M09", "M10"): caso(i, "foto", False, e)

# ===============================================================================
# 7. Ranking e perfil
# ===============================================================================

def k03():
    w = duelo(jurados=2)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"]:
        votar(e, j, "VALIDO")
    _, rk = chamar("GET", f"/api/ranking/grupos/{w['g']}", token=tok(w["desafiado"]))
    lin = {x["idUsuario"]: x for x in rk}
    dd, dt = lin[w["desafiado"]], lin[w["desafiante"]]
    ok = (dd["acertos"], dd["erros"], dd["cpGanhoEmPremios"]) == (1, 0, 20) and (dt["acertos"], dt["erros"], dt["cpGanhoEmPremios"]) == (0, 1, 0)
    return ok, f"desafiado {dd['acertos']}/{dd['erros']}/{dd['cpGanhoEmPremios']}; desafiante {dt['acertos']}/{dt['erros']}/{dt['cpGanhoEmPremios']}"
executar("K03", "Ranking: acertos, erros e CP de premio depois de um desafio finalizado", k03)

def k04_k05():
    s, r = chamar("GET", "/api/ranking/grupos/1/maiores-desafios", token=tok(TAVIN))
    esperado = sql("SELECT string_agg(id_desafio::text, ',') FROM (SELECT a.id_desafio, a.valor_cp * COUNT(p.id_participante) pote FROM desafio a "
                   "LEFT JOIN participante_desafio p ON p.id_desafio = a.id_desafio WHERE a.id_grupo = 1 GROUP BY a.id_desafio ORDER BY pote DESC LIMIT 10) x")
    potes = [x["poteTotalCp"] for x in r] if s == 200 else []
    caso("K04", "Maiores desafios do grupo: ate 10, do maior pote para o menor",
         s == 200 and len(r) <= 10 and potes == sorted(potes, reverse=True) and len(r) == len(esperado.split(",")), f"HTTP {s}; potes {potes}")
    s2, _ = chamar("GET", "/api/ranking/grupos/2/maiores-desafios", token=tok(num("SELECT id_usuario FROM usuario WHERE email = 'gabriel@email.com'")))
    caso("K05", "Maiores desafios para quem nao e do grupo: 404", s2 == 404, f"HTTP {s2}")
k04_k05()

def k07_k08():
    s, r = chamar("GET", "/api/perfil", token=tok(TAVIN))
    ultimos = {}
    for x in r["extrato"]:
        ultimos.setdefault(x["grupo"], x["saldoApos"])
    saldos = {x["grupo"]: x["saldoCp"] for x in r["saldos"]}
    divergentes = {g: (v, saldos.get(g)) for g, v in ultimos.items() if g in saldos and v != saldos[g]}
    caso("K07", "Extrato do perfil: saldo depois do ultimo lancamento igual ao saldo do membro", s == 200 and not divergentes, f"divergencias: {divergentes}")
    h = r["historico"]
    esperado = [num(f"SELECT count(*) FROM desafio WHERE id_criador = {TAVIN}"), num(f"SELECT count(*) FROM participante_desafio WHERE id_usuario = {TAVIN}"),
                num(f"SELECT count(*) FROM evidencia WHERE id_usuario = {TAVIN}")]
    caso("K08", "Historico do perfil bate com o banco", [h["desafiosCriadas"], h["participacoes"], h["evidenciasEnviadas"]] == esperado, f"{h} x {esperado}")
k07_k08()

# ===============================================================================
# 9. Jornadas (as que nao dependem de prazo)
# ===============================================================================

def j02():
    w = duelo(jurados=2, valor=10, apostas=("VAI_CUMPRIR", "NAO_VAI_CUMPRIR"))
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"] + [w["apostadores"][0]]:
        votar(e, j, "VALIDO")
    ganhou = lambda u: num(f"SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_desafio = {w['d']} AND tipo = 'PREMIO' AND id_usuario = {u}")
    a_vai, a_nao = w["apostadores"]
    ok = status_d(w["d"]) == "FINALIZADA_CUMPRIU" and ganhou(w["desafiado"]) + ganhou(a_vai) == 40 and ganhou(w["desafiante"]) == 0 and ganhou(a_nao) == 0 and contabilidade() == 0
    return ok, f"desafiado {ganhou(w['desafiado'])}, apostador VAI {ganhou(a_vai)}, desafiante {ganhou(w['desafiante'])}, apostador NAO {ganhou(a_nao)}"
executar("J02", "Jornada com apostadores dos dois lados: so os acertadores dividem o pote", j02)

def j04():
    w = duelo(jurados=3)
    _, _, e1 = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"][:2]: votar(e1, j, "INVALIDO")
    _, _, e2 = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"][1:]: votar(e2, j, "VALIDO")
    rec = num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'")
    return status_d(w["d"]) == "FINALIZADA_CUMPRIU" and rec == 4 and saldo(w["g"], w["jurados"][1]) == 104 and contabilidade() == 0, \
        f"desafio {status_d(w['d'])}; recompensas {rec}; jurado das duas provas {saldo(w['g'], w['jurados'][1])}"
executar("J04", "Jornada: primeira prova recusada, segunda aceita; votantes das duas recebem", j04)

def j08():
    email = f"novata.{RODADA}@e2e.local"
    s1, r1 = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": token_cadastro(email, "Novata Teste"), "apelido": "Novata", "dataNascimento": "2001-02-03"})
    token = r1.get("token") if isinstance(r1, dict) else None
    g, ids = novo_grupo(["Anfi", "Tito"])
    s2, _ = chamar("POST", f"/api/grupos/{g}/membros", {"email": email}, tok(ids["Anfi"]))
    d = novo_desafio(g, ids["Tito"])
    s3, _ = chamar("POST", f"/api/desafios/{d}/participantes", {"papelDesafio": "DESAFIADO", "escolha": "VAI_CUMPRIR"}, token)
    nova = num(f"SELECT id_usuario FROM usuario WHERE email = '{email}'")
    return (s1, s2, s3) == (201, 201, 200) and saldo(g, nova) == 90, f"cadastro {s1}; convite {s2}; aceite com o token da sessao {s3}; saldo {saldo(g, nova)} (sem o passo do Google: A06/A07)"
executar("J08", "Jornada: cadastro, convite e aceite com a sessao devolvida pelo cadastro", j08)

# ===============================================================================
# 11. Concorrencia
# ===============================================================================

def repetir(fn, vezes=5):
    def rodar():
        detalhes = []
        for i in range(vezes):
            ok, det = fn()
            detalhes.append(det)
            if not ok:
                return False, f"falhou na tentativa {i + 1} de {vezes}: {det}"
        return True, f"{vezes} tentativas; ultima: {detalhes[-1]}"
    return rodar

def c01():
    w = duelo(jurados=3)
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    r = em_paralelo(lambda: votar(e, w["jurados"][0], "VALIDO"), lambda: votar(e, w["jurados"][1], "VALIDO"))
    premios = lancamentos(w["d"], "PREMIO")
    rec = num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'")
    return status_e(e) == "ACEITA" and premios == 1 and rec == 2 and contabilidade() == 0, f"HTTP {[x[0] for x in r]}; premios {premios}; recompensas {rec}"
executar("C01", "Dois votos simultaneos que fecham o quorum: uma apuracao, pagamento unico (5 tentativas)", repetir(c01))

def c02():
    w = duelo(jurados=2, em_andamento=False)
    a, b = w["jurados"]
    r = em_paralelo(lambda: aceitar(w["d"], a, "DESAFIADO", "VAI_CUMPRIR"), lambda: aceitar(w["d"], b, "DESAFIADO", "VAI_CUMPRIR"))
    st = sorted(x[0] for x in r)
    return st == [200, 409] and contabilidade() == 0, f"HTTP {st}"
executar("C02", "Dois aceites simultaneos no mesmo papel: um 200, outro 409 (5 tentativas)", repetir(c02))

def c03():
    g, ids = novo_grupo(["Cria", "Gasta"])
    d1, d2 = novo_desafio(g, ids["Cria"], valor=60), novo_desafio(g, ids["Cria"], valor=60)
    r = em_paralelo(lambda: aceitar(d1, ids["Gasta"], "DESAFIADO", "VAI_CUMPRIR"), lambda: aceitar(d2, ids["Gasta"], "DESAFIADO", "VAI_CUMPRIR"))
    st = sorted(x[0] for x in r)
    return st == [200, 409] and saldo(g, ids["Gasta"]) == 40 and contabilidade() == 0, f"HTTP {st}; saldo {saldo(g, ids['Gasta'])}"
executar("C03", "Dois aceites simultaneos com saldo para um so: um 200, outro 409 (5 tentativas)", repetir(c03))

def c04():
    w = duelo(jurados=2)
    r = em_paralelo(lambda: enviar_prova(w["d"], w["desafiado"])[:2], lambda: enviar_prova(w["d"], w["desafiado"])[:2])
    st = sorted(x[0] for x in r)
    return st == [201, 409] and num(f"SELECT count(*) FROM evidencia WHERE id_desafio = {w['d']}") == 1, f"HTTP {st}"
executar("C04", "Dois envios simultaneos de prova: um 201, outro 409 (5 tentativas)", repetir(c04))

def c05():
    _seq[0] += 1
    email = f"gemeo.{RODADA}.{_seq[0]}@e2e.local"
    corpo = {"tokenCadastro": token_cadastro(email, "Gemeo"), "apelido": "Gemeo", "dataNascimento": "2000-01-01"}
    r = em_paralelo(lambda: chamar("POST", "/api/auth/cadastro", corpo), lambda: chamar("POST", "/api/auth/cadastro", corpo))
    st = sorted(x[0] for x in r)
    return st == [201, 409] and num(f"SELECT count(*) FROM usuario WHERE email = '{email}'") == 1, f"HTTP {st}"
executar("C05", "Dois cadastros simultaneos com o mesmo e-mail: um 201, outro 409 (5 tentativas)", repetir(c05))

# ===============================================================================
# 10. Prazos (PrazosWorker) - fase 2
# ===============================================================================

prazo = {}
def montar_prazos():
    # P01 / J05: prova sem nenhum voto ate o prazo.
    w = duelo(jurados=3); _, _, e = enviar_prova(w["d"], w["desafiado"]); vencer_evidencia(e); prazo["P01"] = (w, e)
    # P02 / J06: prova com votos, sem maioria, ate o prazo.
    w = duelo(jurados=3); _, _, e = enviar_prova(w["d"], w["desafiado"]); votar(e, w["jurados"][0], "VALIDO"); vencer_evidencia(e); prazo["P02"] = (w, e)
    # P03: duas recusadas e a terceira vence sem votos.
    w = duelo(jurados=3)
    for _ in range(2):
        _, _, e = enviar_prova(w["d"], w["desafiado"])
        for j in w["jurados"][:2]: votar(e, j, "INVALIDO")
    _, _, e = enviar_prova(w["d"], w["desafiado"]); vencer_evidencia(e); prazo["P03"] = (w, e)
    # P04 / J07: desafio ABERTA vencido com um participante.
    w = duelo(jurados=1, em_andamento=False); aceitar(w["d"], w["desafiado"], "DESAFIADO", "VAI_CUMPRIR"); vencer_desafio(w["d"]); prazo["P04"] = (w, None)
    # P05: desafio EM_ANDAMENTO vencido, sem prova.
    w = duelo(jurados=1); vencer_desafio(w["d"]); prazo["P05"] = (w, None)
    # V23: voto depois do prazo, antes de o worker apurar.
    w = duelo(jurados=2); _, _, e = enviar_prova(w["d"], w["desafiado"]); vencer_evidencia(e)
    s, r = votar(e, w["jurados"][0], "VALIDO")
    caso("V23", "Voto depois do prazo, antes de o worker apurar: 409", s == 409 and codigo(r) == "Evidencia.PrazoExpirado", f"HTTP {s} {codigo(r)}")

try:
    montar_prazos()
    reiniciar_api()
    esperar(lambda: status_e(prazo["P01"][1]) != "EM_VOTACAO" and status_d(prazo["P04"][0]["d"]) != "ABERTA", 60)

    w, e = prazo["P01"]
    ok = status_e(e) == "EXPIRADA" and num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'") == 0
    caso("P01", "Prova vencida sem votos: EXPIRADA", ok, f"evidencia {status_e(e)}")
    caso("J05", "Jornada: prova sem nenhum voto ate o prazo expira e ninguem recebe 2 CP", ok and status_d(w["d"]) == "EM_VOTACAO", f"evidencia {status_e(e)}; desafio {status_d(w['d'])}")

    w, e = prazo["P02"]
    rec = num(f"SELECT count(*) FROM transacao_cp WHERE id_grupo = {w['g']} AND tipo = 'RECOMPENSA_VOTO'")
    ok = status_e(e) == "RECUSADA" and rec == 1
    caso("P02", "Prova vencida com votos e sem maioria: RECUSADA", ok, f"evidencia {status_e(e)}; recompensas {rec}")
    caso("J06", "Jornada: votos sem maioria ate o prazo; votantes recebem 2 CP", ok and saldo(w["g"], w["jurados"][0]) == 102, f"saldo do votante {saldo(w['g'], w['jurados'][0])}")

    w, e = prazo["P03"]
    caso("P03", "Terceira prova nao aceita, por prazo, encerra o desafio", status_e(e) == "EXPIRADA" and status_d(w["d"]) == "FINALIZADA_PERDEU", f"evidencia {status_e(e)}; desafio {status_d(w['d'])}")

    w, _ = prazo["P04"]
    est = num(f"SELECT count(*) FROM transacao_cp WHERE id_desafio = {w['d']} AND tipo = 'ESTORNO' AND id_usuario = {w['desafiado']}")
    motivo = sql(f"SELECT coalesce(motivo_cancelamento, '') FROM desafio WHERE id_desafio = {w['d']}")
    ok = status_d(w["d"]) == "CANCELADA" and est == 1 and saldo(w["g"], w["desafiado"]) == 100 and "Prazo" in motivo
    caso("P04", "Desafio ABERTA vencido: CANCELADA com motivo de prazo e estorno", ok, f"{status_d(w['d'])}; estornos {est}; motivo '{motivo}'")
    caso("J07", "Jornada: desafio que ninguem completou vence e quem entrou recebe de volta", ok, f"saldo do desafiado {saldo(w['g'], w['desafiado'])}")

    w, _ = prazo["P05"]
    escrow = num(f"SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_desafio = {w['d']} AND id_usuario IS NULL")
    premio = num(f"SELECT coalesce(sum(valor), 0) FROM transacao_cp WHERE id_desafio = {w['d']} AND tipo = 'PREMIO' AND id_usuario = {w['desafiante']}")
    caso("P05", "RN30: desafio EM_ANDAMENTO vencido sem prova encerra como perdido e paga quem apostou contra",
         status_d(w["d"]) == "FINALIZADA_PERDEU" and escrow == 0 and premio == 20,
         f"desafio {status_d(w['d'])}; CP em escrow {escrow}; premio do desafiante {premio}")

    foto = sql("SELECT count(*) || '/' || coalesce(sum(valor), 0) FROM transacao_cp")
    estados = sql("SELECT string_agg(status, ',' ORDER BY id_evidencia) FROM evidencia")
    reiniciar_api()
    time.sleep(5)
    caso("P06", "Worker rodando de novo sobre os mesmos itens nao muda nada",
         sql("SELECT count(*) || '/' || coalesce(sum(valor), 0) FROM transacao_cp") == foto and sql("SELECT string_agg(status, ',' ORDER BY id_evidencia) FROM evidencia") == estados,
         f"lancamentos/soma antes {foto}, depois {sql('SELECT count(*) || chr(47) || coalesce(sum(valor), 0) FROM transacao_cp')}")
except Exception as e:
    for i in ("P01", "J05", "P02", "J06", "P03", "P04", "J07", "P05", "P06"):
        if not any(r[0] == i for r in resultados):
            caso(i, "prazos", False, e)

# ===============================================================================
# 5. V27 - pote sem vencedor (risco). Fica depois das fases que conferem a contabilidade.
# ===============================================================================

def v27():
    w = duelo(jurados=2, desafiado="NAO_VAI_CUMPRIR", desafiante="NAO_VAI_CUMPRIR")
    _, _, e = enviar_prova(w["d"], w["desafiado"])
    for j in w["jurados"]:
        votar(e, j, "VALIDO")
    preso = num(f"SELECT coalesce(sum(cp_preso), 0) FROM vw_escrow_orfao WHERE id_desafio = {w['d']}")
    if preso:
        ORFAOS_ESPERADOS.add(w["d"])
    estornos = lancamentos(w["d"], "ESTORNO")
    saldos = (saldo(w["g"], w["desafiado"]), saldo(w["g"], w["desafiante"]))
    return status_d(w["d"]) == "FINALIZADA_CUMPRIU" and preso == 0 and estornos == 2 and saldos == (100, 100),         f"desafio {status_d(w['d'])}; CP preso {preso}; estornos {estornos}; saldos dos duelistas {saldos}"
executar("V27", "RN23: sem ninguem do lado vencedor, o pote volta a quem entrou", v27)

# ===============================================================================
# Fase 3: configuracao da API (IA desligada, Client ID do Google)
# ===============================================================================

try:
    recriar_api({"IA_BASE_URL": "nao-configurada", "GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID_TESTE,
                 "GOOGLE_SIMULADO_CHAVE": GOOGLE_SIMULADO_CHAVE})
    g, ids = novo_grupo(["Cria"])
    antes = num("SELECT count(*) FROM moderacao_desafio")
    s, r = chamar("POST", "/api/desafios", {"idGrupo": g, "idCategoria": 1, "titulo": "Sem IA", "descricao": "ok", "valorCp": 10,
                                           "tipoRecompensa": "PRENDA_ACAO",
                                           "dataLimite": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)).isoformat()}, tok(ids["Cria"]))
    caso("D10", "IA nao configurada: 503 e nada gravado", s == 503 and num("SELECT count(*) FROM moderacao_desafio") == antes
         and num(f"SELECT count(*) FROM desafio WHERE id_grupo = {g}") == 0, f"HTTP {s}: {str(r)[:120]}")
    s, _ = chamar("POST", "/api/auth/google", {"credential": "  "})
    caso("A03", "Login com credential vazia: 400", s == 400, f"HTTP {s} (com Client ID configurado)")

    # Login com Google pelo validador simulado (ADR 0024).
    s, r = chamar("POST", "/api/auth/google", {"credential": token_google(f"naoverif.{RODADA}@gmail.com", "Nao Verificado", verificado=False)})
    caso("A05", "Token Google valido com e-mail nao verificado: 401 e nenhuma sessao",
         s == 401 and codigo(r) == "Auth.GoogleInvalido" and not (isinstance(r, dict) and r.get("token")), f"HTTP {s} {codigo(r)}")

    s, r = chamar("POST", "/api/auth/google", {"credential": token_google("octavio@email.com", "Octavio Augusto")})
    sessao = r.get("token") if isinstance(r, dict) else None
    s_uso, grupos = chamar("GET", "/api/grupos", token=sessao) if sessao else (None, None)
    caso("A06", "Token Google valido de usuario existente: entra com a sessao da conta",
         s == 200 and sessao and r["usuario"]["idUsuario"] == TAVIN and not r.get("cadastroPendente") and s_uso == 200 and len(grupos) >= 1,
         f"HTTP {s}; usuario {r.get('usuario', {}).get('idUsuario') if isinstance(r, dict) else r}; sessao usada em /api/grupos: {s_uso}")

    email_novo = f"primeira.vez.{RODADA}@gmail.com"
    s, r = chamar("POST", "/api/auth/google", {"credential": token_google(email_novo, "Primeira Vez")})
    tc = r.get("tokenCadastro") if isinstance(r, dict) else None
    s2, r2 = chamar("POST", "/api/auth/cadastro", {"tokenCadastro": tc, "apelido": "Primeira", "dataNascimento": "2002-02-02"}) if tc else (None, None)
    caso("A07", "Token Google valido de usuario novo: cadastro pendente, sem sessao, e o token de cadastro conclui a conta",
         s == 200 and r.get("cadastroPendente") is True and not r.get("token") and r.get("email") == email_novo and r.get("nome") == "Primeira Vez"
         and s2 == 201 and num(f"SELECT count(*) FROM usuario WHERE email = '{email_novo}'") == 1,
         f"HTTP {s}; cadastroPendente {r.get('cadastroPendente') if isinstance(r, dict) else r}; cadastro com o token devolvido: {s2}")
except Exception as e:
    for i in ("D10", "A03", "A05", "A06", "A07"):
        if not any(r[0] == i for r in resultados):
            caso(i, "configuracao", False, e)
finally:
    try:
        recriar_api()
    except Exception as e:
        print(f"NAO consegui restaurar a API: {e}. Rode: docker compose up -d --no-deps --force-recreate api")

# ===============================================================================
# Fase 4: banco fora do ar
# ===============================================================================

try:
    subprocess.run(["docker", "stop", CONTAINER_DB], check=True, stdout=subprocess.DEVNULL)
    try:
        req = urllib.request.Request(API + "/health")
        inicio = time.time()
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                s = r.status
        except urllib.error.HTTPError as e:
            s = e.code
        except Exception as e:
            s = f"sem resposta ({type(e).__name__})"
        demora = time.time() - inicio
    finally:
        subprocess.run(["docker", "start", CONTAINER_DB], check=True, stdout=subprocess.DEVNULL)
    voltou = esperar(api_saudavel, 90)
    caso("S05", "GET /health com o banco fora responde 503 em ate 30 s, e volta a 200 com o banco de pe",
         s == 503 and demora <= 30 and voltou, f"banco fora: HTTP {s} em {demora:.0f} s; voltou: {voltou}")
except Exception as e:
    caso("S05", "health com banco fora", False, e)

# --- fechamento ----------------------------------------------------------------
esperar(lambda: num("SELECT 1") == 1, 30)
caso("Z99", "Contabilidade fechando ao fim (fora os potes do V27, se o defeito existir)", contabilidade() == 0,
     f"potes do V27 excluidos: {sorted(ORFAOS_ESPERADOS)}")

print()
for c in sorted(resultados, key=lambda c: c[0]):
    print(" | ".join(c))
aprov = sum(c[2] == "Aprovado" for c in resultados)
repro = [c[0] for c in resultados if c[2] == "REPROVADO"]
nc = [c[0] for c in resultados if c[2] == "NAO COBERTO"]
print(f"\n{aprov}/{len(resultados)} aprovados; reprovados: {repro}; nao cobertos: {nc}")
