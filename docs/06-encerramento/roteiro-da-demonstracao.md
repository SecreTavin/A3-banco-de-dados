# Roteiro da demonstração (Banca Final)

Demonstração ao vivo na banca de **27/11/2026**, depois do último slide do
[roteiro dos slides](roteiro-dos-slides.md). Quem conduz é o professor: o time
segue as instruções dele. Os 10 passos abaixo, que somam **14 minutos**, são a
ordem de reserva, para quando ele não indicar outra, e servem de mapa para
achar rápido qualquer funcionalidade que ele pedir. Os cinco integrantes entram
com a **própria conta Google**, no próprio celular, e fazem na hora o ciclo de
um desafio: entrar, criar, aceitar, provar, julgar e pagar. Em cada passo, a
tela mostra a funcionalidade e o banco mostra a regra que a garante.

> **Ensaiado em 22/11/2026** num banco local vazio, povoado só com os cinco
> integrantes, pela API e com a moderação simulada. Os saldos, o júri, o quórum
> e os lançamentos deste roteiro foram conferidos no PostgreSQL. Eles valem para
> um **grupo novo** e com os passos na ordem. A resposta da IA real e o login
> pelo popup do Google entram no ensaio geral com os celulares.

## Quem faz o quê

| Integrante | Papel no desafio | Onde age |
| --- | --- | --- |
| **Octávio** | Admin do grupo, cria o desafio e dá o voto que fecha o júri | Computador do projetor |
| **Arthur** | Desafiado: diz que vai cumprir e manda a prova | Celular |
| **Mario** | Desafiante: diz que o Arthur não cumpre | Celular |
| **Luís** | Apostador em "vai cumprir" e primeiro jurado | Celular |
| **Rafael** | Entra no grupo, fica no júri sem votar e é removido no fim. Cuida do terminal da VM | Celular e SSH |

## Visão geral

| # | Tempo | Funcionalidade | Quem age | Regra ou objeto do banco |
| --- | --- | --- | --- | --- |
| 1 | 0:30 | Abrir o site e apresentar o app | Octávio | Nenhum |
| 2 | 1:00 | Login com Google e idade mínima | Conta reserva | Trigger `trg_valida_idade_minima` (RN26) |
| 3 | 1:00 | Incluir membro no grupo | Octávio | Trigger `trg_credito_inicial` (RN06) |
| 4 | 2:00 | Criar desafio com moderação por IA | Octávio | `moderacao_desafio`: toda proposta fica gravada (RN28) |
| 5 | 1:30 | Aceitar o desafio: CP vai para o escrow | Luís, Arthur e Mario | Procedure `debitar_escrow` (RN18) |
| 6 | 1:30 | Cumprir e enviar a prova: júri congelado | Arthur | `evidencia` e `jurado_evidencia` (RN14) |
| 7 | 2:30 | **Voto que fecha o quórum** | Luís e Octávio | Procedure `apurar_votacao`, numa transação |
| 8 | 1:00 | Ranking e perfil | Octávio | Consultas Dapper sobre o ledger |
| 9 | 1:00 | Excluir membro | Octávio | Procedure `remover_membro` (RN25) |
| 10 | 2:00 | O banco por dentro (`psql`) | Rafael | Ledger append-only e views de contabilidade |
| | **14:00** | | | |

**Equipamento:**

* **Projetor:** um computador com duas janelas lado a lado:
  * o navegador no site, logado como Octávio, com o botão **A+** ligado;
  * o **SQL ao vivo** (`python3 scripts/demo/ver-sql.py`), que mostra cada
    comando que a aplicação manda ao banco.
* **Quatro celulares,** logados como Arthur, Mario, Luís e Rafael.
* **Acesso ao banco da VM:** o SQL ao vivo e o `psql` rodam no servidor, pela
  sessão SSH do Rafael, na pasta do repositório.
* **Uma conta Google reserva,** que nunca entrou no site, para o passo 2.

> **Dados pessoais no projetor.** O SQL ao vivo mostra todo e-mail como `***@***`.
> A tela do site não tem essa máscara: o e-mail do Rafael aparece enquanto é
> digitado no passo 3, e o **Perfil** mostra o e-mail de quem está logado. Não
> projete `docker compose logs`, que traz os valores originais.

## O que o edital pede na demonstração (seção 16)

| Exigência | Onde aparece |
| --- | --- |
| Acesso ao sistema | Passo 2 (login com Google) |
| Execução de uma funcionalidade | Passos 4 a 7 |
| Inclusão de dados | Passo 3 (membro) e passo 4 (desafio) |
| Consulta dos dados | Passo 8 (ranking e perfil) |
| Alteração de dados | Passos 5 e 7: o aceite muda o status do desafio, e o voto é um `UPDATE` que aparece no SQL ao vivo |
| Exclusão de dados | Passo 9: remover o Rafael é um `DELETE` em `membro_grupo`, com o `SAIDA_GRUPO` lançado antes no ledger |
| Relacionamento entre informações | Passo 6 (júri ligado à prova) e passo 7 (pagamento no ledger de cada participante) |
| Execução de consulta SQL | Passo 10 |
| Dados armazenados no banco | Passo 10 e o SQL ao vivo |
| Integração aplicação × banco | O SQL ao vivo, durante a demonstração inteira |
| Banco **efetivamente povoado** | Os grupos e desafios que os integrantes criaram antes da banca, mostrados no passo 10 |

---

## Preparação

> **Não rode `scripts/demo/recriar-banco.sh` na VM.** Ele apaga o banco e, sem
> `--vazio`, volta aos dados de teste. As contas reais dos integrantes seriam
> perdidas.

**Até quarta, 25/11: povoar o banco de verdade.**

- [ ] Os cinco entram no site com a própria conta Google.
- [ ] Usam o app em outros grupos e deixam desafios **aberto, em andamento, em
      votação, finalizado e cancelado**. É isso que atende ao edital.
- [ ] Octávio cria o grupo **Banca do A3**, com filtro **Moderado**, e adiciona
      Arthur, Luís e Mario. **O Rafael fica de fora** até o passo 3.
- [ ] Octávio cria nesse grupo o **desafio reserva**, para o caso de a IA falhar:
      *Fazer 10 flexões seguidas*, descrição "O Mario duvida que o Arthur faz 10
      flexões seguidas.", **20 CP**, com prazo depois da banca. Ninguém entra
      nele.

**Quinta, 26/11: ensaio e backup.**

- [ ] Ensaio completo com os celulares, cronometrado, num **grupo de ensaio**.
      Ele não pode ser o Banca do A3, porque os saldos abaixo valem para um grupo
      sem uso.
- [ ] Criar um desafio e ver a IA real responder. Confirmar que a proposta do
      passo 4 é aprovada e a da vodka é recusada.
- [ ] O Rafael gera o backup na VM e guarda fora do repositório, porque ele tem
      os e-mails reais:

```bash
docker compose exec -T db pg_dump -U euduvido -d euduvido --no-owner > backup-banca.sql
```

- [ ] O Rafael copia também as fotos das provas, que ficam no volume
      `storage-data`, fora desse backup.
- [ ] O Rafael manda o backup ao Octávio por um canal privado, e o Octávio deixa
      a reserva na Cloudflare pronta e testada no Mac (plano B, abaixo). Depois
      do teste, `scripts/cloudflare/publicar.sh parar`.

**Uma hora antes:**

- [ ] Abrir o site no projetor, logado como Octávio, com o **A+** ligado.
- [ ] Deixar os celulares logados (Arthur, Mario, Luís e Rafael). Usar o 4G se o
      Wi-Fi da sala bloquear o Google.
- [ ] Conferir no `psql` da VM que o grupo está pronto:

```sql
SELECT u.apelido, m.saldo_cp
  FROM membro_grupo m
  JOIN grupo_amigos g USING (id_grupo)
  JOIN usuario u USING (id_usuario)
 WHERE g.nome = 'Banca do A3'
 ORDER BY u.apelido;
-- Arthur, Luís, Mario e Octávio, todos com 100 CP.
```

- [ ] Abrir o SQL ao vivo e o `psql` na VM (`docker compose exec db psql -U
      euduvido -d euduvido`).
- [ ] Deixar este roteiro aberto numa aba ou impresso.

**Plano B, se a VM cair:** ativar a reserva na Cloudflare, no Mac do Octávio
([ADR 0023](../02-arquitetura/adr/0023-cloudflare-como-reserva-da-vm.md)). O Mac
precisa ter `GOOGLE_CLIENT_ID`, `AUTH_CHAVE` e `IA_API_KEY` no `.env`, e o endereço
`https://euduvido.secretavin.workers.dev` precisa estar nas origens autorizadas do
Client ID. Suba o Docker e restaure o backup de quinta:

```bash
docker compose up -d --build
```

```bash
docker compose exec -T db psql -U euduvido -d euduvido -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION euduvido;'
```

```bash
docker compose exec -T db psql -U euduvido -d euduvido < backup-banca.sql
```

Depois, publique a reserva:

```bash
scripts/cloudflare/publicar.sh
```

Abra <https://euduvido.secretavin.workers.dev> no projetor e nos celulares, e rode
o SQL ao vivo e o `psql` no Mac. Os números do roteiro valem se o backup foi feito
com o Banca do A3 ainda sem uso, como pede a preparação.

**Se a reserva não subir:** com o Docker e o backup já no ar, abra
<http://localhost:8080> no projetor. Os celulares não entram no `localhost`,
porque o Google só aceita HTTPS fora dele: os integrantes se revezam no
computador do projetor, trocando a conta Google.

**Sem internet:** nem o login com Google nem a IA funcionam. Mostre o fluxo pelas
capturas do GitBook (telas 22 a 29) e o banco restaurado pelo `psql` local.

---

## Passo a passo

### 1. Abrir o site (0:30)

**Tela:** abrir <https://euduvido.falveshub.com>. O site cai direto no login.

**Fala:** "O Eu Duvido! transforma o 'duvido que você consegue' entre amigos num
desafio registrado, com prova e júri. Quem garante as regras é o banco de dados."

### 2. Login com Google e idade mínima (1:00)

**Tela, numa janela anônima do projetor:**

1. Clicar em **Fazer Login com o Google** e escolher a **conta reserva**. Por ser
   o primeiro acesso, aparece **Complete seu cadastro**.
2. Informar um apelido e uma data de nascimento em 2014, ou seja, 12 anos.
3. Clicar em **Criar conta e entrar**. A tela recusa: *"É preciso ter ao menos 16
   anos para usar o Eu Duvido!"*.
4. Fechar a janela anônima. O projetor segue logado como Octávio.

**Banco:** o domínio recusa, e por baixo dele a trigger `trg_valida_idade_minima`
barraria o `INSERT` mesmo se o código falhasse (RN26). No SQL ao vivo, não aparece
nenhum `INSERT INTO usuario`.

**Fala:** "Não guardamos senha: a identidade vem do Google, e a API confere o
token no servidor. Cada um de nós está logado com a própria conta."

### 3. Incluir um membro (1:00)

**Tela, como Octávio:**

1. Em **Grupos**, abrir **Banca do A3**. Mostrar os quatro membros com **100 CP**
   e o filtro da IA em **Moderado**.
2. Em **Adicionar membro**, digitar o e-mail do Rafael e clicar em **Adicionar ·
   entra com 100 CP**. Ele aparece na lista.

**Banco:** a entrada no grupo dispara a trigger `trg_credito_inicial`, que lança
`CREDITO_INICIAL +100` em `transacao_cp`. Ninguém escreveu esse lançamento no
código C# (RN06).

### 4. Criar desafio: a IA aprova e recusa (2:00)

**Tela, ainda como Octávio:**

1. Clicar em **Novo desafio**. Grupo **Banca do A3**, categoria *Esportes &
   Fitness*:
   * desafio: **Fazer 10 polichinelos seguidos**;
   * o que vale: "O Mario duvida que o Arthur faz 10 polichinelos seguidos.";
   * **20 CP** e prazo **Hoje**;
   * clicar em **Enviar para a moderação**. A IA **aprova**, e o desafio é criado.
2. Clicar em **Novo desafio** de novo:
   * desafio: **Beber uma garrafa de vodka em 10 minutos**;
   * o que vale: "Tomar a garrafa inteira na festa de sábado, sem parar.";
   * clicar em **Enviar para a moderação**. A tela mostra **"Não passou no
     filtro"**, com o motivo dado pela IA.

**Banco:**

* As duas propostas ficam em `moderacao_desafio`, aprovada ou não, com o motivo.
* A recusada **não vira linha em `desafio`**: nada existe sem passar pela
  avaliação (RN28).
* O critério muda com o nível do grupo (RN27).

**Se a IA demorar ou falhar:** a tela mostra o erro e nada é gravado. Seguir para
o passo 5 com o **desafio reserva** (*Fazer 10 flexões seguidas*). Os valores são
os mesmos.

### 5. Aceitar o desafio: escrow (1:30)

**A ordem importa:** o apostador entra primeiro. Quando desafiado e desafiante
aceitam, o desafio sai de **Aberto** e ninguém mais entra.

1. **No celular do Luís:** abrir o desafio, escolher **Apostador** e **Vai
   cumprir**. Saldo: **100 → 80**.
2. **No celular do Arthur:** escolher **Desafiado** e **Vai cumprir**. Saldo:
   **100 → 80**.
3. **No celular do Mario:** escolher **Desafiante** e **Não vai cumprir**. Saldo:
   **100 → 80**. O desafio passa a **Em andamento**.

**Banco:**

* Cada aceite chama a procedure `debitar_escrow`, que gera dois lançamentos:
  débito do membro e crédito retido no desafio.
* Os **60 CP** ficam presos no desafio até o resultado (RN18). Ninguém consegue
  "dar calote".

### 6. Cumprir e enviar a prova: júri congelado (1:30)

1. **O Arthur faz os 10 polichinelos** na frente da banca, e alguém tira a foto
   com o celular dele.
2. **No celular do Arthur:** abrir o desafio, clicar em **Enviar a prova**,
   escolher **Foto** e **Escolher foto**, e escrever um comentário.
3. Clicar em **Mandar para o júri**. O desafio passa a **Em votação**.

**Banco:**

* A foto vai para o MinIO pela API, e a linha em `evidencia` só nasce depois do
  arquivo confirmado (RN22, ADR 0022).
* O júri é **congelado** em `jurado_evidencia`: **Luís, Octávio e Rafael**.
* Quem é parte do desafio fica de fora: Arthur, o desafiado, e Mario, o
  desafiante. O apostador continua podendo julgar.
* Com 3 jurados, o quórum é **2**. Quem entrar no grupo depois **não** muda esse
  número (RN14, RN15).

### 7. O voto que fecha o quórum (2:30) — o clímax

1. **No projetor:** abrir **Votação** como Octávio. A prova do Arthur está lá.
2. **No celular do Luís:** em **Votação**, clicar em **Vale** e **Confirmar voto**.
   No projetor, o placar vai para **1 de 2 sozinho**, sem recarregar (SignalR).
3. **No projetor:** clicar em **Vale** e **Confirmar voto**. Esse voto fecha o
   júri.
4. A tela de resultado mostra o pagamento. O voto é definitivo: **Vale** e **Não
   vale** não aparecem de novo.
5. **Apontar o SQL ao vivo:** a transação aparece inteira, com `BEGIN`, o
   `UPDATE jurado_evidencia`, o `CALL apurar_votacao` e o `COMMIT`.

**Banco, numa única transação dentro da procedure `apurar_votacao`:**

| O que acontece | Valor |
| --- | --- |
| Evidência | `EM_VOTACAO` → **`ACEITA`** |
| Desafio | `EM_VOTACAO` → **`FINALIZADA_CUMPRIU`** |
| Pote (20 CP × 3 participantes) | **60 CP**, dividido entre quem apostou "vai cumprir": **Arthur +30** e **Luís +30** (`PREMIO`) |
| Recompensa de voto | **+2 CP** para cada jurado que votou: Luís e Octávio (`RECOMPENSA_VOTO`, RN17) |
| Quem não ganha | Mario perdeu os 20 CP. Rafael não votou e não recebe a recompensa |

**Fala:** "Não existe estado em que a prova foi aceita e o CP não foi pago: é uma
transação só, dentro do PostgreSQL. O aviso em tempo real só sai depois do commit;
ele nunca decide o resultado."

### 8. Ranking e perfil (1:00)

**Tela, no projetor:** abrir **Ranking** e escolher **Banca do A3**.

| Posição | Membro | Saldo |
| --- | --- | --- |
| 1º | Luís | 112 CP |
| 2º | Arthur | 110 CP |
| 3º | Octávio | 102 CP |
| 4º | Rafael | 100 CP |
| 5º | Mario | 80 CP |

Depois, abrir **Perfil**: saldo por grupo e extrato.

**Banco:** leitura por Dapper, com SQL escrito à mão. O saldo do ranking bate com
a soma do ledger.

### 9. Excluir um membro (1:00)

**Tela:** em **Banca do A3**, abrir o menu do Rafael, escolher **Remover do
grupo…** e confirmar. Ele some da lista.

**Banco:** a procedure `remover_membro` lança `SAIDA_GRUPO -100` no ledger e só
então faz o `DELETE` em `membro_grupo`, numa transação. O SQL ao vivo mostra o
`DELETE`, e o saldo não some sem lançamento (ADR 0018). A mesma procedure recusa
quem está em desafio ou júri em curso (RN25). Por isso a remoção vem depois do
resultado.

### 10. O banco por dentro (2:00)

No terminal, com o `psql` aberto:

```sql
-- O banco está povoado pelos próprios integrantes.
SELECT (SELECT count(*) FROM usuario)      AS usuarios,
       (SELECT count(*) FROM grupo_amigos) AS grupos,
       (SELECT count(*) FROM desafio)      AS desafios,
       (SELECT count(*) FROM evidencia)    AS provas,
       (SELECT count(*) FROM transacao_cp) AS lancamentos;

SELECT status, count(*) FROM desafio GROUP BY status ORDER BY status;

-- O extrato do grupo da demonstração: entrada, escrow, prêmio, recompensa e saída.
SELECT coalesce(u.apelido, '(conta do desafio)') AS conta, t.tipo, t.valor
  FROM transacao_cp t
  LEFT JOIN usuario u USING (id_usuario)
 WHERE t.id_grupo = (SELECT id_grupo FROM grupo_amigos WHERE nome = 'Banca do A3')
 ORDER BY t.id_transacao;

-- As duas views que denunciam erro de contabilidade: devem voltar vazias.
SELECT * FROM vw_reconciliacao_saldo;   -- 0 linhas
SELECT * FROM vw_escrow_orfao;          -- 0 linhas

-- O ledger é imutável: nem o dono do banco altera um lançamento.
UPDATE transacao_cp SET valor = 999
 WHERE id_transacao = (SELECT max(id_transacao) FROM transacao_cp);
-- ERROR: transacao_cp e append-only: UPDATE nao e permitido. Lance um ESTORNO.
```

**Fala de fechamento:** "As regras que não podem falhar estão no banco:
constraints, triggers, uma procedure transacional e um ledger que não aceita
UPDATE. A aplicação pode errar; o banco não deixa o erro virar dado."

---

## Fora do roteiro (para perguntas da banca)

| Funcionalidade | Como mostrar | Regra |
| --- | --- | --- |
| Cancelar desafio com estorno | Criador → **Cancelar o desafio**, com motivo. O desafio reserva serve para isso | Estorno a todos os participantes (RN12) |
| Mudar o nível do filtro da IA | Admin → **Salvar filtro** | Só o admin (RN27) |
| Tema claro e escuro, celular | Botão de tema; abrir no celular | Responsivo |
| Prova recusada três vezes | Um desafio dos grupos povoados, se o time tiver feito esse caso | O desafiado perde (RN10) |
| As 11 consultas analíticas | `database/scripts/queries/analytical_queries.sql` | [16 - Consultas SQL](../03-banco-de-dados/implementacao/16-consultas-sql.md) |

## Perguntas prováveis

| Pergunta | Resposta curta | Onde está |
| --- | --- | --- |
| Por que a apuração é procedure e não C#? | Quórum e pagamento precisam ser atômicos. Fora do banco, haveria um instante com a prova aceita e o CP não pago. | [15 - Integração](../02-arquitetura/15-integracao-sistema-bd.md) |
| Por que congelar o júri? | Se alguém entra ou sai do grupo durante a votação, o quórum não pode mudar. | [ADR 0008](../02-arquitetura/adr/0008-quorum-congelado.md) |
| Por que ledger em vez de só um saldo? | Dá extrato e auditoria. Erro se corrige com estorno, e as views provam que o saldo bate. | [ADR 0007](../02-arquitetura/adr/0007-ledger-append-only.md) |
| A IA erra? | Sim. "Comer 3 pimentas malaguetas" passou no nível PESADO. O sistema garante que toda proposta seja avaliada e gravada, não o acerto de cada julgamento. | [19 - Limitações](19-limitacoes-e-melhorias.md) |
| De onde vêm os dados do banco? | Da nossa própria utilização, com contas reais. Os dados fictícios existem só para os testes automáticos. | [13 - Povoamento](../03-banco-de-dados/implementacao/13-povoamento-dml.md) |
| Onde o sistema roda? | VM da Oracle, com o mesmo `docker-compose.yml` do repositório. | [ADR 0020](../02-arquitetura/adr/0020-demonstracao-publica-na-vm-oracle.md) |
