# 0013 - Observabilidade focada em dominio e banco

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O sistema tem estados que erram **em silencio**. Uma aposta que fica presa em
`EM_VOTACAO` porque o quorum congelado ([0008](0008-quorum-congelado.md)) nunca
sera atingido nao lanca excecao. CP preso em escrow de uma aposta que ninguem
resolve nao lanca excecao. Uma divergencia entre saldo materializado e ledger
([0007](0007-ledger-append-only.md)) nao lanca excecao. Sao todos numeros
errados, nao erros.

Alem disso, o [0010](0010-hospedagem-e-deploy.md) colocou tudo em plano
gratuito: 1 CPU, 1 GB de RAM e **20 conexoes** no Aiven. Sem visibilidade, o
primeiro sinal de que o pool estourou seria a demonstracao travando.

Ha ainda o risco oposto, que este projeto ja evitou em outros pontos: **adicionar
infraestrutura porque e legal**. Kafka e Redis foram tentacao em discussoes
anteriores e foram cortados por nao terem justificativa. Observabilidade so entra
se passar pelo mesmo criterio — precisa render alguma coisa na disciplina de
Banco de Dados, nao so parecer profissional.

## Decisao

**Grafana Cloud no plano gratuito, com tres sinais e nada alem disso.**

### 1. Logs estruturados

Log em formato estruturado, com correlacao por requisicao, enviado ao Grafana
Cloud. Serve para investigar o que aconteceu; nao e onde se descobre que algo
esta errado.

### 2. Metricas de dominio

Nao de infraestrutura — **de negocio**. Os paineis principais sao:

| Painel | Fonte | O que revela |
| --- | --- | --- |
| Apostas por status | `apostas.aposta` agrupada por status | Aposta parada em `EM_VOTACAO` alem do prazo |
| CP em escrow por grupo | `economia.vw_cp_em_escrow` | CP preso em aposta que ninguem resolve |
| Evidencias aguardando quorum | `validacao.vw_status_votacao` | Votacao que nunca vai fechar, com `votos_faltantes` maior que o possivel |
| Divergencia de saldo | `economia.vw_reconciliacao_saldo` | **Qualquer linha e bug** — painel que deve estar sempre em zero |

**As tres views ja existem** em
[`database/scripts/ddl/functions/03-triggers-e-views.sql`](../../../database/scripts/ddl/functions/03-triggers-e-views.sql).
Foram escritas para a Central de Votacao e para os testes; os paineis apenas as
consultam. Nao ha SQL novo de instrumentacao — a instrumentacao e o proprio
modelo.

### 3. `pg_stat_statements`

Extensao habilitada no Aiven — **esta na lista de extensoes suportadas do plano**
([Aiven docs](https://aiven.io/docs/products/postgresql/reference/list-of-extensions)) —
alimentando um painel de queries mais lentas, com numero de chamadas e tempo
medio. Junto dele, `EXPLAIN ANALYZE` dos planos das consultas do documento 16.

### Por que isso e justificavel numa disciplina de Banco de Dados

Este e o ponto que separa esta decisao de "infraestrutura porque e legal":

* **Cada painel de metrica de dominio e uma consulta analitica.** `GROUP BY`,
  `FILTER`, agregacao sobre join de quatro tabelas — exatamente o que o
  [documento 16](../../03-banco-de-dados/implementacao/16-consultas-sql.md)
  precisa entregar, e que hoje tem apenas uma consulta. As queries dos paineis
  **sao** as consultas estrategicas do documento 16. Dois entregaveis pelo preco
  de um.
* **`pg_stat_statements` num painel mostrando a mesma query antes e depois de um
  indice e conteudo de Banco de Dados**, nao de DevOps. E a diferenca entre
  afirmar que o indice ajudou e **mostrar o tempo medio caindo em um grafico**,
  com o `EXPLAIN` do antes e do depois ao lado.

Essa e a justificativa honesta para o projeto ter infraestrutura de
observabilidade — no mesmo lugar em que Kafka e Redis foram descartados por nao
terem nenhuma.

Um painel operacional minimo entra junto, porque custa quase nada: conexoes em
uso contra o teto de 20 e uso de memoria do Aiven
([0010](0010-hospedagem-e-deploy.md)).

### O que fica de fora

**Tracing distribuido esta cortado.** OpenTelemetry com spans propagados existe
para responder "em qual dos servicos o tempo foi gasto". Aqui ha **um servico
so** ([0002](0002-monolito-modular-vertical-slice.md)): a resposta e sempre a
mesma, e o que interessa saber — qual query demorou — ja vem do
`pg_stat_statements`. Instrumentar tracing seria cerimonia sem pergunta a
responder.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Sem observabilidade | Zero configuracao, zero servico externo | Aposta travada, CP preso e divergencia de saldo continuam invisiveis; sem dado de performance para justificar indice | Os erros deste sistema sao numeros errados, nao excecoes — sem painel, ninguem ve |
| Apenas logs (`stdout` da Render) | Simples, ja vem pronto | Log responde "o que aconteceu nessa requisicao", nunca "quantas apostas estao presas" | Nao cobre nenhuma das metricas de dominio, que sao o motivo da decisao |
| APM completo com tracing distribuido | Visao ponta a ponta de cada requisicao | Instrumentacao em todo handler, mais dependencias, plano gratuito mais apertado | Custo sem retorno num monolito de um processo — a pergunta que o tracing responde nao existe aqui |
| Metricas so de infraestrutura (CPU, memoria, latencia HTTP) | Padrao, facil de coletar | Nao detecta nenhum dos tres erros silenciosos; um sistema com contabilidade quebrada tem CPU saudavel | Mede a maquina, nao o produto |
| Consultar as views a mao quando desconfiar | Zero infraestrutura | Depende de alguem desconfiar; e nao gera historico para comparar antes e depois de um indice | Sem serie temporal nao ha comparacao de performance — que e metade da justificativa |

## Consequencias

**Positivas:** as tres falhas silenciosas do modelo passam a ter painel, e a de
reconciliacao vira um alarme binario — qualquer linha em
`vw_reconciliacao_saldo` e bug. As consultas dos paineis rendem o documento 16
sem trabalho duplicado. O `pg_stat_statements` da evidencia grafica para a
discussao de indices, que e conteudo direto da disciplina. E o painel de conexoes
protege o teto de 20 do Aiven antes que ele apareca como travamento na banca.

**Negativas:** entra mais um servico externo, com mais uma credencial e mais um
painel para configurar. O `pg_stat_statements` tem custo proprio de coleta —
pequeno, mas num banco de 1 CPU nada e gratuito. As metricas de dominio consomem
conexoes do mesmo pool limitado ([0010](0010-hospedagem-e-deploy.md)), entao o
intervalo de coleta precisa ser folgado — dado de dominio nao muda a cada
segundo. Painel so tem valor se alguem olhar, e nao ha alerta configurado: um
painel vermelho que ninguem abre nao serve para nada. E o plano gratuito do
Grafana Cloud tem limite de retencao, entao comparacao de performance de longo
prazo nao esta disponivel — o antes e depois de um indice precisa ser capturado
quando acontece.

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md) (Grafana Cloud,
`pg_stat_statements`), [13-visao-geral.md](../13-visao-geral.md),
[16-consultas-sql.md](../../03-banco-de-dados/implementacao/16-consultas-sql.md)
(as consultas dos paineis entram como consultas estrategicas, com planos de
execucao), [12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md)
(indices justificados por medicao),
[17-testes.md](../../05-qualidade/17-testes.md) (reconciliacao como verificacao
continua).
