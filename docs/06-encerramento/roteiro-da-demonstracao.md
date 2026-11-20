# Roteiro da demonstração (Banca Final)

Demonstração ao vivo de **13 minutos**, que percorre todas as funcionalidades
do Eu Duvido! seguindo o ciclo de vida de um desafio: entrar, formar o grupo,
criar, aceitar, provar, julgar e pagar. Em cada passo, a tela mostra a
funcionalidade e o banco mostra a regra que a garante.

> **Ensaiado em 16/11/2026** num banco recém-criado pelo seed, passo a passo,
> pela API. Todos os números deste roteiro (saldos, votos, jurados, lançamentos)
> foram conferidos no PostgreSQL. Eles **só valem com o banco recém-semeado e
> com os passos na ordem**: cada passo muda saldos que os seguintes mostram.
> Revisado em 20/11/2026 para o login só pelo Google
> ([ADR 0021](../02-arquitetura/adr/0021-login-exclusivo-google.md)) e o SQL ao
> vivo.

**Quem faz o quê:** o login é só pelo Google, então cada integrante entra **no
próprio celular**, com a conta Google ligada a um personagem do seed
(`DEMO_CONTAS`). O projetor mostra o computador do Tavin. Os outros agem pelo
celular, e quem apresenta narra o que muda na tela do projetor.

| Personagem | Papel no roteiro | Quem segura o celular |
| --- | --- | --- |
| Tavin | Admin do grupo, cria o desafio (projetor) | [nome] |
| Biel | Aceita como desafiado (passo 5) | [nome] |
| Theus | Aceita como desafiante (passo 5) | [nome] |
| Lipe | Manda a prova; mostra o placar ao vivo (passos 6 e 7) | [nome] |
| Lari | Dá o voto que fecha o quórum (passo 7) | [nome] |

## Visão geral

| # | Tempo | Funcionalidade | Entra como | Regra ou objeto do banco |
| --- | --- | --- | --- | --- |
| 1 | 0:30 | Abertura animada | — | Nenhum (só front, tela 30) |
| 2 | 1:00 | Login com Google e idade mínima | Uma conta Google sem vínculo | Trigger `trg_valida_idade_minima` (RN26) |
| 3 | 2:00 | Grupo: entrada e saída de membro | Tavin | Trigger `trg_credito_inicial` (RN06) e procedure `remover_membro` (RN25) |
| 4 | 2:00 | Criar desafio com moderação por IA | Tavin | `moderacao_desafio`: toda proposta fica gravada (RN28) |
| 5 | 1:30 | Aceitar desafio: CP vai para o escrow | Biel e Theus | Procedure `debitar_escrow` (RN18) |
| 6 | 1:00 | Enviar a prova: júri congelado | Lipe | `jurado_evidencia` (RN14) |
| 7 | 2:30 | **Voto que fecha o quórum** | Lari | Procedure `apurar_votacao`, numa transação |
| 8 | 1:00 | Ranking e perfil | Tavin | Consultas Dapper sobre o ledger |
| 9 | 2:00 | O banco por dentro (psql) | — | Ledger append-only e views de contabilidade |
| | **13:30** | | | |

**Equipamento:**

* **Projetor:** um computador com duas janelas lado a lado:
  * o navegador no site, logado como Tavin, com o botão **A+** ligado. Ele
    aumenta a fonte em 20% para o datashow, como o professor pediu na revisão
    de 31/10, e fica salvo naquele navegador;
  * um terminal com o **SQL ao vivo** (`python3 scripts/demo/ver-sql.py`), que
    mostra cada comando que a aplicação manda ao banco durante toda a
    demonstração.
  * Um segundo terminal fica com o `psql` para o passo 9.
* **Quatro celulares,** logados como Biel, Theus, Lipe e Lari. O do Lipe fica
  aberto em **Votação**: no passo 7 ele mostra o placar mudar sozinho
  (SignalR).
* **Acesso ao banco da VM:** o SQL ao vivo e o `psql` rodam no servidor, pela
  sessão SSH de quem administra a VM (Rafael), na pasta do repositório.

## O que o edital pede na demonstração (seção 16)

| Exigência | Onde aparece |
| --- | --- |
| Acesso ao sistema | Passo 2 (login com Google) |
| Execução de uma funcionalidade | Passos 4 a 7 |
| Inclusão de dados | Passo 3 (membro novo) e passo 4 (desafio novo) |
| Consulta dos dados | Passo 8 (ranking e perfil) |
| Alteração de dados | Passos 5 e 7: o aceite muda o status do desafio, e o voto é um `UPDATE` que aparece no SQL ao vivo |
| Exclusão de dados | Passo 3: remover a Aninha do grupo é um `DELETE` em `membro_grupo`, com o `SAIDA_GRUPO` lançado antes no ledger |
| Relacionamento entre informações | Passo 6 (júri ligado à prova) e passo 7 (pagamento no ledger de cada participante) |
| Execução de consulta SQL | Passo 9 |
| Dados armazenados no banco | Passo 9 e o SQL ao vivo |
| Integração aplicação × banco | O SQL ao vivo, durante a demonstração inteira |

---

## Preparação

**Na véspera:**

- [ ] O banco do site está **recriado a partir do seed**:
      `scripts/demo/recriar-banco.sh` na VM. O script já vincula as contas
      Google de `DEMO_CONTAS` e termina com a conferência, que precisa dizer
      "Pronto para a demonstração".
- [ ] A VM roda a `main`, com `GOOGLE_CLIENT_ID`, `AUTH_CHAVE` e `DEMO_CONTAS`
      no `.env`.
- [ ] Cada integrante entrou pelo Google no próprio celular e caiu no
      personagem certo.
- [ ] Criar um desafio de teste no site e ver a IA responder. Isso confirma que
      a chave da Groq está válida e com cota. **Depois, recriar o banco de
      novo**, porque o teste muda os dados.
- [ ] Ensaio completo pelo celular, em <https://euduvido.falveshub.com>.

**Uma hora antes:**

- [ ] `scripts/demo/conferir-demo.sh` na VM: "Pronto para a demonstração".
- [ ] Abrir o site no projetor, com zoom de 125% para a sala ler, logado como
      Tavin.
- [ ] Deixar os celulares logados (Biel, Theus, Lipe e Lari), o do Lipe na aba
      **Votação**.
- [ ] Abrir o SQL ao vivo (`python3 scripts/demo/ver-sql.py`) e o `psql`
      (`docker compose exec db psql -U euduvido -d euduvido`) na VM. Testar com
      `SELECT count(*) FROM usuario;`: deve responder **9**.
- [ ] Deixar este roteiro aberto numa aba ou impresso.

**Plano B, se a VM cair:** rodar no Docker local do computador do projetor
(`docker compose up -d --build` e `scripts/demo/recriar-banco.sh`), abrir
<http://localhost:8080> e usar o SQL ao vivo e o `psql` locais. Os números do
roteiro são os mesmos.

* **Login:** os celulares não conseguem entrar no `localhost`. O Google só
  aceita HTTPS fora do `localhost`. Os personagens se revezam no computador do
  projetor, trocando a conta Google: é mais lento, então ensaie a troca.
* **Sem internet:** nem o login com Google nem a IA funcionam. Mostrar o fluxo
  pelas capturas do GitBook (telas 22 a 30) e o banco pelo `psql` local, com as
  recusas já gravadas no seed (passo 9, consulta extra).

---

## Passo a passo

### 1. Abertura (0:30)

**Tela:** abrir o site. A animação do monge contra o nerd roda sozinha; tocar
ou apertar qualquer tecla segue para o login.

**Fala:** "O Eu Duvido! transforma o 'duvido que você consegue' entre amigos
num desafio registrado, com prova e júri. Quem garante as regras é o banco de
dados."

### 2. Login com Google e idade mínima (1:00)

**Tela, num navegador anônimo do projetor:**

1. Clicar em **Entrar com Google** e escolher uma conta Google que **não** está
   em `DEMO_CONTAS`. Por ser o primeiro acesso, aparece **Complete seu
   cadastro**, com nome, e-mail e foto vindos do Google.
2. Informar um apelido e a data de nascimento em 2014, ou seja, 12 anos.
3. Clicar em **Criar conta e entrar**. A tela recusa: *"É preciso ter ao menos
   16 anos para usar o Eu Duvido!"*.
4. Fechar a janela anônima. O projetor segue logado como Tavin.

**Banco:**

* O domínio recusa, e por baixo dele a trigger `trg_valida_idade_minima`
  barraria o `INSERT` mesmo se o código falhasse (RN26).
* O número de usuários continua **9**: no SQL ao vivo, não aparece nenhum
  `INSERT INTO usuario`.

**Fala:** "Não guardamos senha: a identidade vem do Google, e a API confere o
token no servidor. Cada colega está logado no próprio celular como um
personagem do seed." 

### 3. Grupo: entrada e saída de membro (2:00)

**Tela:**

1. No projetor, logado como **Tavin**: em **Grupos**, ele está em dois grupos: *Calouros de
   SI* (132 CP) e *Os Inimigos do Fim* (80 CP).
2. Abrir *Os Inimigos do Fim*. Mostrar os membros, o saldo de cada um e o nível
   do filtro da IA (**Moderado**). Só o admin muda o filtro.
3. Em **Adicionar membro**, digitar `ana@email.com` e clicar em **Adicionar ·
   entra com 100 CP**. A Aninha aparece com **100 CP**.
4. No menu da Aninha, escolher **Remover do grupo…** e confirmar. Ela some da
   lista de membros.

**Banco:** a entrada no grupo dispara a trigger `trg_credito_inicial`, que lança
`CREDITO_INICIAL +100` em `transacao_cp`. Ninguém escreveu esse lançamento no
código C# (RN06).

A remoção chama a procedure `remover_membro`. Ela lança `SAIDA_GRUPO -100` no
ledger e só então faz o `DELETE` em `membro_grupo`, numa transação. O SQL ao vivo
mostra o `DELETE`, e o saldo não some sem lançamento: o ledger continua
fechando (ADR 0018). A mesma procedure recusa quem está em desafio ou júri em
curso (RN25).

### 4. Criar desafio: a IA aprova e recusa (2:00)

**Tela, ainda como Tavin:**

1. Clicar em **Novo desafio**. Grupo *Os Inimigos do Fim*, categoria *Prendas &
   Zoeira*:
   * título **Cantar o hino do time na cantina**;
   * descrição "Biel duvida que o Tavin canta o hino inteiro do time em voz alta
     na cantina da UNA, na hora do almoço.";
   * 10 CP e prazo de 1 semana;
   * clicar em **Enviar para a moderação**. A IA **aprova**, e o desafio é
     criado.
2. Clicar em **Novo desafio** de novo:
   * título **Beber uma garrafa de vodka em 10 minutos**;
   * descrição "Tomar a garrafa inteira na festa de sábado, sem parar.";
   * clicar em **Enviar para a moderação**. A tela mostra **"Não passou no
     filtro"**, com o motivo da IA, por exemplo: *"envolve consumo excessivo de
     álcool, risco à saúde"*.

**Banco:**

* As duas propostas ficam em `moderacao_desafio`, aprovada ou não, com o motivo.
* A recusada **não vira linha em `desafio`**: nada existe sem passar pela
  avaliação (RN28).
* O critério muda com o nível do grupo (RN27).

**Se a IA demorar ou falhar:** a tela mostra o erro e nada é gravado. Seguir
para o passo 5 e mostrar no passo 9 as recusas já gravadas no seed.

### 5. Aceitar o desafio: escrow (1:30)

**Tela:** o desafio **Tirar nota máxima no projeto A3** (25 CP) está **Aberto**.

1. **No celular do Biel**, abrir o desafio, escolher **Desafiado** e
   **Vai cumprir**, e clicar em **Entrar como desafiado**. O saldo dele no grupo
   vai de **110 para 85**.
2. **No celular do Theus**, escolher **Desafiante** e **Não vai cumprir**,
   e clicar em **Entrar como desafiante**. O saldo vai de **35 para 10**, e o
   desafio passa a **Em andamento**.

**Banco:**

* Cada aceite chama a procedure `debitar_escrow`, que gera dois lançamentos:
  débito do membro e crédito retido no desafio.
* Os **50 CP** ficam presos no desafio até o resultado (RN18). Ninguém consegue
  "dar calote".

### 6. Enviar a prova: júri congelado (1:00)

**Tela:**

1. **No celular do Lipe**, abrir **Ir fantasiado de dinossauro na aula** (ele é o
   desafiado) e clicar em **Enviar a prova**:
   * tipo foto;
   * link `https://midia.euduvido.app/provas/lipe_dinossauro.jpg`;
   * comentário "Fui de dinossauro na aula do Prof. Mário!".
2. Clicar em **Mandar para o júri**. O desafio passa a **Em votação**.

**Banco:**

* O júri é **congelado** na chegada da prova, em `jurado_evidencia`: Tavin,
  Biel e Lari.
* Quem é parte do desafio fica de fora: Lipe, o desafiado, e Theus, o
  desafiante.
* Quem entrar no grupo depois **não** muda o quórum (RN14). A Aninha entrou e
  saiu no passo 3, antes da prova, e por isso não está no júri.

### 7. O voto que fecha o quórum (2:30) — o clímax

**Contexto:** a prova de **Correr 5km abaixo de 25 minutos** (o Tavin cumpriu)
está com **1 de 2 votos**. O Theus já votou "Vale".

**Tela:**

1. **No celular da Lari**, ir em **Votação**. A prova do Tavin está lá, com o
   placar 1 de 2.
2. Clicar em **Vale** e depois em **Confirmar voto**.
3. **No celular do Lipe**, na Votação, o placar muda sozinho, sem recarregar.
4. Tentar votar de novo: a tela não oferece mais **Vale/Não vale**. O voto é
   definitivo.
5. **Apontar o SQL ao vivo:** a transação aparece inteira, com `BEGIN`, o
   `UPDATE jurado_evidencia ... voto = 'VALIDO'`,
   `CALL apurar_votacao('2')` e `COMMIT`.

**Banco, numa única transação dentro da procedure `apurar_votacao`:**

| O que acontece | Valor |
| --- | --- |
| Evidência | `EM_VOTACAO` → **`ACEITA`** |
| Desafio | `EM_VOTACAO` → **`FINALIZADA_CUMPRIU`** |
| Pote (20 CP × 3 participantes) | **60 CP**, dividido entre quem apostou "vai cumprir": **Tavin +30** e **Theus +30** (`PREMIO`) |
| Recompensa de voto | **+2 CP** para cada jurado que votou: Lari e Theus (`RECOMPENSA_VOTO`, RN17) |
| Saldos no grupo | Tavin 80 → **110** · Theus 10 → **42** · Lari 100 → **102** |

**Fala:** "Não existe estado em que a prova foi aceita e o CP não foi pago: é
uma transação só, dentro do PostgreSQL. O aviso em tempo real só sai depois do
commit; ele nunca decide o resultado."

### 8. Ranking e perfil (1:00)

**Tela, no projetor (Tavin):** abrir **Ranking** de *Os Inimigos do Fim*.

| Posição | Membro | Saldo |
| --- | --- | --- |
| 1º | Tavin | 110 CP |
| 2º | Lari | 102 CP |
| 3º | Biel | 85 CP |
| 3º | Lipe | 85 CP |
| 5º | Theus | 42 CP |

Depois, abrir **Perfil**: saldo por grupo e histórico.

**Banco:** leitura por Dapper, com SQL escrito à mão. O saldo do ranking bate
com a soma do ledger.

### 9. O banco por dentro (2:00)

No terminal, com o `psql` aberto:

```sql
-- O extrato do desafio que acabou de fechar: escrow, prêmio e recompensa.
SELECT u.apelido, t.tipo, t.valor
  FROM transacao_cp t JOIN usuario u USING (id_usuario)
 WHERE t.id_desafio = 1 OR (t.tipo = 'RECOMPENSA_VOTO' AND t.id_grupo = 1)
 ORDER BY t.id_transacao;

-- As duas views que denunciam erro de contabilidade: devem voltar vazias.
SELECT * FROM vw_reconciliacao_saldo;   -- 0 linhas
SELECT * FROM vw_escrow_orfao;          -- 0 linhas

-- O ledger é imutável: nem o dono do banco altera um lançamento.
UPDATE transacao_cp SET valor = 999 WHERE id_transacao = 1;
-- ERROR: transacao_cp e append-only: UPDATE nao e permitido. Lance um ESTORNO.
```

**Consulta extra, se a IA não respondeu no passo 4:**

```sql
SELECT nivel_filtro, aprovado, titulo, motivo
  FROM moderacao_desafio WHERE NOT aprovado;
```

**Fala de fechamento:** "As regras que não podem falhar estão no banco:
constraints, triggers, uma procedure transacional e um ledger que não aceita
UPDATE. A aplicação pode errar; o banco não deixa o erro virar dado."

---

## Fora do roteiro (para perguntas da banca)

Funcionalidades que existem e não cabem nos 13 minutos:

| Funcionalidade | Como mostrar | Regra |
| --- | --- | --- |
| Cancelar desafio com estorno | Criador → **Cancelar o desafio**, com motivo | Estorno a todos os participantes (RN12) |
| Remover membro | Admin → **Remover do grupo** | `SAIDA_GRUPO` zera o saldo; é bloqueado se ele estiver num desafio em andamento (RN25, ADR 0018) |
| Mudar o nível do filtro da IA | Admin → **Salvar filtro** | Só o admin (RN27) |
| Tema claro e escuro, celular | Botão de tema; abrir no celular | Responsivo, sem rolagem da página |
| Prova recusada três vezes | Mostrar no seed o desafio 6 | O desafiado perde (RN10) |
| As 11 consultas analíticas | `database/scripts/queries/analytical_queries.sql` | [16 - Consultas SQL](../03-banco-de-dados/implementacao/16-consultas-sql.md) |

## Perguntas prováveis

| Pergunta | Resposta curta | Onde está |
| --- | --- | --- |
| Por que a apuração é procedure e não C#? | Quórum e pagamento precisam ser atômicos. Fora do banco, haveria um instante com a prova aceita e o CP não pago. | [15 - Integração](../02-arquitetura/15-integracao-sistema-bd.md) |
| Por que congelar o júri? | Se alguém entra ou sai do grupo durante a votação, o quórum não pode mudar. | [ADR 0008](../02-arquitetura/adr/0008-quorum-congelado.md) |
| Por que ledger em vez de só um saldo? | Dá extrato e auditoria. Erro se corrige com estorno, e as views provam que o saldo bate. | [ADR 0007](../02-arquitetura/adr/0007-ledger-append-only.md) |
| A IA erra? | Sim. "Comer 3 pimentas malaguetas" passou no nível PESADO. O sistema garante que toda proposta seja avaliada e gravada, não o acerto de cada julgamento. | [19 - Limitações](19-limitacoes-e-melhorias.md) |
| Onde o sistema roda? | VM da Oracle, com o mesmo `docker-compose.yml` do repositório. | [ADR 0020](../02-arquitetura/adr/0020-demonstracao-publica-na-vm-oracle.md) |
