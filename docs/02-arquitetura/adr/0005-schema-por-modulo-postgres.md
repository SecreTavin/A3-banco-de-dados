# 0005 - Um schema PostgreSQL por modulo, com FK atravessando

* **Status:** Substituída por `0016-schema-unico-e-modelo-enxuto.md`
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O [0002](0002-monolito-modular-vertical-slice.md) dividiu a aplicacao em modulos
de dominio. Essa fronteira existe no codigo C#, mas nao no banco: com todas as
tabelas no `public`, qualquer `JOIN` cruza modulos sem que nada registre que uma
fronteira foi atravessada. O acoplamento fica escondido dentro do SQL, e a
modularidade vira promessa que so o codigo cumpre.

O PostgreSQL tem schemas — namespaces dentro do mesmo banco — e usa-los custa
praticamente nada. A pergunta real nao era se separar, mas o que fazer com as
chaves estrangeiras entre modulos.

## Decisao

Cada modulo tem seu proprio schema no Postgres:

| Schema | Conteudo |
| --- | --- |
| `identidade` | usuario, credencial |
| `grupos` | grupo, membro, convite |
| `desafios` | desafio, palpite |
| `validacao` | votacao, voto, apuracao |
| `economia` | saldo, transacao, extrato |
| `notificacoes` | inscricao push, notificacao enviada |

**As FKs atravessam schemas normalmente.** `desafios.desafio` referencia
`identidade.usuario` com uma `FOREIGN KEY` de verdade. A separacao e **logica**;
a integridade referencial continua sendo responsabilidade do banco.

O `search_path` nao e usado para esconder a origem: toda referencia em SQL e
qualificada com o schema. Ler a consulta ja mostra quais modulos ela toca.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Schema unico (`public`) com JOIN livre | Simples, sem qualificar nome | Os modulos nao sao realmente separados; o acoplamento some dentro do SQL | A fronteira do [0002](0002-monolito-modular-vertical-slice.md) precisa aparecer no banco, nao so no C# |
| Schema por modulo, sem FK entre modulos (integridade na aplicacao) | Prepara extracao para microservicos; cada modulo dono absoluto dos seus dados | Abre mao de integridade referencial garantida pelo SGBD | **Descartado com forca.** Numa materia de Banco de Dados, remover FK de proposito e o oposto do que se avalia — e teria que ser justificado para a banca sem nenhum ganho real, ja que microservicos ja foram descartados no 0002 |
| Um banco por modulo | Isolamento maximo | Sem FK, sem transacao entre modulos, seis conexoes | Todos os contras da opcao acima, multiplicados, e com custo de infra |
| Prefixo no nome da tabela (`desafios_desafio`) | Nao exige schema | Convencao que nada obriga a seguir; sem permissao por namespace | Schema faz a mesma coisa e o banco garante |

## Consequencias

**Positivas:** a fronteira dos modulos fica visivel no proprio banco — `\dn` no
psql lista a arquitetura. Toda consulta que cruza modulos se identifica sozinha
pelo nome qualificado, o que torna o acoplamento auditavel em vez de invisivel. A
integridade referencial permanece integral, que e exatamente o material da
avaliacao. Permissoes por schema ficam disponiveis se um dia forem necessarias.

**Negativas:** todo SQL escrito a mao no Dapper (ver
[0003](0003-cqrs-dapper-ef.md)) precisa qualificar o schema, o que deixa as
consultas mais verbosas. O EF exige `HasDefaultSchema` por modulo na
configuracao. Extrair um modulo para servico separado no futuro exigiria remover
as FKs que atravessam — custo assumido conscientemente, porque essa extracao nao
esta no horizonte do projeto.

**Impacto na documentacao:**
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md),
[13-visao-geral.md](../13-visao-geral.md).
