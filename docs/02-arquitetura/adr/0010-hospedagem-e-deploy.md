# 0010 - Hospedagem gerenciada e deploy continuo

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

A stack esta decidida ([0001](0001-stack-tecnologica.md)): monorepo com
`apps/api` em .NET e `apps/web` em React, PostgreSQL como banco e Cloudflare R2
para midia ([0009](0009-armazenamento-de-midia-r2.md)). Faltava decidir **onde
isso roda** e **como o codigo chega la**.

Restricoes reais:

* **Tres desenvolvedores**, nenhum deles administrador de banco de dados. Hora
  gasta configurando backup, replicacao ou `pg_hba.conf` e hora que nao foi para
  modelagem e consultas — que e o que a disciplina avalia.
* **Sem orcamento.** Tudo precisa caber em plano gratuito.
* **Entrega com banca.** A demonstracao e ao vivo, em varios celulares ao mesmo
  tempo, na rede da instituicao.
* O risco que mais dói nao e a API cair: e **o banco cair na vespera da
  apresentacao**. Sem os dados, nao ha o que demonstrar — o projeto morre.

## Decisao

**Tudo em servico gerenciado de plano gratuito, um provedor por
responsabilidade:**

| Camada | Provedor | Por que |
| --- | --- | --- |
| Frontend (`apps/web`) | Vercel | Build de React estatico, preview por PR, sem configuracao |
| API (`apps/api`) | Render | Roda container Docker, plano gratuito, deploy por push |
| PostgreSQL | Aiven | **Backup automatico gerenciado** |
| Midia | Cloudflare R2 | Ja decidido em [0009](0009-armazenamento-de-midia-r2.md) |
| Codigo e CI/CD | GitHub + GitHub Actions | Onde o repositorio ja esta |

**O criterio que decidiu foi o backup.** Um banco gerenciado com backup
automatico elimina o unico risco cujo custo e o projeto inteiro. Nenhuma outra
vantagem de infraestrutura chega perto disso em valor para um trabalho de
faculdade.

**Fluxo de trabalho — `main` e producao:**

1. Trabalho acontece em branch propria.
2. Pull request para `main`.
3. **Revisao obrigatoria por outro desenvolvedor.**
4. Merge em `main` dispara o deploy — Vercel e Render publicam automaticamente.
5. **As migrations do EF Core aplicam sozinhas no deploy**, antes de a nova
   versao da API comecar a atender.

Nao existe branch `develop` e nao existe ambiente de homologacao.

### O risco aceito, dito por extenso

> Um pull request aprovado e mergeado **aplica migration em producao sem nenhum
> gate humano depois da revisao**. Nao ha staging. Se a migration estiver
> errada, ela vai para o unico banco que existe.

Isso e uma escolha, nao um descuido. Um ambiente a mais e uma etapa a mais para
alguem esquecer, e com tres pessoas a chance de esquecer e alta. As mitigacoes
sao duas, e ambas precisam estar de pe antes de qualquer merge:

* **Backup do Aiven verificado.** Nao basta o plano prometer backup: o time
  confirma no painel que existe backup recente e ja testou um restore uma vez.
  Backup nunca restaurado nao e backup.
* **O CI roda o `schema.sql` em um PostgreSQL limpo antes do merge.** Um
  container de Postgres vazio recebe o schema completo mais os scripts de
  `database/scripts/ddl/functions/`. Se o DDL nao aplica do zero, o pull request
  nao pode ser mergeado. E o mesmo cheque que o [0004](0004-schema-sql-gerado-por-migration.md)
  ja exige do `schema.sql` gerado.

### Restricao do plano gratuito do Aiven

O plano gratuito entrega **1 CPU, 1 GB de RAM, 1 GB de disco e
`max_connections = 20`, sem connection pooling do lado do servidor**
([Aiven docs](https://aiven.io/docs/products/postgresql/concepts/pg-free-tier)).

O padrao do Npgsql e `Max Pool Size = 100`. Deixado como esta, **uma unica
instancia da API pode sozinha esgotar o banco**. Entao:

> A connection string de producao define `Maximum Pool Size=15`.

Quinze e nao vinte para deixar margem para o `psql` do desenvolvedor, para o
coletor do Grafana ([0013](0013-observabilidade.md)) e para a conexao
administrativa do proprio Aiven. EF Core, Dapper ([0003](0003-cqrs-dapper-ef.md)),
o `BackgroundService` e o SignalR ([0011](0011-notificacoes-web-push.md))
dividem esse mesmo pool — nenhum deles tem pool proprio.

As demais restricoes do plano nao atrapalham: `CREATE FUNCTION`,
`CREATE PROCEDURE` e `CREATE TRIGGER` em `plpgsql` sao permitidos, e
`pg_stat_statements` esta na lista de extensoes suportadas
([Aiven docs](https://aiven.io/docs/products/postgresql/reference/list-of-extensions)).
So linguagens nao confiaveis, como `plpythonu`, exigem superusuario e ficam
indisponiveis — e nenhuma procedure do projeto usa isso.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| VPS unica com Docker Compose | Controle total, um servidor so, custo previsivel | O time passa a administrar o PostgreSQL: backup, restore, atualizacao, disco cheio | O risco da vespera volta inteiro — e ninguem no time e DBA |
| `main` + `develop` com ambiente de homologacao | Migration errada morre em staging, nao em producao | Um ambiente a mais para provisionar, um banco a mais para popular, uma etapa a mais no fluxo | Com tres pessoas, a etapa vira a que alguem esquece — e ai o staging da falsa seguranca |
| Deploy manual por push do desenvolvedor | Controle explicito de quando publica | Depende de alguem lembrar; passos manuais divergem entre as tres maquinas | Publicar deixa de ser reprodutivel justamente quando importa |
| Rodar tudo local na banca | Zero infraestrutura, zero custo | Depende do notebook, da rede da instituicao e de tunel para os celulares | Fragil demais; e perde a demonstracao multi-dispositivo, que e o que mostra a apuracao ao vivo |
| Banco em container no mesmo host da API | Um deploy so | Sem backup gerenciado; volume perdido derruba o projeto | Mesmo problema da VPS, com menos controle ainda |

## Consequencias

**Positivas:** o banco tem backup automatico e o pior risco do semestre fica
coberto por um servico, nao por disciplina do time. Publicar e mergear — nao ha
passo manual que diverja entre as tres maquinas. Os previews de pull request da
Vercel permitem revisar a interface antes do merge. E o cheque de DDL em
Postgres limpo, que ja era exigido pelo [0004](0004-schema-sql-gerado-por-migration.md),
passa a rodar automaticamente em todo pull request.

**Negativas:** o risco de migration em producao sem gate humano fica registrado
acima e nao esta resolvido — esta mitigado e aceito. A revisao por outro
desenvolvedor vira a unica barreira real, entao **revisar migration nao pode ser
revisao superficial**. O limite de 20 conexoes e um teto rigido e obriga o
`Maximum Pool Size=15`, que precisa ser lembrado em toda connection string nova,
inclusive nas de teste. Quatro provedores significam quatro paineis, quatro
conjuntos de credenciais e quatro variaveis de ambiente por deploy. E o plano
gratuito da Render hiberna por inatividade: a primeira requisicao depois de um
periodo parado demora — na banca, **acordar a API antes de comecar** e parte do
roteiro.

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md)
(Vercel, Render, Aiven, GitHub Actions),
[13-visao-geral.md](../13-visao-geral.md) (restricoes tecnicas conhecidas),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md) (fluxo de
branch e deploy), [15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md)
(connection string e pool), [17-testes.md](../../05-qualidade/17-testes.md)
(cheque de DDL no CI).
