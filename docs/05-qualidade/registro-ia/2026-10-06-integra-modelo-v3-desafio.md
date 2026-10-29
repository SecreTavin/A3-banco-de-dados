# 2026-10-06 — Integra o modelo v3 à main com os nomes de "desafio" (issue #30)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-06 |
| **Responsável** | Arthur Marzano |
| **Ferramenta** | Claude Code |
| **Artefato afetado** | `apps/api/**` (migration `AlinhamentoModeloV3`, `Sql/v3-*`, módulos, `Shared/Ia`, testes), `apps/web/src/**`, `database/scripts/ddl/schema.sql`, `database/scripts/ddl/functions/*.sql`, `database/scripts/dml/seed.sql`, `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`, `docs/05-qualidade/17-testes.md` |

## O que foi pedido

Seguir a decisão do PO na issue #30 (comentário na PR #3): portar o trabalho da
PR #3 para uma branch nova a partir da `main`, com os nomes de `desafio` do ADR
0017; escrever uma migration nova partindo de `RenomeiaApostaParaDesafio`;
tirar o que está fora da especificação (triagem de prova por IA, RN29, e
ngrok/Ollama como caminho oficial); usar a Groq; gerar testes unitários.

## O que a IA produziu

* Porte por **merge de três vias arquivo a arquivo** (base da PR #3, `main` e
  PR #3), depois de passar as duas pontas pela mesma regra de renomeação. A
  regra foi validada antes: aplicada aos arquivos originais, reproduz a
  renomeação do Rafael na `main` (só sobraram diferenças de gênero, revistas à
  mão).
* Migration `AlinhamentoModeloV3` escrita à mão (o diff do EF derrubava e
  recriava tabelas): `SET SCHEMA public`, validador + voto → `jurado_evidencia`,
  `valor_monetario` + `descricao_prenda` → `descricao_recompensa`, backfill de
  `data_nascimento`, `moderacao_desafio`, `SAIDA_GRUPO` e o legado
  `APOSTA_ESCROW` no ledger. Procedures, triggers e views em `Sql/v3-*`, cópia de
  `database/scripts/ddl/functions/`.
* `schema.sql` regenerado com `dotnet ef migrations script --idempotent`.
* Seed portado para o modelo v3, com o mesmo roteiro de demonstração.
* 112 casos de teste novos (147 no total): domínio, validadores, cliente da
  Groq com HTTP falso, mapeamento de erros, criação de desafio com moderação
  aprovando/reprovando/fora do ar, envio de evidência e conversão do banco
  antigo pela migration.

## O que a IA errou

* **A regra de renomeação quebrou a gramática e o sentido** em vários pontos:
  "desafio encerrada", "essas desafios forem encerradas", "cancela-la", "num
  desafio ja encerrada" e, no prompt da moderação, "Ninguém aposta dinheiro"
  virou "Ninguém desafio dinheiro" (o verbo foi trocado como se fosse o
  substantivo). Corrigidos após revisão linha a linha do diff contra a `main`.
* **O primeiro merge automático (`git merge --squash`) foi descartado**: gerou
  conflito em 35 arquivos e reintroduzia os nomes antigos em arquivos que o git
  considerou já mesclados. Trocado pelo merge arquivo a arquivo.
* **Uma verificação do script de limpeza do front era ampla demais** (barrava a
  sigla "IA" e pegou constantes como `MAXIMO_EVIDENCIAS`); o arquivo não foi
  gravado e a limpeza foi refeita com checagem exata.
* **Teste da migration falhou na primeira execução** por erro do próprio teste:
  o Npgsql devolve `date` como `DateOnly`, e o teste pedia `DateTime`.
* **Contagem errada no documento 17** na primeira versão (81 + 47 casos): o
  filtro `IaTests` também pegava `EnviarEvidenciaTests`. Recontado por execução
  (108 sem banco, 19 de constraint, 20 de integração).
* **Conflito não percebido na issue**: regenerar o `schema.sql` (pedido da #30)
  quebra o `docker compose up` do zero com o seed antigo. A IA identificou e
  levou a decisão ao responsável, que escolheu portar o seed nesta PR.
* **A especificação pede modelo Llama, mas a Groq aposentou o
  `llama-3.3-70b-versatile` em 16/08/2026** (e os Llama 4 antes disso). Com a
  decisão do responsável, o padrão virou `openai/gpt-oss-120b`, de pesos
  abertos e indicado pela Groq como substituto; o motivo está no README e em
  `IaOptions`.

## Como o time validou

* `dotnet build` sem erro e `dotnet test` com **147 casos passando** (PostgreSQL
  16 real via Testcontainers); `dotnet ef migrations has-pending-model-changes`
  sem pendência.
* **Schema da migration manual = schema gerado pelo EF a partir do modelo**:
  dois bancos (um pelas quatro migrations, outro por uma migration única gerada
  do `DbContext`) com colunas, tipos, defaults, constraints, índices e schemas
  idênticos.
* **Banco de demonstração antigo** (`schema.sql` + `seed.sql` da `main`) migrado:
  as mesmas 5/1/5/4/4/7/2/21 linhas, 6 jurados com 3 votos, saldos iguais,
  `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias, só o schema `public`.
* **`docker compose up` do zero simulado**: `schema.sql` novo + `seed.sql` novo
  num PostgreSQL limpo, sem erro, views vazias, saldos iguais aos do banco
  antigo convertido.
* **Roteiro do README contra a API rodando**: Lari vota, evidência `ACEITA`,
  desafio `FINALIZADA_CUMPRIU`, pote de 60 CP pago, 2 CP a quem votou, views
  vazias. Grupos: remover membro em desafio em curso → 409; membro comum
  removendo outro → 403; sair → 204 e lançamento `SAIDA_GRUPO`; adicionar por
  e-mail → 201; cadastro com 15 anos → 422. Telas conferidas no navegador
  (Playwright).
* `npm run build` do front sem erro.

## Decisão final

Entra tudo. Não testado: a chamada real à Groq aprovando e reprovando um
desafio, porque a chave fica com o PO e o ambiente de desenvolvimento não
alcança `api.groq.com`; sem a chave a API responde 503, como define o ADR 0015.
Ficam para outras issues: seed enriquecido e consultas (#27), documentação
técnica (#15, #31) e CI (#28).
