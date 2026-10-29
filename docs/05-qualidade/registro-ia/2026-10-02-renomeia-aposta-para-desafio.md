# 2026-10-02 — Renomeia "aposta" para "desafio" (docs, banco, API e front)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/**`, `CLAUDE.md`, `README.md`, `SUMMARY.md`, `database/scripts/**`, `apps/api/**` (incl. nova migration), `apps/web/src/**`, ADR 0017 |

## O que foi pedido

Trocar "aposta" por "desafio" no DER "e etc", com a decisão do time de aplicar
em tudo ("aposta está com nome queimado"), resolver a colisão com a moderação
("proposta → desafio") e deixar explícito que o júri valida o desafio, sem criar
as quatro entidades `desafio_postado/validado/executado/cumprido`.

## O que a IA produziu

* Script de substituição com regras de gênero ("a aposta" → "o desafio") aplicado
  a 96 arquivos, mais renomeação de arquivos e pastas.
* Migration `RenomeiaApostaParaDesafio`, escrita à mão com `RENAME`.
* `schema.sql` regenerado por `dotnet ef migrations script --idempotent`.
* ADR 0017 e ajustes de texto em RN, requisitos, telas e ADRs.

## O que a IA errou

* **Migration gerada pelo EF era destrutiva.** O diff automático fazia
  `DropTable` e recriava tabelas (perda de dados). A IA percebeu ao ler o
  arquivo e reescreveu com `RENAME`.
* **A substituição de texto quebrou a gramática** em vários pontos: "desafios e
  desafios informais", "Toda desafio custa CP", "o desafio já foi encerrada",
  "CANCELADo" (a regra de adjetivos foi case-insensitive e alterou um valor de
  status em maiúsculas), e o verbo "aposta" ("cada um aposta o quanto quer")
  virou "cada um desafio". Todos corrigidos a mão após revisão linha a linha.
* **Ledger append-only.** A primeira ideia era atualizar `APOSTA_ESCROW` nas
  linhas antigas; o trigger do ledger proíbe, e a regra do projeto também.
  A constraint passou a aceitar os dois valores (ver ADR 0017).
* **Ambiguidade do papel `APOSTADOR`**: mantido por decisão da IA, registrada no
  ADR 0017 como ponto a revisar; o time não decidiu isso explicitamente.

## Como o time validou

* `dotnet test`: 21 testes passando, em banco criado do zero pelas migrations.
* Banco antigo com dados (seed antigo: 4 apostas, 21 lançamentos) migrado para o
  novo: contagens preservadas, views de reconciliação e escrow órfão vazias,
  `UPDATE` no ledger continua bloqueado, nenhuma coluna, constraint, índice ou
  rotina com "aposta" no nome.
* `schema.sql`, `seed.sql` e `analytical_queries.sql` executados em PostgreSQL 16
  limpo, sem erro.
* `tsc --noEmit` e `vite build` do front sem erro; `dotnet ef migrations
  has-pending-model-changes` sem pendência.
* Verificação de links entre os `.md`: nenhum quebrado.

## Decisão final

Entra tudo, sem commit, a pedido do grupo (apresentação). Não testado: o fluxo
completo no navegador contra a API.
