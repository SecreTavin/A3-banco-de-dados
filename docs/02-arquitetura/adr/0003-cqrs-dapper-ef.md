# 0003 - CQRS com Dapper para leitura e EF Core para escrita

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O [0002](0002-monolito-modular-vertical-slice.md) definiu que cada feature e um
`Command` ou uma `Query` numa pasta propria. Faltava decidir como cada um fala
com o Postgres — e a escolha nao e neutra numa materia de Banco de Dados.

O ponto de tensao: um ORM bem usado esconde o SQL. Isso e uma virtude em quase
todo projeto e um problema neste, porque o **documento 16 (Consultas SQL) e
entregavel avaliado**. Se todas as leituras forem LINQ, nao existe SQL escrito
por nos para apresentar — existe SQL gerado pelo EF, que ninguem da equipe
escreveu e que a banca com razao nao vai contar como trabalho de consulta.

Do outro lado, escrever `UPDATE` a mao para cada mutacao joga fora o dominio rico
decidido no 0002 e o controle transacional que o EF entrega de graca.

## Decisao

**CQRS explicito**, com tecnologias diferentes de cada lado:

| Lado | Tecnologia | Por que |
| --- | --- | --- |
| Command (escrita) | EF Core | Dominio rico, change tracking, transacao, migrations |
| Query (leitura) | Dapper com SQL escrito a mao | O SQL e nosso, versionado e apresentavel |

**Regra dura, verificada no CI:** uma `Query` nunca toca o `DbContext`; um
`Command` nunca le por Dapper. Nao e convencao de boa vontade — e teste de
arquitetura que quebra o build.

A convencao fica visivel no proprio codigo. No backend, `Features/<Nome>/` contem
`Command.cs` **ou** `Query.cs`, nunca os dois. No React, o mesmo par: hooks
`useXQuery` para leitura, `useXCommand` para mutacao. Olhando o nome do arquivo
ja se sabe de que lado da fronteira ele esta.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| So EF Core | Uma tecnologia, menos codigo | Esconde o SQL atras de LINQ | Esconde exatamente aquilo que a materia avalia; o documento 16 ficaria sem conteudo proprio |
| So Dapper | SQL explicito em tudo, sem magica | Sem change tracking, sem migrations, `UPDATE` a mao para cada mutacao | Perde o dominio rico do [0002](0002-monolito-modular-vertical-slice.md) e o schema gerado do [0004](0004-schema-sql-gerado-por-migration.md) |
| Repositorio generico sobre o EF | Parece desacoplar | Abstrai um `DbSet` que ja e uma abstracao; vira `IRepository<T>` com dez metodos, oito nao usados | Camada que custa manutencao e nao paga nada em troca |
| CQRS com dois bancos desde ja | Leitura escala sozinha | Replicacao, consistencia eventual, infra dobrada | Complexidade sem demanda; a separacao logica ja deixa a porta aberta |

## Consequencias

**Positivas:** o documento 16 sai do proprio codigo de producao — as consultas
apresentadas sao as que rodam, nao um anexo escrito para a entrega. Cada lado usa
a ferramenta certa: Dapper e mais rapido na leitura, EF cuida da consistencia na
escrita. A separacao ja e o caminho natural para bancos de leitura separados no
futuro, se o volume um dia justificar.

**Negativas:** duas formas de acessar dados na mesma base de codigo — todo dev
precisa conhecer as duas. Os DTOs de leitura sao mapeados a mao no Dapper e nao
acompanham mudanca de coluna automaticamente; uma alteracao de schema pode quebrar
uma `Query` em tempo de execucao, nao de compilacao. Mitigado pelo teste de
integracao que roda cada consulta contra um Postgres real.

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md),
[16-consultas-sql.md](../../03-banco-de-dados/implementacao/16-consultas-sql.md).
