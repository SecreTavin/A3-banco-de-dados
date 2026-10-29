# 0007 - Ledger append-only com saldo materializado

* **Status:** Aceita — invariante do grupo reenunciada no [0018](0018-saida-de-membro-e-invariante-do-ledger.md)
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

Com o CP como moeda unica ([0006](0006-cp-como-moeda.md)), o sistema passa a
movimentar saldo: credito na entrada do grupo, debito ao aceitar um desafio,
premio na resolucao, estorno no cancelamento. Movimentar saldo levanta tres
perguntas que precisam de resposta no modelo, nao no codigo da aplicacao:

* **Onde mora a verdade?** No saldo atual ou no historico de movimentacoes?
* **Como impedir double-spend?** Quem tem 100 CP nao pode aceitar cinco desafios
  de 100 CP. Se o debito so acontecesse na resolucao, as cinco entrariam.
* **Como provar que a conta fecha?** Um saldo errado em producao e invisivel:
  nao ha excecao, nao ha log, o numero simplesmente esta errado.

O ranking (tela 28) tambem precisa de historico completo, nao so do saldo final
— "quanto voce ganhou este mes" nao sai de uma coluna de saldo.

## Decisao

**`economia.transacao_cp` e um ledger append-only de partidas dobradas.**

* Todo debito tem um credito correspondente. O CP nunca e criado nem destruido
  dentro do grupo: muda de conta. A unica entrada de CP novo e o
  `CREDITO_INICIAL` na entrada do membro e a `RECOMPENSA_VOTO`.
* **Trigger bloqueia `UPDATE` e `DELETE` na tabela.** Nao ha correcao de
  lancamento: estorno e um lancamento novo, nunca a remocao do original.
* `valor` e positivo para credito e negativo para debito, nunca zero
  (`chk_transacao_valor`).

**`grupos.membro_grupo.saldo_cp` e saldo materializado.**

* Atualizado na **mesma transacao** do lancamento. A procedure
  `economia.lancar` faz o `INSERT` no ledger e o `UPDATE` no saldo lado a lado —
  nao existe caminho no sistema que escreva um sem o outro.
* `CHECK (saldo_cp >= 0)` na coluna. Essa constraint e o que impede o
  double-spend: a sexta tentativa de escrow com 100 CP viola o CHECK e a
  transacao inteira aborta. **A regra e do banco, nao da aplicacao.**

**`economia.vw_reconciliacao_saldo` prova que os dois batem.** A view compara
`saldo_cp` com o `SUM(valor)` dos lancamentos do membro e retorna as
divergencias. Em sistema saudavel **a view retorna zero linhas** — qualquer
linha e bug, e o teste e uma consulta so.

### Escrow

O CP sai da carteira **no momento do aceite**, nao na resolucao, e vai para a
**conta do desafio**: um lancamento com `id_desafio` preenchido e `id_usuario`
NULL. Duas linhas por aceite:

| Lancamento | `id_usuario` | `id_desafio` | `valor` |
| --- | --- | --- | --- |
| Debito da carteira | participante | desafio | `-valor_cp` |
| Credito na conta do desafio | NULL | desafio | `+valor_cp` |

Isso resolve duas coisas ao mesmo tempo: **impede o double-spend** (o saldo cai
na hora, entao o proximo desafio encontra a carteira ja reduzida) e **mantem o
ledger balanceado enquanto o desafio esta aberto** — o CP nao esta em lugar
nenhum, esta na conta do desafio. A invariante do grupo vale em qualquer instante:

> a soma de todos os lancamentos de um grupo e sempre `100 * numero de membros`
> (mais as recompensas de voto ja creditadas).

Na resolucao, `desafios.encerrar_desafio` le o pote da conta do desafio, distribui
entre quem acertou e zera a conta com um lancamento negativo. Como CP e inteiro,
o resto da divisao vai para o primeiro vencedor — a soma dos premios e
exatamente o pote, nunca um CP a menos.

### Tipos de lancamento

| Tipo | De | Para | Quando |
| --- | --- | --- | --- |
| `CREDITO_INICIAL` | sistema | membro | entrada no grupo (100 CP) |
| `DESAFIO_ESCROW` | membro | conta do desafio | aceite do desafio |
| `PREMIO` | conta do desafio | vencedores | resolucao |
| `ESTORNO` | conta do desafio | participantes | cancelamento |
| `RECOMPENSA_VOTO` | sistema | validador | evidencia que atingiu quorum |

A conta do desafio **nao tem saldo materializado** — e derivada do ledger por
`SUM`. So a carteira do membro, que e lida a toda hora na UI, e materializada.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| So ledger, saldo sempre derivado por `SUM` | Impossivel dessincronizar; uma fonte da verdade so | `SUM` a cada leitura de tela; e nao ha nada para reconciliar — a consulta de reconciliacao, que e material de avaliacao, deixa de existir | O saldo aparece em quase toda tela; e a reconciliacao e justamente o que se quer demonstrar |
| So saldo, sem ledger | Uma coluna, uma escrita | Perde o historico inteiro: nao da para auditar, nao da para estornar, nao da para explicar um saldo | O ranking precisa de historico completo, nao do saldo final |
| Ledger mutavel (corrigir o lancamento errado) | Correcao "limpa" | Destroi a auditoria; um saldo errado passa a ser inexplicavel | Contabilidade nao apaga lancamento — e a materia avalia justamente a integridade |
| Debitar so na resolucao | Nenhuma conta intermediaria | Permite apostar 100 CP em cinco desafios tendo 100 CP | Double-spend direto — a falha mais obvia do modelo |
| Trigger recalculando o saldo apos o `INSERT` | Aplicacao nao precisa lembrar de atualizar | A regra fica escondida em duas camadas e o `CHECK` dispara dentro da trigger, com erro confuso | A procedure `economia.lancar` ja e o unico ponto de entrada; explicito e melhor |

## Consequencias

**Positivas:** o modelo tem uma invariante enunciavel, verificavel por uma
consulta e defensavel na banca. O double-spend e barrado por `CHECK`, no banco,
sem depender de codigo C#. Cancelamento e estorno sao triviais porque o
historico esta completo. E a entrega ganha o conjunto que a disciplina quer ver:
procedures, trigger de protecao, view de reconciliacao, transacao com
invariante e `SELECT ... FOR UPDATE` para serializar a resolucao concorrente.

**Negativas:** duas escritas por movimentacao em vez de uma, e a obrigacao de
que **toda** movimentacao passe por `economia.lancar` — um `UPDATE` direto em
`saldo_cp` quebra a reconciliacao em silencio. O ledger tambem cresce sem parar,
por definicao: nao ha expurgo. Na escala do projeto isso e irrelevante, mas e
divida reconhecida. A conta do desafio com `id_usuario NULL` torna o
`chk_transacao_conta` menos obvio de ler do que seria com uma tabela de contas
propria.

**Impacto na documentacao:** [08-regras-de-negocio.md](../../01-negocio/08-regras-de-negocio.md)
(RN08 saldo nao negativo, RN17 recompensa de voto, RN18 escrow no aceite),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[16-consultas-sql.md](../../03-banco-de-dados/implementacao/16-consultas-sql.md)
(reconciliacao e ranking), [15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md).
