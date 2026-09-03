# 0014 - Tres niveis de teste, com constraints do banco em primeiro lugar

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

A decisao estrutural do projeto e que **as regras criticas vivem no banco**:
`CHECK (saldo_cp >= 0)` impede double-spend ([0007](0007-ledger-append-only.md)),
trigger bloqueia `UPDATE` no ledger, `UNIQUE` impede voto duplo, a apuracao de
quorum acontece dentro de uma procedure em uma transacao
([0008](0008-quorum-congelado.md)).

Isso muda onde os testes precisam estar. Uma suite de testes unitarios em C#
pode passar inteira com o banco aceitando saldo negativo — porque a regra nao
esta em C#. **O que a disciplina avalia e justamente a camada que o teste
unitario nao toca.**

Restricoes:

* **Tres desenvolvedores** e um semestre. Nao ha orcamento de tempo para
  cobertura ampla; ha para cobertura escolhida.
* O [documento 17](../../05-qualidade/17-testes.md) ja promete uma tabela de
  casos **T01 a T05** cobrindo integridade referencial, voto unico, valores
  monetarios e calculo de aprovacao. O ADR precisa entregar aquilo, nao inventar
  outra coisa.
* `main` e producao ([0010](0010-hospedagem-e-deploy.md)). O que o CI nao pega,
  ninguem pega.

## Decisao

**Tres niveis, nesta ordem de prioridade.**

### Nivel 1 — Testes de constraint, em SQL, contra PostgreSQL real

O nivel mais importante e tambem o mais barato de escrever: cada teste e um
`INSERT` ou `UPDATE` que **deve falhar**, e a asercao e que o banco recusou.

| Caso | O que prova |
| --- | --- |
| FK rejeita referencia inexistente | Integridade referencial esta no banco (T01) |
| `CHECK` rejeita `valor_cp <= 0` | Valor monetario nao pode ser zero nem negativo (T03) |
| `UNIQUE` bloqueia voto duplo do mesmo validador | Um validador, um voto (T02) |
| `UPDATE` e `DELETE` em `economia.transacao_cp` sao bloqueados | Ledger e append-only, a trigger funciona |
| `CHECK (saldo_cp >= 0)` aborta o escrow sem fundos | Double-spend e impossivel, e a regra e do banco |

Estes testes rodam contra o mesmo DDL que vai para producao — `schema.sql` mais
os scripts de `database/scripts/ddl/functions/` — e sao **os primeiros a serem
escritos**. Um teste que prova que o banco recusa e a evidencia direta do que a
disciplina avalia.

### Nivel 2 — Testes unitarios de dominio, em xUnit, sem banco

Para a logica que **e** de C#: a maquina de estados da aposta (quais transicoes
sao validas), o calculo de quorum sobre um conjunto de validadores, as
invariantes do agregado e os retornos de `Result`
([0002](0002-monolito-modular-vertical-slice.md)).

Sem banco, sem container, sem I/O. Sao rapidos e podem ser muitos.

### Nivel 3 — Testes de integracao com Testcontainers, em dois lugares apenas

`Testcontainers.PostgreSql` **4.14.0**, sobe um PostgreSQL real por execucao,
aplica o DDL completo e roda o cenario ponta a ponta. Custa caro em tempo, entao
o escopo e deliberadamente estreito — **so onde um bug e invisivel e caro**:

* **A procedure de apuracao** (`validacao.apurar_votacao`). Votos entrando ate o
  quorum, e a verificacao de que **em uma unica transacao** a evidencia virou
  `ACEITA`, os validadores foram recompensados, a aposta virou
  `FINALIZADA_CUMPRIU` e o pote foi distribuido. Se um desses passos falhar
  sozinho, o sistema fica em estado que nao deveria existir — e nada avisa.
* **A reconciliacao do ledger.** Um ciclo completo de aposta: criacao, aceite com
  escrow, evidencia, votacao, resolucao. E entao:

> `SELECT * FROM economia.vw_reconciliacao_saldo` **tem que retornar zero
> linhas.**

Esse e o teste mais valioso da suite inteira. A view compara o saldo
materializado com o `SUM` do ledger e retorna as divergencias
([0007](0007-ledger-append-only.md)); ela **deve estar sempre vazia**. Uma
consulta de uma linha prova que a contabilidade fecha depois de um ciclo real —
nao que uma funcao isolada retornou o valor certo, mas que o sistema inteiro nao
perdeu nem criou CP pelo caminho.

### Onde isso roda

O CI usa **`ubuntu-latest`, e isso e obrigatorio, nao preferencia.**
`Testcontainers.PostgreSql` 4.14.0 funciona sem configuracao nos runners Ubuntu
hospedados do GitHub Actions: o Docker ja vem instalado e o Ryuk limpa os
containers ao fim da execucao. Os runners **Windows e macOS hospedados nao tem
Docker utilizavel para containers Linux** — o mesmo teste simplesmente nao roda
la. O runner fica fixado em `ubuntu-latest` no workflow.

O nivel 1 aproveita o PostgreSQL limpo que o CI ja sobe para validar o DDL antes
do merge ([0010](0010-hospedagem-e-deploy.md)) — e o mesmo container, sem custo
adicional.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| So testes unitarios em C# | Rapidos, sem Docker, faceis de escrever | **Nao provam nada sobre o banco** — passam com o banco aceitando saldo negativo | O banco e o que a disciplina avalia; testar so o C# e testar a parte que nao vale nota |
| So testes E2E pelo navegador | Cobrem o fluxo como o usuario ve | Lentos, fragis, quebram por mudanca de layout; quando falham nao dizem onde | Custo de manutencao alto e diagnostico ruim — e ainda assim nao isolam a procedure |
| Nenhum teste automatizado, so conferencia manual | Zero tempo de setup | `main` e producao sem gate humano ([0010](0010-hospedagem-e-deploy.md)); erro de contabilidade e invisivel a olho nu | O unico erro que importa e justamente o que nao aparece na tela |
| Banco em memoria (`InMemory` do EF Core) | Rapido, sem Docker | **Nao tem FK, nem CHECK, nem trigger, nem procedure** | Testaria o oposto do que precisa ser testado |
| SQLite no lugar do Postgres nos testes | Leve, roda em qualquer lugar | Semantica diferente; nao roda `plpgsql` nem as views do projeto | O DDL de teste deixaria de ser o DDL de producao |
| Testcontainers em todos os fluxos | Cobertura ampla e realista | Cada teste sobe container; a suite fica lenta e o CI vira gargalo | Custo alto para cobrir fluxos que os niveis 1 e 2 ja pegam mais barato |

## Consequencias

**Positivas:** os casos T01 a T05 do documento 17 saem escritos e executaveis, e
nao como tabela em prosa. As constraints do banco passam a ter prova
reproduzivel — a afirmacao "o double-spend e impossivel" vira um teste que roda
no CI. O teste de reconciliacao transforma a invariante contabil do
[0007](0007-ledger-append-only.md) em verificacao automatica. E os niveis 1 e 3
usam **exatamente o DDL de producao**, entao um erro no `schema.sql` aparece nos
testes antes de aparecer no deploy.

**Negativas:** o nivel 3 depende de Docker, o que significa que rodar a suite
completa na maquina do desenvolvedor exige Docker instalado e funcionando — em
Windows, com WSL2. O CI fica preso ao `ubuntu-latest`, uma dependencia de
plataforma que precisa estar documentada no workflow para nao ser trocada por
engano. A suite fica mais lenta a cada teste de integracao novo, o que cria
pressao real para nao expandir o nivel 3 alem dos dois casos escolhidos.
Cobertura larga fica de fora por decisao: modulos como Grupos e Ranking terao
pouco ou nenhum teste, e isso e divida reconhecida. E os testes de constraint em
SQL nao sao portaveis — trocar de SGBD invalidaria a suite inteira, o que na
pratica reforca a escolha do [0001](0001-stack-tecnologica.md).

**Impacto na documentacao:**
[17-testes.md](../../05-qualidade/17-testes.md) (T01 a T05, os tres niveis e o
teste de reconciliacao), [tecnologias.md](../tecnologias.md) (xUnit,
Testcontainers.PostgreSql),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md) (pipeline e
runner fixado), [12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md)
(constraints referenciadas pelos testes),
[19-limitacoes-e-melhorias.md](../../06-encerramento/19-limitacoes-e-melhorias.md)
(cobertura deliberadamente parcial).
