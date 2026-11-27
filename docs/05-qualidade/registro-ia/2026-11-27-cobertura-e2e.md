# 2026-11-27 — Medição da cobertura dos testes de ponta a ponta

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/05-qualidade/17-testes.md` (seção "Cobertura do nível 5"), `docs/05-qualidade/18-registro-ia.md`, `SUMMARY.md` |

## O que foi pedido

Saber o percentual de cobertura dos testes e2e e registrar o número no
repositório. A documentação não tinha percentual nenhum.

## Prompt utilizado

> qual a % de cobertura em testes e2e no projeto? Atualize o repositório

## O que a IA produziu

* Lista dos 24 endpoints mapeados na API (`Map*` nos `*Endpoints.cs` e
  `/health` no `Program.cs`), cruzada com as chamadas dos três roteiros
  (`roteiro-e2e.py`, `roteiro-e2e-ui.mjs`, `roteiro-e2e-ia.mjs`) e com os hooks
  do frontend que cada tela visitada usa: 23 de 24 (96%).
* As 9 rotas do `App.tsx` contra as telas abertas pelos roteiros de tela: 9 de
  9 (100%).
* As 27 regras do documento 08 contra os casos E, U e I: 17 de 27 (63%), com
  a indicação de onde as outras 10 são testadas nos níveis 1 a 3.

## O que a IA errou

* A primeira contagem de regras usou só as RNs citadas nas tabelas de caso, e
  deu 9 de 27. Vários casos exercitam uma regra sem citá-la (E05 testa a RN04,
  U08 testa RN15 e RN17). A contagem foi refeita caso a caso.
* O primeiro texto dizia que a RN02 "foi juntada a `descricao_recompensa`" sem
  conferir o banco. A busca no `schema.sql` mostrou que a constraint
  `chk_desafio_valor` foi removida pela migration `AlinhamentoModeloV3`, e o
  documento 08 ainda a cita. O texto passou a dizer isso com a fonte.
* O critério de "regra coberta" é subjetivo nos casos de domínio de valores
  (RN03, RN13): o caminho feliz observa o status, mas não tenta um valor
  inválido. Ficou explícito no documento que esses não contam.

## Como o time validou

* Endpoints: `grep` de `Map(Get|Post|Patch|Delete)` na API e de `/api/` nos
  roteiros e em `apps/web/src`. O único endpoint sem chamada,
  `maiores-desafios`, também não aparece no frontend.
* Regras: cada RN conferida contra a coluna "Resultado esperado" do caso
  citado, e as não cobertas contra as tabelas T e de `EvidenciaTests`.
* Os roteiros **não** foram executados nesta medição. A cobertura é estática:
  diz o que os roteiros chamam, não que passaram hoje. A última execução
  registrada é a de 20/11/2026.

## Decisão final

Entrou a seção "Cobertura do nível 5" no documento 17. A divergência da RN02
fica registrada lá para decisão do time; o documento 08 não foi alterado.
