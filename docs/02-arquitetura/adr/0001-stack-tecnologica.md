# 0001 - Stack tecnologica: C# no backend, React no frontend, PostgreSQL

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O projeto e o A3 da UC de Banco de Dados. Ate esta decisao o repositorio tinha
apenas documentacao e tres scripts SQL — nenhuma linha de codigo de aplicacao e
nenhuma tecnologia declarada. O `.gitignore` hedgeava Node e Python
simultaneamente, sinal de que nada havia sido decidido.

Restricoes reais:

* **A disciplina e Banco de Dados.** A nota vem de modelagem, constraints,
  transacoes e consultas — nao da stack de aplicacao. Qualquer tecnologia que
  consuma tempo que deveria ir para o banco e prejuizo liquido.
* **Tres desenvolvedores**, com uso intensivo de IA assistindo o desenvolvimento.
* **Entrega com banca** ao fim do semestre 2026/2.
* O `schema.sql` existente ja usava `SERIAL` e `TIMESTAMP` — sintaxe PostgreSQL.
  O SGBD estava, de fato, escolhido sem nunca ter sido declarado.

## Decisao

* **Backend:** C# com .NET, Minimal API.
* **Frontend:** React com TypeScript, site responsivo mobile-first.
* **Banco:** PostgreSQL — formalizando o que o `schema.sql` ja assumia.
* **Repositorio:** monorepo com `apps/api` e `apps/web`, deploys independentes.

Descartado explicitamente: aplicativo nativo (iOS/Android) e PWA como objetivo
de arquitetura. Nenhum ponto da avaliacao depende de rodar como app instalado, e
um site responsivo aberto no navegador do celular e indistinguivel disso durante
uma demonstracao. O `manifest.json` e o service worker entram depois apenas
porque o Web Push exige (ver [0011](0011-notificacoes-web-push.md)), nao como
objetivo em si.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| TypeScript ponta a ponta (Node + React) | Uma linguagem, tipos compartilhados nativamente | O time optou por C# | Preferencia da equipe por C# no backend |
| Next.js full-stack | Menos codigo, um deploy | Fronteira API/BD fica difusa | O documento 15 (Integracao Sistema e BD) e entregavel avaliado e fica mais dificil de demonstrar sem fronteira explicita |
| Flutter / React Native | Roda no celular | Semestre gasto no app, nao no banco | Custo alto, retorno zero na avaliacao |
| MySQL / SQL Server | — | `SERIAL` nao e valido em SQL Server; MySQL tem semantica diferente | O DDL existente ja era PostgreSQL |

## Consequencias

**Positivas:** duas linguagens bem suportadas por IA; PostgreSQL oferece
procedures, triggers, views, indices parciais e `pg_stat_statements` — todos
usados como material de avaliacao.

**Negativas:** C# e TypeScript significam manter tipos em dois lugares;
mitigado pela geracao de cliente a partir do OpenAPI
(ver [0012](0012-contrato-openapi.md)).

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md),
[13-visao-geral.md](../13-visao-geral.md), [14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md).
