# 16 - Consultas SQL Estratégicas

Dez consultas analíticas em
[`database/scripts/queries/analytical_queries.sql`](../../../database/scripts/queries/analytical_queries.sql),
mais cinco views de uso recorrente em
[`ddl/functions/03-triggers-e-views.sql`](../../../database/scripts/ddl/functions/03-triggers-e-views.sql).
Cada consulta responde uma pergunta do produto; o conjunto foi escolhido para
cobrir recursos de SQL diferentes, não para repetir a mesma agregação.

Os resultados abaixo foram obtidos em 22/11/2026, num PostgreSQL 16 local
povoado com os cinco integrantes pela [base de ensaio](13-povoamento-dml.md#base-de-ensaio).
Os desafios e saldos são de ensaio, e a moderação foi simulada. Na banca, as
mesmas consultas rodam sobre os dados reais. Para reproduzir:

```bash
docker compose exec -T db psql -U euduvido -d euduvido \
  < database/scripts/queries/analytical_queries.sql
```

## Recursos de SQL cobertos

| Recurso | Consultas |
| --- | --- |
| `INNER JOIN` entre 3+ tabelas | Q1, Q2, Q9b, Q10 |
| `LEFT JOIN` para não perder linha sem par | Q3, Q4, Q5, Q8 |
| `GROUP BY` com funções de agregação (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) | Q1, Q3, Q4, Q6, Q8, Q9, Q10 |
| Agregação condicional (`FILTER`) | Q1, Q4, Q6, Q9, Q10 |
| Subconsulta correlacionada | Q2, Q7 |
| Window function (`SUM … OVER`) | Q5 |
| Cálculo derivado (percentual, quórum, pote, idade) | Q1, Q3, Q6, Q9, Q10 |
| Filtro por intervalo de datas | Q8 |
| Ordenação e `LIMIT` | Q3 e todas as demais |

## Views

Promovidas a view porque são lidas por mais de um consumidor — a aplicação, os
testes e os painéis. Duplicar o SQL em cada lugar garantiria divergência.

| View | O que mostra | Regra |
| --- | --- | --- |
| `vw_reconciliacao_saldo` | Membros cujo saldo materializado diverge da soma dos seus lançamentos. **Deve estar sempre vazia** | RN24 |
| `vw_escrow_orfao` | Desafios encerrados com CP ainda retido. **Deve estar sempre vazia** | RN18, RN23 |
| `vw_status_votacao` | Estado ao vivo de cada votação: jurados, quórum, votos e quantos faltam. Alimenta a [Central de Votação](../../04-ux/telas/27-tela-central-votacao.md) | RN14, RN15 |
| `vw_cp_em_escrow` | CP retido em desafios ainda não resolvidos, por grupo | RN18 |
| `vw_moderacao_por_nivel` | Avaliações e taxa de recusa da IA por nível de filtro | RN27, RN28 |

A `vw_status_votacao` calcula o quórum sobre a mesma fonte que a procedure de
apuração (`jurado_evidencia`), então a tela e o resultado não podem discordar.

## Consultas

### Q1 — Apuração de cada evidência

Para cada prova: tamanho do júri, quórum (`floor(n/2) + 1`), votos dados,
válidos, inválidos e percentual de aprovação. O denominador vem do júri
congelado, não do tamanho atual do grupo (RN14). `COUNT(j.voto)` ignora nulos,
então conta só quem já votou.

| Desafio | Tentativa | Status | Júri | Quórum | Votos | Válidos | Inválidos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entregar o DER sem nenhum erro | 1 | ACEITA | 3 | 2 | 2 | 2 | 0 |
| Correr 5 km abaixo de 25 minutos | 1 | EM_VOTACAO | 3 | 2 | 1 | 1 | 0 |
| Fazer 50 flexões sem parar | 1, 2 e 3 | RECUSADA | 3 | 2 | 2 | 0 | 2 |

As três tentativas recusadas das flexões são a RN10 acontecendo: na terceira, o
desafio foi encerrado contra o desafiado.

### Q2 — Ranking por grupo

Saldo atual, desafios disputados, acertos, erros e CP ganho em prêmios, por
membro e por grupo. Como desafio de prenda também custa CP, prenda e dinheiro
entram na mesma conta ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)).
Usa subconsultas correlacionadas em vez de um `JOIN` direto entre participações
e lançamentos — o `JOIN` multiplicaria as linhas e inflaria a soma dos prêmios.

Trecho do grupo *Turma do A3*:

| Membro | Saldo | Desafios | Acertos | Erros | CP em prêmios |
| --- | --- | --- | --- | --- | --- |
| Mario | 90 | 2 | 1 | 0 | 30 |
| Arthur | 90 | 2 | 1 | 0 | 30 |
| Octávio | 87 | 1 | 0 | 0 | 0 |
| Luís | 80 | 2 | 0 | 1 | 0 |
| Rafael | 67 | 2 | 0 | 0 | 0 |

### Q3 — Maiores desafios pelo pote

Pote = custo por participante × número de participantes. A coluna
`descricao_recompensa` aparece só como informação: registra o que foi combinado
fora do app e nenhum cálculo a usa (RN02). Os maiores potes são de 60 CP: o
desafio do DER (cumprido) e o da corrida (em votação).

### Q4 — Desafios por categoria

Contagem por categoria, separada por tipo de recompensa e por desfecho, com o
custo médio. O `LEFT JOIN` garante que uma categoria sem desafio ainda apareça
com zero.

| Categoria | Desafios | Monetários | Prendas | Cumpridos | Perdidos | Cancelados | Custo médio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Esportes & Fitness | 3 | 3 | 0 | 0 | 1 | 0 | 15,0 |
| Acadêmico | 2 | 2 | 0 | 1 | 0 | 0 | 22,5 |
| Games & E-sports | 1 | 1 | 0 | 0 | 0 | 0 | 15,0 |
| Prendas & Zoeira | 1 | 0 | 1 | 0 | 0 | 1 | 10,0 |

### Q5 — Extrato de CP de um membro

A consulta escolhe sozinha o membro com mais lançamentos, para funcionar em
qualquer banco povoado. Cada lançamento do ledger com o saldo acumulado, calculado por window function
(`SUM(valor) OVER (PARTITION BY … ORDER BY …)`). A última linha bate com o
saldo materializado em `membro_grupo` — é a demonstração de que o saldo é
derivável do ledger ([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)).

Arthur no grupo *Turma do A3*:

| Tipo | Valor | Desafio | Saldo após |
| --- | --- | --- | --- |
| CREDITO_INICIAL | +100 | | 100 |
| DESAFIO_ESCROW | −20 | Entregar o DER sem nenhum erro | 80 |
| PREMIO | +30 | Entregar o DER sem nenhum erro | 110 |
| DESAFIO_ESCROW | −20 | Correr 5 km abaixo de 25 minutos | 90 |

### Q6 — Participação do júri

Quantas vezes cada pessoa foi convocada como jurada e quantas vezes votou. Prova
sem quórum por falta de voto é o maior risco do produto; esta consulta mostra
onde ele está. Na base de ensaio, Arthur e Mario foram convocados uma vez e não
votaram (0%).

### Q7 — Integridade contábil por grupo

Todo CP do grupo está em algum lugar: na conta de um membro ou retido num
desafio. Logo, **soma do ledger = saldos dos membros + CP em escrow**. Qualquer
divergência diferente de zero é bug (RN24). A igualdade vale mesmo com saída de
membro, porque o `SAIDA_GRUPO` tira o saldo de quem sai do ledger e da conta ao
mesmo tempo.

| Grupo | Membros | Soma do ledger | Saldos | Escrow | Divergência |
| --- | --- | --- | --- | --- | --- |
| Turma do A3 | 5 | 504 | 414 | 90 | **0** |
| Madrugada do Deploy | 5 | 512 | 512 | 0 | **0** |
| Pelada de Sexta | 3 | 300 | 300 | 0 | **0** |

O grupo *Madrugada do Deploy* soma 512 e não 500 porque as recompensas de voto
(RN17) são o único lançamento que cria CP: 6 votos × 2 CP = 12.

### Q8 — Prazos nos próximos 30 dias

Desafios `ABERTA` ou `EM_ANDAMENTO` que vencem em até 30 dias, com o tempo
restante calculado. É a mesma varredura que o `BackgroundService` faz para
cancelar desafio aberto vencido (RN21). O `EXPLAIN` mostra que o PostgreSQL
usa o índice parcial `idx_desafio_data_limite` mesmo com poucas linhas: o
filtro de status da consulta é o próprio predicado do índice, então só os
desafios em aberto são lidos.

```text
Index Scan using idx_desafio_data_limite on desafio
  Index Cond: (data_limite < (CURRENT_TIMESTAMP + '30 days'::interval))
```

### Q9 — Moderação por IA: taxa de recusa por nível

Agrupa pelo nível **copiado** na avaliação, não pelo nível atual do grupo: se o
admin trocar o nível depois, o histórico continua correto (RN27).

| Nível | Avaliações | Aprovadas | Recusadas | % recusa |
| --- | --- | --- | --- | --- |
| MODERADO | 6 | 5 | 1 | 16,7 |
| PESADO | 2 | 1 | 1 | 50,0 |
| LEVE | 2 | 1 | 1 | 50,0 |

Os vereditos desta tabela vêm do **moderador simulado** da base de ensaio. Eles
mostram a consulta funcionando, não a qualidade do modelo real.

A **Q9b** lista as propostas recusadas com o motivo gravado. Nenhuma delas virou
desafio (RN28).

### Q10 — Faixa etária por grupo

Idade mínima, máxima e média dos membros, e quantos têm menos de 18 anos, ao
lado do nível de filtro do grupo. A idade é calculada na consulta a partir de
`data_nascimento`; armazená-la seria guardar um valor que muda todo dia.
Ninguém fica abaixo de 16 anos, porque o trigger não deixa (RN26).

O resultado não é reproduzido aqui: na base de ensaio, todos têm a mesma data de
nascimento fictícia, e as idades reais dos integrantes não são publicadas.

## Painéis

Os painéis de domínio do Grafana
([ADR 0013](../../02-arquitetura/adr/0013-observabilidade.md)) consultam o
PostgreSQL diretamente, usando as views acima: divergência de contabilidade
(alerta se `vw_reconciliacao_saldo` retornar linha), votações em aberto e
quórum faltante, CP em escrow por grupo e taxa de recusa da moderação.
