# Roteiro da demonstração (Banca Final)

Demonstração ao vivo de **13 minutos**, que percorre todas as funcionalidades
do Eu Duvido! seguindo o ciclo de vida de um desafio: entrar, formar o grupo,
criar, aceitar, provar, julgar e pagar. Em cada passo, a tela mostra a
funcionalidade e o banco mostra a regra que a garante.

> **Ensaiado em 16/11/2026** num banco recém-criado pelo seed, passo a passo,
> pela API. Todos os números deste roteiro (saldos, votos, jurados, lançamentos)
> foram conferidos no PostgreSQL. Eles **só valem com o banco recém-semeado e
> com os passos na ordem**: cada passo muda saldos que os seguintes mostram.

## Visão geral

| # | Tempo | Funcionalidade | Entra como | Regra ou objeto do banco |
| --- | --- | --- | --- | --- |
| 1 | 0:30 | Abertura animada | — | Nenhum (só front, tela 30) |
| 2 | 1:00 | Login e cadastro com idade mínima | Cadastro novo | Trigger `trg_valida_idade_minima` (RN26) |
| 3 | 1:30 | Grupo: membros, saldos e entrada de membro | Tavin | Trigger `trg_credito_inicial`: 100 CP no ledger (RN06) |
| 4 | 2:00 | Criar desafio com moderação por IA | Tavin | `moderacao_desafio`: toda proposta fica gravada (RN28) |
| 5 | 1:30 | Aceitar desafio: CP vai para o escrow | Biel e Theus | Procedure `debitar_escrow` (RN18) |
| 6 | 1:00 | Enviar a prova: júri congelado | Lipe | `jurado_evidencia` (RN14) |
| 7 | 2:30 | **Voto que fecha o quórum** | Lari | Procedure `apurar_votacao`, numa transação |
| 8 | 1:00 | Ranking e perfil | Tavin | Consultas Dapper sobre o ledger |
| 9 | 2:00 | O banco por dentro (psql) | — | Ledger append-only e views de contabilidade |
| | **13:00** | | | |

**Equipamento:**

* **Projetor:** um computador, com o navegador no site e um terminal com o `psql`.
* **Celular, opcional mas recomendado:** logado como **Lipe**, aberto em
  **Votação**. No passo 7 ele mostra o placar mudar sozinho (SignalR).

---

## Preparação

**Na véspera:**

- [ ] O banco do site está **recriado a partir do seed**
      (`docker compose down -v && docker compose up -d` na VM; issue #65).
- [ ] A VM roda a `main`.
- [ ] Criar um desafio de teste no site e ver a IA responder. Isso confirma que
      a chave da Groq está válida e com cota. **Depois, recriar o banco de
      novo**, porque o teste muda os dados.
- [ ] Ensaio completo pelo celular, em <https://euduvido.falveshub.com>.

**Uma hora antes:**

- [ ] Abrir o site no projetor, com zoom de 125% para a sala ler.
- [ ] Deixar o celular logado como Lipe, na aba **Votação**.
- [ ] Abrir o terminal com o `psql` do banco do site. Na VM:
      `docker compose exec db psql -U euduvido -d euduvido`. Testar com
      `SELECT count(*) FROM usuario;`: deve responder **9**.
- [ ] Deixar este roteiro aberto numa aba ou impresso.

**Plano B, se a VM ou a internet falharem:** rodar no Docker local
(`docker compose down -v && docker compose up -d --build`), abrir
<http://localhost:8080> no projetor e usar
`docker exec -it euduvido-db-1 psql -U euduvido -d euduvido`. Os números do
roteiro são os mesmos. Sem internet, só o passo 4 (IA) não funciona: mostrar a
recusa já gravada no seed (passo 9, consulta extra).

---

## Passo a passo

### 1. Abertura (0:30)

**Tela:** abrir o site. A animação do monge contra o nerd roda sozinha; tocar
ou apertar qualquer tecla segue para o login.

**Fala:** "O Eu Duvido! transforma o 'duvido que você consegue' entre amigos
num desafio registrado, com prova e júri. Quem garante as regras é o banco de
dados."

### 2. Login e idade mínima (1:00)

**Tela:**

1. Na tela de login, mostrar a lista **"Entrar como"**, com os usuários do
   seed.
2. Clicar em **Criar conta** e preencher um cadastro com nascimento em 2014,
   ou seja, 12 anos.
3. Clicar em **Criar e entrar**. A tela recusa: *"É preciso ter ao menos 16
   anos para usar o Eu Duvido!"*.

**Banco:** o domínio recusa, e por baixo dele a trigger
`trg_valida_idade_minima` barraria o `INSERT` mesmo se o código falhasse
(RN26). O número de usuários continua **9**.

**Fala:** "O login de demonstração é por seleção de usuário. O login com Google
está especificado na issue #60."

> Se o login com Google (#60) entrar antes da banca, este passo muda: o login
> passa a ser pelo botão do Google, com contas vinculadas aos usuários do seed.

### 3. Grupo, membros e crédito inicial (1:30)

**Tela:**

1. Entrar como **Tavin**. Em **Grupos**, ele está em dois grupos: *Calouros de
   SI* (132 CP) e *Os Inimigos do Fim* (80 CP).
2. Abrir *Os Inimigos do Fim*. Mostrar os membros, o saldo de cada um e o nível
   do filtro da IA (**Moderado**). Só o admin muda o filtro.
3. Em **Adicionar membro**, digitar `ana@email.com` e clicar em **Adicionar ·
   entra com 100 CP**. A Aninha aparece com **100 CP**.

**Banco:** a entrada no grupo dispara a trigger `trg_credito_inicial`, que lança
`CREDITO_INICIAL +100` em `transacao_cp`. Ninguém escreveu esse lançamento no
código C# (RN06).

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

1. Sair e entrar como **Biel**. Abrir o desafio, escolher **Desafiado** e
   **Vai cumprir**, e clicar em **Entrar como desafiado**. O saldo dele no grupo
   vai de **110 para 85**.
2. Sair e entrar como **Theus**. Escolher **Desafiante** e **Não vai cumprir**,
   e clicar em **Entrar como desafiante**. O saldo vai de **35 para 10**, e o
   desafio passa a **Em andamento**.

**Banco:**

* Cada aceite chama a procedure `debitar_escrow`, que gera dois lançamentos:
  débito do membro e crédito retido no desafio.
* Os **50 CP** ficam presos no desafio até o resultado (RN18). Ninguém consegue
  "dar calote".

### 6. Enviar a prova: júri congelado (1:00)

**Tela:**

1. Entrar como **Lipe**. Abrir **Ir fantasiado de dinossauro na aula** (ele é o
   desafiado) e clicar em **Enviar a prova**:
   * tipo foto;
   * link `https://midia.euduvido.app/provas/lipe_dinossauro.jpg`;
   * comentário "Fui de dinossauro na aula do Prof. Mário!".
2. Clicar em **Mandar para o júri**. O desafio passa a **Em votação**.

**Banco:**

* O júri é **congelado** na chegada da prova, em `jurado_evidencia`: Tavin,
  Biel, Lari e Aninha.
* Quem é parte do desafio fica de fora: Lipe, o desafiado, e Theus, o
  desafiante.
* Quem entrar no grupo depois **não** muda o quórum (RN14). A Aninha entrou no
  passo 3, antes da prova, e por isso está no júri.

### 7. O voto que fecha o quórum (2:30) — o clímax

**Contexto:** a prova de **Correr 5km abaixo de 25 minutos** (o Tavin cumpriu)
está com **1 de 2 votos**. O Theus já votou "Vale".

**Tela:**

1. Entrar como **Lari** e ir em **Votação**. A prova do Tavin está lá, com o
   placar 1 de 2.
2. Clicar em **Vale** e depois em **Confirmar voto**.
3. **No celular do Lipe**, na Votação, o placar muda sozinho, sem recarregar.
4. Tentar votar de novo: a tela não oferece mais **Vale/Não vale**. O voto é
   definitivo.

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

**Tela:** entrar como **Tavin** e abrir **Ranking** de *Os Inimigos do Fim*.

| Posição | Membro | Saldo |
| --- | --- | --- |
| 1º | Tavin | 110 CP |
| 2º | Lari | 102 CP |
| 3º | Aninha | 100 CP |
| 4º | Biel | 85 CP |
| 4º | Lipe | 85 CP |
| 6º | Theus | 42 CP |

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
