# 2026-10-29 — Fechamento da Entrega 3: seed, consultas, documentos e CI

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-29 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `seed.sql`, `analytical_queries.sql`, documentos 11, 12, 13, 16, 17, 08, 19, telas 23–29, arquitetura 13–15, `CLAUDE.md`, ADR 0018, `manifest.json`, `.github/workflows/ci.yml` |

## O que foi pedido

Na véspera da revisão da Entrega 3 (30/10), conferir a PR #3 contra a
especificação, corrigir o que faltava para a entrega e fechar as issues
pendentes (#14, #15, #27, #28, #29, #31).

## Prompt utilizado

> Vamos corrigir o que precisa para a entrega de amanhã, após isso vamos consertar esse PR e fechar todas as issues para que a entrega de amanhã seja feita. Sobre o modelo da IA vamos prosseguir com o que o dev implementou.

## O que a IA produziu

* **Conferência da PR #3** executando de verdade: build, 147 testes, `schema.sql`
  + seed num PostgreSQL limpo, e comparação, no catálogo do banco, de cada
  tabela, coluna, tipo, constraint, índice e trigger contra o 11.
* **Seed ampliado** sem mudar os ids da demonstração: grupos `PESADO` e `LEVE`,
  desafio aceito pelo júri, desafio perdido por três provas recusadas (RN10),
  cancelamento com estorno, saída de membro com `SAIDA_GRUPO` e seis propostas
  recusadas pela moderação. Nenhum lançamento de CP escrito à mão.
* **Consultas analíticas** reescritas para o schema único (as 8 antigas
  falhavam), mais duas novas: taxa de recusa por nível de filtro e faixa etária
  por grupo.
* **Documentos 12, 13 e 16** reescritos a partir do banco executado, com os
  resultados reais das consultas.
* **ADR 0018** (saída de membro e invariante do ledger) e ajustes na
  especificação: RN24, RN25, modelo lógico, tela 25, limitações.
* **CI** com três jobs (banco, API, web) e **manifesto** da Entrega 3 conferindo
  conteúdo em vez de só a existência dos arquivos.

## O que a IA errou

* **Moderação de seed no grupo errado.** Na primeira versão do seed, a consulta
  que gera as moderações aprovadas usou `id_desafio` no lugar de `id_grupo`. A
  IA percebeu ao reler o próprio texto, antes de executar.
* **Taxa de recusa contraintuitiva.** A primeira distribuição de propostas
  recusadas deu `LEVE` 50% e `PESADO` 40% — o filtro mais permissivo recusando
  mais. Só apareceu ao executar a consulta; as propostas foram redistribuídas
  para os níveis ficarem em ordem crescente de rigor.
* **Afirmação falsa sobre o plano de execução.** A IA escreveu no 16 e no SQL
  que, com o volume do seed, o PostgreSQL faria varredura sequencial na Q8. Um
  `EXPLAIN` mostrou o contrário: ele usa o índice parcial
  `idx_desafio_data_limite`. O texto foi corrigido com o plano real.
* **Atribuição indevida ao ADR 0007.** O primeiro rascunho do ADR 0018 dizia
  que o ADR 0007 enunciava a invariante errada; na verdade ele já ressalvava as
  recompensas de voto. Corrigido depois de ler o 0007.

## Como o time validou

* Seed, consultas e verificação de contabilidade executados num PostgreSQL 16
  limpo, inclusive com `ON_ERROR_STOP` exatamente como o job de CI faz: zero
  erros e `vw_reconciliacao_saldo`/`vw_escrow_orfao` vazias.
* Cada número citado nos documentos 13 e 16 foi copiado da saída das consultas.
* O manifesto novo foi testado nos dois sentidos: passa na branch corrigida e
  reprova 6 de 8 itens quando aplicado à `main` antiga.
* Suíte da API (147 casos) e build do frontend executados localmente.

## Decisão final

Entram todos os artefatos acima. O teste de arquitetura de CQRS citado no
`CLAUDE.md` não existia; em vez de prometer, o `CLAUDE.md` passou a dizer que a
regra é conferida na revisão do PR.
