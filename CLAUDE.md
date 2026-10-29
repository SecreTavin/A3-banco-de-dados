# Eu Duvido! — Instruções do projeto

Projeto A3 da UC de **Banco de Dados** (UNA / Ânima). App de desafios sociais
entre amigos com validação por júri. A nota vem de modelagem, constraints,
transações e consultas — não da stack de aplicação.

## Registro de IA — obrigatório

**Toda alteração feita com assistência de IA precisa gerar um registro.** Isto é
exigência da disciplina ([documento 18](docs/05-qualidade/18-registro-ia.md)),
não convenção interna.

Ao terminar qualquer trabalho no repositório, crie um arquivo em
`docs/05-qualidade/registro-ia/` seguindo
[o modelo](docs/05-qualidade/registro-ia/0000-modelo.md):

```
docs/05-qualidade/registro-ia/AAAA-MM-DD-descricao-curta.md
```

Um arquivo por alteração — nunca edite uma tabela compartilhada, porque três
pessoas trabalhando em paralelo gerariam conflito toda semana.

O registro precisa dizer **o que a IA errou e o que o time corrigiu**. "Usamos
IA" não vale nota; "usamos IA e validamos assim" vale.

Commits assistidos levam o trailer `Co-Authored-By:` correspondente.

## Arquitetura — regras que não se quebram

Decisões completas em [docs/02-arquitetura/adr/](docs/02-arquitetura/adr/README.md).
As que mais são violadas por engano:

### CQRS: o lado da operação é regra, não estilo

* **Query nunca toca EF Core.** Leitura é Dapper com SQL escrito à mão.
* **Command nunca lê por Dapper.** Escrita é EF Core, com domínio rico.
* Não há teste automático dessa regra: endpoints de leitura e escrita convivem
  no mesmo arquivo, então ela é conferida na revisão do PR.
* No React a convenção acompanha: `useXQuery` para leitura, `useXCommand` para
  escrita.

### `schema.sql` é gerado — nunca editado à mão

`database/scripts/ddl/schema.sql` é saída de
`dotnet ef migrations script --idempotent`. Editar o arquivo diretamente faz ele
divergir do que roda de verdade. Mudança de schema começa numa migration.

Procedures, triggers e views vivem em `database/scripts/ddl/functions/*.sql`,
escritos à mão e aplicados por migration. O EF não os gera.

Atenção: **EF Core não tem `migrationBuilder.SqlFile()`** — o arquivo `.sql`
precisa ser carregado como *embedded resource* e passado para
`migrationBuilder.Sql()`.

### A lógica de resultado mora no banco

A apuração de quórum e a liquidação de CP acontecem em procedure PostgreSQL, numa
única transação. Não reimplemente isso em C#. Não existe estado em que a
evidência foi aceita mas o CP não foi transferido.

O SignalR **notifica** que a transação commitou; nunca **decide** o resultado.
Dispare o evento depois do commit.

### Result Pattern, com limite claro

| Situação | Tratamento |
| --- | --- |
| Regra de negócio violada ("desafio já fechado") | `Result.Fail` |
| Entrada inválida ("título vazio") | Validador, antes do handler |
| Falha de infraestrutura (banco fora) | **Exceção** |

Não transforme falha de infra em `Result` — isso esconde bug real dentro de um
`if (result.IsFailure)`.

### Módulos no código, schema único no banco

Seis módulos no código: `Identidade`, `Grupos`, `Desafios`, `Validacao`,
`Economia`, `Ranking`. No PostgreSQL tudo vive no schema `public` — dez tabelas,
sem prefixo de schema nas consultas
([ADR 0016](docs/02-arquitetura/adr/0016-schema-unico-e-modelo-enxuto.md)). A
fronteira entre módulos é do código; a integridade é do banco. **Não remova FK
entre tabelas de módulos diferentes.**

Dentro de cada módulo, *vertical slice*: cada feature é uma pasta com Command ou
Query, Handler, Validator e Endpoint juntos.

### O ledger é append-only

`transacao_cp` nunca sofre `UPDATE` nem `DELETE` — há trigger que bloqueia.
Estorno é lançamento novo; saída de membro é um `SAIDA_GRUPO`
([ADR 0018](docs/02-arquitetura/adr/0018-saida-de-membro-e-invariante-do-ledger.md)).
As views `vw_reconciliacao_saldo` e `vw_escrow_orfao` devem estar sempre
vazias; se retornarem linha, há bug de contabilidade.

## Restrições do ambiente

| Restrição | Consequência |
| --- | --- |
| Aiven free: `max_connections=20`, sem pooling | `Maximum Pool Size=15` na connection string (padrão do Npgsql é 100) |
| Npgsql não tem MARS | Materializar com `ToListAsync` antes de comando Dapper na mesma conexão |
| Transação manual × `EnableRetryOnFailure` | Envolver em `strategy.ExecuteAsync(...)` |
| Uniões discriminadas em C# são preview | Usar biblioteca de `Result` |

## Convenções de escrita

* Documentação em **português do Brasil**.
* Prosa direta, sem enrolação. Tabelas quando comprimem bem.
* Ao mudar uma regra de negócio, atualize
  [08-regras-de-negocio.md](docs/01-negocio/08-regras-de-negocio.md) **e** a
  constraint ou procedure que a garante — as duas coisas, sempre.
* Decisão estrutural nova gera ADR. Decisão que substitui outra não reescreve o
  ADR antigo: marca como `Substituída` e aponta para o novo.

## Fluxo de trabalho

`main` é produção. Trabalho em branch, PR, revisão de outro dev, merge vai
direto para produção com migration aplicada automaticamente. Cuidado
proporcional na véspera da apresentação.
