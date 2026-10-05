# 2026-10-05 — Código no modelo v3, moderação de desafio e triagem de prova por IA

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-05 |
| **Responsável** | Arthur Marzano |
| **Ferramenta** | Claude Code (Opus 5.5), com dois subagentes: um para o frontend e um revisor de código |
| **Artefato afetado** | API inteira (`apps/api`), migration `AlinhamentoModeloV3`, scripts em `database/scripts/ddl/functions/`, testes, frontend (`apps/web/src`), `docker-compose.yml`, README, docs 07, 08, 10, 11, 17, ADR 0015, ADR 0017 (novo) |

## O que foi pedido

Na branch do PR `refinamento-security`: fazer toda aposta passar por um filtro de
IA antes de ser criada, fazer a IA conferir se a prova enviada (por exemplo, a
foto da academia) mostra mesmo o desafio cumprido, usar um modelo próprio
exposto pelo ngrok (URL ainda não fornecida) e adaptar o código ao modelo v3
(`jurado_evidencia` e o resto). Restrição: **não executar nada localmente**.

## O que a IA produziu

* **Migration incremental** `AlinhamentoModeloV3`. Ela move as tabelas para
  `public`, funde `validador_evidencia` e `voto_evidencia` em
  `jurado_evidencia` sem perder votos e apaga as tabelas fora do escopo. Também
  cria `data_nascimento` (com backfill), `nivel_filtro`, `descricao_recompensa`
  (convertida dos dois campos antigos), `moderacao_desafio` e
  `verificacao_evidencia`, e reaplica procedures, triggers e views reescritos.
  O snapshot e o Designer do EF foram escritos à mão.
* **Procedures, triggers e views v3**, sem prefixo de schema, com:
  * apuração sobre `jurado_evidencia`;
  * trigger de júri que barra a parte da aposta no júri e o voto repetido;
  * trigger de idade mínima;
  * procedure `remover_membro` com lançamento `SAIDA_GRUPO`;
  * view `vw_moderacao_por_nivel`.
* **Integração com IA** (`Shared/Ia`): um cliente do protocolo de chat da
  OpenAI, configurado por `Ia:BaseUrl`, extração tolerante do JSON e
  `IaIndisponivelException` → 503. O download da foto tem proteção contra
  SSRF.
* **Moderação de desafio** (RN28) no slice `CriarAposta` e **triagem de prova**
  (RN29, ADR 0017) em `EnviarEvidencia`. As duas gravam auditoria, a aprovada
  na mesma transação do que ela gera.
* **Grupos:** nível de filtro (RN27). O ADMIN adiciona membro por e-mail e
  remove membro, e qualquer membro pode sair (RN25). Há também o cadastro de
  desenvolvimento com data de nascimento (RN26).
* **Frontend** adaptado ao novo contrato, com o parecer da IA visível para o
  júri.
* **Testes** reescritos para o v3, mais testes puros do parser de resposta e do
  filtro de rede.

## O que a IA errou

* Criou a classe de constantes com o mesmo nome da propriedade
  (`NivelFiltro`) dentro de `GrupoAmigos`, o que não compilaria; renomeada para
  `NiveisFiltro`.
* Referenciou uma classe inexistente (`EvidenciaErrorsProxy`) no baixador de
  imagem; trocado por um erro local de `Shared`.
* No teste, cortou com `[..50]` um texto de 36 caracteres, o que lançaria
  exceção em tempo de execução; removido.
* No rascunho do ADR 0017 afirmou, sem fonte, que a Groq não tinha modelo de
  visão no plano gratuito; a frase foi retirada.
* A primeira versão do prompt de verificação usava interpolação de várias
  linhas dentro de raw string; reescrita com variável local para não depender
  de regra de indentação do compilador.
* **Bugs que já existiam e foram encontrados no caminho** (corrigidos):
  * `ORDER BY poteTotalCp` sem aspas: o PostgreSQL dobra o nome para minúsculas
    e a consulta de maiores apostas falharia;
  * a soma de prêmios do ranking era multiplicada pelo número de apostas do
    grupo, por causa do JOIN;
  * ranking e detalhe de aposta eram visíveis para quem não é do grupo.

* O revisor apontou que o endpoint de remoção tratava qualquer `RAISE` da
  procedure como "membro com pendências", inclusive "não é membro"; as recusas
  de pendência ganharam SQLSTATE próprio (`EUD01`).
* O revisor apontou também que o T05 (anterior a esta mudança) dependia de
  usuário e categoria com id 1 já existirem; agora monta o cenário antes.

## Como o time validou

**Nada foi compilado nem executado** nesta sessão, por instrução do
responsável. A validação feita foi só leitura:

* revisão linha a linha pelo agente principal e por um subagente revisor,
  dedicado a erro de compilação e a divergência entre `EuDuvidoDbContext` e o
  snapshot. O revisor não achou erro de compilação, achou snapshot e Designer
  idênticos ao modelo (Designer conferido com `diff`) e confirmou o nome dos
  recursos embutidos em `Sql/v1`;
* busca por referências antigas (`validacao.`, `voto_evidencia`,
  `valorMonetario`, `convite`…) em API e frontend, sem ocorrências restantes.

**Antes do merge, rodar:**

1. `dotnet build` e `dotnet test` em `apps/api` — os testes sobem PostgreSQL
   via Testcontainers e aplicam as três migrations.
2. `dotnet ef migrations has-pending-model-changes` — confirma que o snapshot
   escrito à mão bate com o modelo; se não bater, a API não sobe.
3. `dotnet ef migrations script --idempotent -o ../../../database/scripts/ddl/schema.sql`
   para regenerar o `schema.sql` (ADR 0004). Como esse script passa a terminar
   no modelo v3, o `seed.sql` precisa ser reescrito no mesmo PR (#27).
4. Subir com `IA_BASE_URL` apontando para o ngrok e percorrer: criar desafio
   aceito, criar desafio recusado, enviar foto válida, enviar foto sem relação,
   votar e conferir `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias.
5. **Backup do banco de produção antes do deploy:** a migration não tem `Down`.

## Decisão final

Entra tudo acima na branch `refinamento-security`. Ficam pendentes:

* regenerar `schema.sql` e reescrever o seed e as consultas analíticas para o
  v3 (#27);
* o `12-ddl-schema.md`;
* calibrar os prompts com casos reais (ADR 0015).

O backfill de `data_nascimento` (18 anos na data do cadastro) é um valor
estimado para quem já existia e deve ser tratado assim.
