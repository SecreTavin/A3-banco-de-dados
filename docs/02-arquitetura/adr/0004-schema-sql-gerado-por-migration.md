# 0004 - schema.sql gerado a partir das migrations do EF Core

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O repositorio ja tinha um `database/scripts/ddl/schema.sql` escrito a mao, com
constraints nomeadas, `CHECK` de dominio e comentarios explicando cada decisao de
modelagem. Esse arquivo e o artefato mais valioso do projeto para a nota: o
**documento 12 (DDL / Schema) e entregavel avaliado**, e o que a banca le e o DDL.

O [0003](0003-cqrs-dapper-ef.md) colocou o EF Core do lado da escrita, o que traz
migrations junto. Ai aparece o conflito: em code-first puro, o EF passa a ser dono
do schema. O `schema.sql` escrito a mao vira ficcao — um arquivo bonito no repo
que nao corresponde ao banco que roda. Pior: a divergencia e silenciosa, ninguem
percebe ate a demonstracao.

Nao da para ter dois donos do schema. E preciso escolher um e derivar o outro.

## Decisao

**Code-first** — as classes C# e as migrations do EF sao a fonte da verdade —
**mas o `schema.sql` e gerado a partir das migrations** e versionado no git:

```
dotnet ef migrations script --idempotent --output database/scripts/ddl/schema.sql
```

O arquivo **nunca e editado a mao**. Mudanca de schema comeca sempre pela classe
C#, vira migration e so entao regenera o DDL. O cabecalho do proprio arquivo
avisa disso.

O **CI roda o `schema.sql` num Postgres limpo a cada commit**. Isso prova, em toda
entrega, que o DDL do documento 12 e valido e executavel — nao um script que
"deve funcionar". A flag `--idempotent` garante que rodar de novo em banco ja
criado nao quebra.

Objetos que o EF nao sabe gerar — procedures, triggers, views — vivem como SQL a
mao em `database/scripts/ddl/functions/*.sql` e sao aplicados por uma migration
que le o arquivo. Assim eles continuam sendo SQL nosso, revisavel em diff, mas
entram na mesma linha do tempo de versionamento do resto do schema.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Code-first puro, sem gerar DDL | Fluxo padrao do EF, zero passo extra | O `schema.sql` para de existir ou diverge em silencio | O documento 12 vira ficcao — perde o entregavel de maior peso |
| Database-first com scaffold | O SQL a mao continua sendo a fonte | `dotnet ef dbcontext scaffold` reescreve as classes a cada mudanca, apagando dominio rico e configuracao | Incompativel com o dominio rico do [0002](0002-monolito-modular-vertical-slice.md) |
| Migrations SQL a mao (Flyway/DbUp) | Controle total do DDL, ferramenta madura | Perde change tracking e o conforto do EF nos commands | Ganho marginal sobre gerar o script, custo alto no lado da escrita |
| Manter os dois manualmente, sincronizados | Nenhum | Divergencia garantida | Nao e uma alternativa seria |

## Consequencias

**Positivas:** existe uma unica fonte da verdade, e o `schema.sql` do documento 12
e sempre um reflexo fiel do banco que roda — verificado por CI, nao por confianca.
Constraints nomeadas continuam explicitas porque sao declaradas na configuracao do
EF com nome escolhido por nos, nao pelo gerador.

**Negativas:** o DDL gerado perde os comentarios que o arquivo escrito a mao tinha
— o que estava em comentario de SQL precisa migrar para `COMMENT ON` declarado na
configuracao do EF, ou para a prosa do documento 12. A ordem das declaracoes passa
a ser a do gerador, nao a didatica. Toda mudanca de schema ganha um passo:
regenerar e commitar o script.

**Impacto na documentacao:**
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md).
