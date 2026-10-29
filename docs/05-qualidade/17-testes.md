# 17 - Casos de Teste e Validação

Cinco níveis de teste, com prioridade deliberada: **as constraints do banco vêm
primeiro**, porque são o que a disciplina avalia e o que é mais barato de
escrever ([ADR 0014](../02-arquitetura/adr/0014-estrategia-de-testes.md)). Os
níveis 1 a 4 são automatizados no código; o nível 5 testa o sistema no ar, de
ponta a ponta.

> **Situação em 2026-10-29 (modelo v3):** 147 casos implementados e
> **passando** — 19 de constraint, 108 de domínio e aplicação sem banco e 20 de
> integração contra PostgreSQL real via Testcontainers. O xUnit conta cada linha
> de `Theory` como um caso. Execução: `dotnet test` em `apps/api`; a coluna
> *Resultado obtido* registra a execução de 29/10/2026, e o CI repete a suíte a
> cada PR.

## Nível 1 — Constraints do banco

Cada caso tenta violar uma regra e espera que o **banco** recuse. Não é a
aplicação que protege; é o SGBD. Arquivo: `ConstraintTests.cs`.

| ID | Regra | Ação | Resultado esperado | Resultado obtido |
| --- | --- | --- | --- | --- |
| T01 | RN03 | `INSERT` em `desafio` com `status = 'INVENTADO'` | Violação de `chk_desafio_status` | Aprovado |
| T02 | RN27 | `nivel_filtro` fora de `LEVE`/`MODERADO`/`PESADO` | Violação de `chk_grupo_nivel_filtro` | Aprovado |
| T03 | RN07 | `INSERT` com `valor_cp = 0` | Violação de `chk_desafio_valor_cp` | Aprovado |
| T04 | RN04 | Segundo voto do mesmo jurado | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T05 | — | `INSERT` em `desafio` com `id_grupo` inexistente | Violação de FK `fk_desafio_grupo` | Aprovado |
| T06 | RN09 | Dois `DESAFIADO` no mesmo desafio | Violação de `unq_desafio_papel_unico` | Aprovado |
| T07 | RN14 | `DESAFIANTE` inserido no júri da própria evidência | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T08 | RN08 | Débito que deixaria `saldo_cp` negativo | Violação de `chk_membro_saldo` | Aprovado |
| T09 | RN24 | `UPDATE` em `transacao_cp` | Exceção do trigger `trg_transacao_cp_imutavel` | Aprovado |
| T10 | RN24 | `DELETE` em `transacao_cp` | Exceção do mesmo trigger | Aprovado |
| T11 | RN19 | Voto em evidência `ACEITA` | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T12 | RN15 | Voto preenchido sem `data_voto` | Violação de `chk_jurado_voto_data` | Aprovado |
| T13 | RN10 | Sexta evidência no mesmo desafio | Violação de `chk_evidencia_ordem` | Aprovado |
| T14 | RN26 | Usuário com menos de 16 anos | Exceção do trigger `trg_usuario_idade_minima` | Aprovado |
| T15 | RN12 | `status = 'CANCELADA'` sem motivo | Violação de `chk_desafio_cancelamento` | Aprovado |
| T16 | RN28 | Moderação reprovada sem motivo | Violação de `chk_moderacao_motivo` | Aprovado |
| T17 | RN28 | Moderação reprovada ligada a um desafio | Violação de `chk_moderacao_desafio` | Aprovado |
| T18 | RN25 | `remover_membro` de quem está em desafio em curso | Recusa da procedure (SQLSTATE `EUD01`) | Aprovado |
| T19 | RN24, RN25 | Saída do grupo e volta | `SAIDA_GRUPO` zera a conta; `vw_reconciliacao_saldo` vazia na volta | Aprovado |

## Nível 2 — Domínio e aplicação, sem banco

xUnit puro, rápido (menos de um segundo). Cobre o que é lógica de agregado,
validação de entrada e integração com a IA antes de qualquer persistência.
Arquivos em `Unidade/`.

| Arquivo | O que cobre |
| --- | --- |
| `DesafioTests` | Máquina de estados: `ABERTA` → `EM_ANDAMENTO` com os dois duelistas (RN21), papel único e `APOSTADOR` livre (RN09), só entra em `ABERTA`, cancelamento só do criador e com motivo (RN12), status terminais (RN03) |
| `GrupoAmigosTests` | Criador é `ADMIN` e filtro padrão `MODERADO`; só `ADMIN` adiciona membro e muda o nível (RN25, RN27); quem pode remover quem; único `ADMIN` não sai com outros membros |
| `UsuarioTests` | Idade mínima: 16 anos exatos passam, um dia a menos é recusado com HTTP 422 (RN26) |
| `EvidenciaTests` | Júri congelado sem voto e prazo de 7 dias (RN11, RN14); quórum `floor(n/2)+1` com 1 a 5 jurados (RN15); voto só de jurado, único e com data (RN04) |
| `ModeracaoDesafioTests` | Cópia do nível, motivo obrigatório na reprovação, corte em 500 caracteres, só aprovada se liga a desafio (RN27, RN28) |
| `ValidadoresTests` | `CriarDesafioValidator`, `EnviarEvidenciaValidator` e `RegistrarVotoValidator`: cada campo inválido barrado antes do handler |
| `ModeradorDesafioTests` | Prompt com a régua do nível do grupo, texto do usuário delimitado como dado, resposta sem decisão vira falha (nunca aprovação) |
| `ChatIaTests` | Cliente da Groq contra HTTP falso: rota `/chat/completions`, modelo e temperatura; sem configuração, erro HTTP, sem rede ou resposta fora do formato viram `IaIndisponivelException` (503) |
| `ResultExtensionsTests` | Erro de domínio → status HTTP (404, 400, 409, 403, 422) com o código do erro no título |
| `IaTests` | Extração tolerante do JSON da resposta e neutralização de marcas no texto do usuário |

## Nível 3 — Integração com PostgreSQL real

Testcontainers subindo PostgreSQL de verdade. Reservado ao que um bug deixaria
invisível e caro: a liquidação dentro do banco e a conversão de dados.

| ID | Cenário | Verificação | Resultado obtido |
| --- | --- | --- | --- |
| I01 | Ciclo completo: evidência → votos até quórum | Desafio `FINALIZADA_CUMPRIU`, CP transferido na mesma transação | Aprovado |
| I02 | **Reconciliação após o ciclo** | `vw_reconciliacao_saldo` e `vw_escrow_orfao` com **zero linhas** | Aprovado |
| I03 | Soma do ledger do grupo | Igual a `100 × membros + recompensas de voto` no cenário sem saída; no caso geral, saldos dos membros + CP retido (ADR 0018) | Aprovado |
| I04 | `apurar_votacao` chamada duas vezes | Segunda chamada não altera nada | Aprovado |
| I05 | Maioria `INVALIDO` | Evidência recusada sem encerrar o desafio na primeira | Aprovado |
| I06 | Três evidências recusadas | Desafio `FINALIZADA_PERDEU`, sem escrow órfão | Aprovado |
| I07 | Criar desafio com a IA aprovando | Desafio criado e linha em `moderacao_desafio` ligada a ele, com o nível do grupo copiado | Aprovado |
| I08 | Criar desafio com a IA reprovando | Nenhum desafio; linha em `moderacao_desafio` com `aprovado = false` e o motivo | Aprovado |
| I09 | Criar desafio com a IA fora do ar | Exceção; nada gravado em `desafio` nem em `moderacao_desafio` | Aprovado |
| I10 | Envio de evidência | Júri congelado em `jurado_evidencia` sem as partes; desafio `EM_VOTACAO` | Aprovado |
| I11 | Migration `AlinhamentoModeloV3` sobre banco povoado no modelo anterior | Só o schema `public`, com as 10 tabelas; linhas e saldos preservados; validador + voto viram `jurado_evidencia`; valor monetário e prenda viram `descricao_recompensa`; o voto que faltava fecha o desafio | Aprovado |

**I02 é o teste mais importante do projeto.** A view `vw_reconciliacao_saldo`
deve estar sempre vazia; qualquer linha significa que o saldo materializado
divergiu do ledger.

Os testes de criação de desafio substituem a Groq por um moderador falso: o
comportamento do provedor em si é coberto no nível 2 (`ChatIaTests`), e a
chamada real depende da chave, que fica fora do repositório.

## Nível 4 — Arquitetura

> **Especificado, não implementado.** A convenção é hoje garantida por revisão.

Testes que falham quando uma convenção é violada, para que a regra não dependa
de alguém lembrar na revisão:

* Nenhum handler de `Query` referencia `DbContext`.
* Nenhum handler de `Command` referencia Dapper.
* Nenhum módulo referencia tipos internos de outro módulo.

## Nível 5 — Sistema funcionando, de ponta a ponta

Os níveis anteriores testam o banco e o código isolados. Este testa o sistema
como a banca vai vê-lo: `docker compose up` com banco recém-povoado, chamadas à
API real como o frontend faz, e o efeito de cada passo conferido direto no
PostgreSQL. Cobre o que a seção 12 do edital lista — cadastro, consulta,
alteração, exclusão, relacionamentos, validação, dados inválidos e comunicação
entre sistema e banco.

Roteiro em [`scripts/testes/roteiro-e2e.py`](../../scripts/testes/roteiro-e2e.py):

```bash
docker compose down -v && docker compose up -d --build
python3 scripts/testes/roteiro-e2e.py
```

| ID | Procedimento | Resultado esperado | Resultado obtido |
| --- | --- | --- | --- |
| E01 | Abrir o login de desenvolvimento | Os 9 usuários do seed listados | Aprovado |
| E02 | Consultar os grupos do Tavin | 2 grupos, com saldo e nível de filtro de cada um | Aprovado |
| E03 | Abrir a Central de Votação como Lari | A evidência "Correr 5km" pendente | Aprovado |
| E04 | Lari vota `VALIDO` (roteiro da demo) | Evidência `ACEITA`, desafio `FINALIZADA_CUMPRIU`, pote de 60 CP dividido entre Tavin e Theus, 2 CP para cada votante, contabilidade fechando | Aprovado |
| E05 | Lari vota de novo na mesma evidência | Recusado (HTTP 409) | Aprovado |
| E06 | Cadastrar usuário com 12 anos | Recusado (HTTP 422, RN26), nada gravado | Aprovado |
| E07 | Cadastrar usuário com 22 anos | Usuário criado (HTTP 201) | Aprovado |
| E08 | ADMIN adiciona o novo usuário ao grupo | Membro entra com 100 CP lançados no ledger (RN06, RN25) | Aprovado |
| E09 | Membro comum tenta adicionar alguém | Recusado (HTTP 403) | Aprovado |
| E10 | Membro comum tenta mudar o nível de filtro | Recusado (HTTP 403), nível inalterado (RN27) | Aprovado |
| E11 | ADMIN muda o nível para `PESADO`; depois tenta `EXTREMO` | Primeiro aceito; valor inválido recusado (HTTP 400) | Aprovado |
| E12 | Criar desafio sem a IA disponível | HTTP 503 e nenhuma linha em `desafio` nem em `moderacao_desafio` (RN28) | Aprovado |
| E13 | Theus aceita um desafio aberto | 10 CP debitados e retidos em escrow (RN18) | Aprovado |
| E14 | ADMIN remove membro que está num desafio em andamento | Recusado (HTTP 409), membro continua (RN25) | Aprovado |
| E15 | ADMIN remove membro sem pendências | Removido; saldo zerado por `SAIDA_GRUPO` (ADR 0018) | Aprovado |
| E16 | Criador cancela um desafio com motivo | `CANCELADA`, CP estornado aos participantes (RN12) | Aprovado |
| E17 | Consultar o ranking do grupo; não-membro tenta o mesmo | Ranking devolvido; não-membro não vê (HTTP 404) | Aprovado |
| E18 | Conferir a contabilidade depois de tudo | `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias | Aprovado |

Executado em 29/10/2026: **18 de 18 aprovados**, duas vezes, cada uma num banco
recém-criado. Na mesma data, as telas de login, desafios, criação de desafio e
detalhe do grupo foram conferidas no navegador. Sem a chave da Groq, a tela de
criação mostra o motivo do bloqueio e não cria nada.

## Execução

```bash
cd apps/api && dotnet test
```

Requer Docker: cada classe de integração sobe seu próprio PostgreSQL via
Testcontainers e aplica as migrations — incluindo procedures e triggers, que são
justamente o que se quer exercitar. Só os testes sem banco:

```bash
cd apps/api && dotnet test --filter "FullyQualifiedName~Tests.Unidade"
```

O CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) roda a cada
PR e a cada push na `main`, em `ubuntu-latest` (os runners Windows e macOS
hospedados não têm Docker utilizável para contêineres Linux):

* **banco** — aplica `schema.sql`, `seed.sql` e as consultas analíticas num
  PostgreSQL 16 limpo, parando no primeiro erro, e confere que
  `vw_reconciliacao_saldo` e `vw_escrow_orfao` estão vazias. Prova a cada commit
  que o DDL do [documento 12](../03-banco-de-dados/implementacao/12-ddl-schema.md)
  é válido e aplicável (RNF05).
* **api** — `dotnet build` e `dotnet test` (níveis 1 a 3).
* **web** — build do frontend.

O nível 4 continua especificado e não implementado.
