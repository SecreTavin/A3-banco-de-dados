# 0006 - CP como moeda unica do sistema

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O schema original modelava o valor do desafio como `valor_monetario DECIMAL(10,2)`
somado a um `tipo_recompensa` com quatro variantes: `MONETARIA`, `PRENDA_ACAO`,
`ITEM_MATERIAL` e `OUTRO`. Apenas a primeira tem valor numerico. As outras tres
sao acordos em linguagem natural — "paga um acai", "raspa a cabeca", "empresta o
controle por uma semana".

O problema apareceu no refinamento da tela 28 (Ranking) e ficou registrado la
como pendencia: **nao existe forma de ranquear um desafio de prenda junto com
uma de dinheiro**. Sem denominador comum, o ranking teria que ser duas colunas
separadas ("R$ ganhos" e "prendas ganhas"), que nao somam e nao ordenam. Ou
pior: o ranking ignoraria os desafios de prenda, que sao a maioria do uso real
esperado do produto.

Restricoes:

* A disciplina e Banco de Dados. Um ranking que e apenas um `SUM` com
  `ORDER BY` vale mais como consulta demonstravel do que dois relatorios
  desconexos.
* O app **nao movimenta dinheiro real** e nao vai movimentar — nao ha gateway
  de pagamento, nao ha conta bancaria, nao ha KYC. O que o grupo combina em
  dinheiro e liquidado fora do app, entre amigos.
* Ainda assim, o produto quer registrar o que foi combinado: "esse desafio valia
  R$ 20" e informacao que o grupo consulta depois.

## Decisao

**CP (Creditos de Participacao) e a moeda unica do sistema.**

* Todo membro entra em um grupo com **100 CP** (`membro_grupo.saldo_cp`, default
  no schema).
* **Todo desafio custa CP — inclusive os de prenda.** O custo e um valor fixo por
  participante, `desafio.valor_cp`, igual para todos, definido na criacao do desafio e imutavel depois. O pote e `valor_cp * n_participantes`.
* `valor_monetario` **continua existindo, mas passa a ser descritivo apenas**:
  registra o que foi combinado fora do app. Nenhum calculo do sistema le essa
  coluna. O mesmo vale para `descricao_prenda`.
* **CP e por grupo, nao global.** O saldo mora em `membro_grupo`, nao em
  `usuario` — coerente com o ranking por grupo ja decidido na tela 28.

A separacao entre as duas colunas esta declarada no proprio DDL:

```sql
COMMENT ON COLUMN desafios.desafio.valor_cp IS
    'Custo fixo em CP por participante (RN07). O pote e valor_cp * n_participantes.';
COMMENT ON COLUMN desafios.desafio.valor_monetario IS
    'DESCRITIVO apenas - registra o que foi combinado fora do app. '
    'Nenhum calculo do sistema le esta coluna (ADR 0006).';
```

`tipo_recompensa` sobrevive como classificacao — serve para a UI renderizar o
card e para filtro e agrupamento em consulta. Nao participa mais de nenhuma
conta.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Valor apostado livre por participante | Cada um aposta o quanto quer, mais realista | Pote vira rateio proporcional; divisao inteira deixa resto a distribuir e a regra de arredondamento vira decisao de produto | Complexidade sem retorno no MVP — o valor fixo ja produz o ledger e o ranking que a materia avalia |
| CP so para prendas, dinheiro para as monetarias | Mantem o valor real onde ele existe | Duas moedas, dois saldos, dois rankings | O ranking volta a ser incomparavel — e exatamente o problema que a decisao existe para resolver |
| Remover `valor_monetario` do schema | Schema mais limpo, sem coluna "morta" | Perde a informacao do que foi combinado de fato | O produto quer registrar o acordo real; a coluna nao atrapalha desde que nenhum calculo a leia |
| Pontuacao derivada (contar vitorias, sem moeda) | Zero infraestrutura | Sem custo de entrada, apostar e gratis e nao ha risco | Sem escassez nao ha desafio — e nao gera ledger, que e o material mais forte da entrega |

## Consequencias

**Positivas:** o TODO do ranking da tela 28 esta resolvido — prenda e dinheiro
viram a mesma unidade e o ranking e uma coluna so, ordenavel. O CP escasso
(100 na entrada) da peso a decisao de aceitar um desafio: quem entra em tudo
fica sem saldo. E, principalmente, o CP obriga um **ledger contabil** — tabela
de lancamentos, saldo, reconciliacao, transacoes com invariante — que e material
de primeira linha para a disciplina (ver [0007](0007-ledger-append-only.md)).

**Negativas:** `valor_monetario` vira uma coluna que existe e nao e usada por
nenhum calculo — risco permanente de alguem escrever um `SUM(valor_monetario)`
sem perceber. Mitigado pelo `COMMENT ON COLUMN` no DDL e por esta decisao estar
registrada. O valor fixo por participante tambem e menos expressivo que desafio
livre; se o produto crescer, essa e a primeira restricao a cair.

**Impacto na documentacao:** [08-regras-de-negocio.md](../../01-negocio/08-regras-de-negocio.md)
(RN06 credito inicial, RN07 custo em CP), [10-der.md](../../03-banco-de-dados/modelagem/10-der.md),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[28-tela-ranking.md](../../04-ux/telas/28-tela-ranking.md) (fecha a pendencia registrada la),
[25-tela-criar-desafio.md](../../04-ux/telas/25-tela-criar-desafio.md).
