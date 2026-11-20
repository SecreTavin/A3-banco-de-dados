# 2026-11-16 — Roteiro da demonstração da Banca Final

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-16 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/06-encerramento/roteiro-da-demonstracao.md` (novo), `README.md`, índice do encerramento, `SUMMARY.md`, slide de demonstração do deck da banca |

## O que foi pedido

Um roteiro novo para a apresentação, com todas as funcionalidades do projeto,
publicado no GitBook e no slide de demonstração.

## Prompt utilizado

> Na verdade, chegando perto da apresentação, vamos subir um novo roteiro apresentando todas as funcionalidades do projeto.

Escolhas do PO, respondidas a perguntas da IA:

> Duração: 10 a 15 minutos. Formato: GitBook e slides.

## O que a IA produziu

* **Inventário das funcionalidades** a partir do código da `main`: rotas do
  front, endpoints da API e o estado deixado pelo seed.
* **Roteiro de 9 passos em 13 minutos**, seguindo o ciclo de vida de um desafio.
  Cada passo traz:
  * o que fazer na tela, com os textos reais dos botões;
  * o que dizer;
  * o que acontece no banco, com números;
  * o que fazer se der errado.
* **Material de apoio:**
  * preparação para a véspera e para uma hora antes;
  * plano B no Docker local;
  * consultas de `psql` prontas;
  * funcionalidades fora do roteiro;
  * perguntas prováveis da banca.

## O que a IA errou

* **Um erro 500 tomado por defeito da demonstração.** No ensaio, criar um
  desafio aceitável deu 500. A causa era o próprio ensaio: ele mandava a data com
  fuso `-03:00`, e a API só aceita UTC. A tela manda em UTC (`toISOString()`), e
  com UTC a IA aprovou a proposta. Fica o defeito menor: a API responde 500, e
  não 400, para uma data com fuso. Foi registrado para o time.
* **O passo do aceite estava incompleto** no primeiro rascunho. Ele citava só o
  botão final. Na leitura do código, apareceram as duas escolhas que vêm antes
  (papel e aposta), e o passo foi corrigido.

## Como o time validou

* **Ensaio completo** num banco recém-criado pelo seed, num projeto Docker
  separado (`euduvido-ensaio`), passo a passo, pela API. O efeito de cada passo
  foi conferido no PostgreSQL:
  * cadastro de 12 anos recusado (422), 9 usuários;
  * Aninha com 100 CP e `CREDITO_INICIAL`;
  * IA aprovando "Cantar o hino" e recusando "vodka" (422, com o motivo);
  * aceite com Biel 110 → 85, Theus 35 → 10 e 50 CP retidos;
  * prova do Lipe com júri Tavin, Biel, Lari e Aninha;
  * voto da Lari: `ACEITA`, `FINALIZADA_CUMPRIU`, prêmio de 30 + 30, +2 CP por
    voto, Tavin 110, Theus 42, Lari 102;
  * voto repetido recusado (409);
  * ranking na ordem do roteiro;
  * views vazias;
  * `UPDATE` no ledger recusado pela trigger.
* **Textos dos botões** conferidos no código das telas.

## Decisão final

Entra o roteiro no GitBook, com link no `README.md`, e o slide de demonstração
passa a resumir os 9 passos. O roteiro vale para a `main` de 16/11. Se a PR #63
(redesign) ou a #60 (login com Google) entrarem antes da banca, os passos 2 e os
textos dos botões precisam ser conferidos de novo.
