# 16 - Consultas SQL Estratégicas

Consultas analíticas do sistema, em
[`database/scripts/queries/analytical_queries.sql`](../../../database/scripts/queries/analytical_queries.sql).
As consultas de uso recorrente foram promovidas a view e vivem em
[`ddl/functions/03-triggers-e-views.sql`](../../../database/scripts/ddl/functions/03-triggers-e-views.sql),
aplicadas por migration junto com o DDL.

> Como o DDL ainda não foi executado contra um PostgreSQL real
> ([12 - DDL](12-ddl-schema.md)), nenhuma consulta deste documento teve o plano
> de execução ou o resultado verificado.

## Views

Três consultas passaram para view porque são lidas por mais de um consumidor —
a aplicação, os testes e os painéis. Duplicar o SQL em cada lugar garantiria
divergência.

### `economia.vw_reconciliacao_saldo`

Compara `membro_grupo.saldo_cp` (saldo materializado) com a soma dos lançamentos
do membro em `economia.transacao_cp` e retorna apenas as linhas em que os dois
divergem.

**Deve estar sempre vazia.** Cada linha retornada é um bug de contabilidade —
lançamento gravado sem atualizar o saldo, ou o contrário
([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md), RN24). É ao
mesmo tempo caso de teste ([17 - Testes](../../05-qualidade/17-testes.md)) e
painel de alerta.

### `validacao.vw_status_votacao`

Estado ao vivo de cada votação: total de validadores congelados, quórum
calculado (`floor(n/2) + 1`), votos favoráveis, votos contra e quantos votos
ainda faltam para decidir. Alimenta a
[Central de Votação](../../04-ux/telas/27-tela-central-votacao.md) e o painel de
domínio.

O quórum sai do `COUNT` sobre `validador_evidencia`, nunca sobre o grupo atual —
a view usa exatamente a mesma fonte que a procedure de apuração, então tela e
resultado não podem discordar (RN14, RN15).

### `economia.vw_cp_em_escrow`

CP retido em apostas ainda não resolvidas, agregado por grupo, com a contagem de
apostas abertas. Mede o quanto da economia está parado (RN18).

## Painel do Grafana é consulta analítica

Os painéis de domínio do Grafana Cloud
([ADR 0013](../../02-arquitetura/adr/0013-observabilidade.md))
consultam o PostgreSQL diretamente — não há camada de métricas intermediária
para dados de negócio. Cada painel de domínio **é** uma consulta analítica: o
mesmo SQL serve de entregável deste documento e de fonte do painel.

| Painel | Consulta |
| --- | --- |
| Divergência de contabilidade | `economia.vw_reconciliacao_saldo` (alerta se retornar linha) |
| Votações em aberto e quórum faltante | `validacao.vw_status_votacao` |
| CP em escrow por grupo | `economia.vw_cp_em_escrow` |

Isso deixa um detalhe operacional: o coletor do Grafana consome conexões do
mesmo pool limitado do Aiven, que é a razão de `Maximum Pool Size=15`
([ADR 0010](../../02-arquitetura/adr/0010-hospedagem-e-deploy.md)).

## Consultas no arquivo

### Apuração de votos por evidência

Única consulta escrita até agora. Para uma aposta, lista as evidências com
`tipo_midia`, `url_comprovante`, total de votos, votos favoráveis, votos contra
e o percentual de aprovação.

Exercita `INNER JOIN` (aposta → evidência → usuário desafiado), `LEFT JOIN`
(evidência → voto, para não sumir com evidência ainda sem voto), agregação
condicional com `CASE` dentro de `SUM` e `GROUP BY` sobre todas as colunas não
agregadas.

> A consulta usa nomes de tabela **sem qualificação de schema** (`FROM aposta`),
> herdados da v1 do modelo. Precisa ser reescrita como `apostas.aposta`,
> `validacao.evidencia`, `identidade.usuario` e `validacao.voto_evidencia` antes
> de rodar contra o schema atual.

## Pendentes

Cinco consultas ainda não escritas. Cada uma cobre um recurso de SQL diferente,
o que é intencional — o conjunto precisa demonstrar variedade, não repetir a
mesma agregação cinco vezes.

| Consulta | O que responde | Recursos que exercita |
| --- | --- | --- |
| Ranking por grupo | Ordem dos membros por CP e por apostas ganhas | Window function (`RANK()`/`ROW_NUMBER()`), `PARTITION BY id_grupo` |
| Maiores apostas | As apostas de maior pote e quem participou | Subconsulta ou CTE sobre `transacao_cp`, `ORDER BY … LIMIT` |
| Prendas por categoria | Quantas apostas de cada categoria, por tipo de recompensa | `GROUP BY` com `FILTER`, `LEFT JOIN` para categoria sem aposta |
| Extrato de CP por usuário | Histórico de lançamentos com saldo corrente | Window function acumulativa (`SUM(valor) OVER (ORDER BY data_lancamento)`) |
| Taxa de aprovação por validador | Com que frequência cada validador vota junto com a maioria | `JOIN` de voto contra o resultado apurado da evidência, agregação condicional |

O ranking e o extrato dependem exclusivamente do ledger
([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)): como aposta de
prenda também custa CP, prenda e dinheiro entram no mesmo ranking — o que a v1
do modelo não permitia (ver
[09 - Evolução da Modelagem](../modelagem/09-evolucao-modelagem.md)).
