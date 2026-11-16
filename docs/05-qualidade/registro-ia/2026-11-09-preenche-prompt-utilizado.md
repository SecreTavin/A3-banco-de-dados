# 2026-11-09 — Preenche "Prompt utilizado" nos registros de Rafael

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-09 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | 30 arquivos de `docs/05-qualidade/registro-ia/` (issue #55), `docs/05-qualidade/18-registro-ia.md` |

## O que foi pedido

Recuperar do histórico do Claude Code os prompts dos 30 registros de Rafael e
acrescentar a seção "Prompt utilizado" a cada um, conforme a issue #55.

## Prompt utilizado

Fonte: transcrição da sessão do Claude Code, texto como foi escrito.

**09/11, 22:38**

> Verifique a Issue aberta para o meu usuário

**09/11**

> varre

## O que a IA produziu

* Varredura de `~/.claude/history.jsonl` e das transcrições do projeto, com a
  cobertura por data.
* Um script que copiou o texto de cada prompt do histórico para a seção do
  arquivo correspondente, sem redigitar.
* A frase de "não recuperável" nos 8 registros de 09 a 11/09 e de "não
  identificado" em 2.

## O que a IA errou

* **Estimou o alcance antes de conferir.** Disse que 18 a 21 registros seriam
  recuperáveis; ao casar um a um, foram 20.
* **O casamento registro × prompt é por contexto.** Data, horário e conteúdo do
  pedido apontam o prompt, mas o histórico não traz o vínculo. O de
  `modelagem-moderacao-ia` (14:13–14:14) é o mais inferido.
* **Primeira execução do script falhou** (`IndexError` ao formatar o horário) e
  foi corrigida antes de qualquer arquivo ser escrito.

## Como o time validou

* `git diff`: 260 linhas acrescentadas, nenhuma removida, 30 arquivos.
* O script exige exatamente uma seção "O que a IA produziu" por arquivo e
  recusa arquivo que já tenha "Prompt utilizado".
* Busca por `gsk_` em `docs/`: nenhuma ocorrência.

## Decisão final

Entram os 30 arquivos. Recuperados: 20. "Não recuperável" (histórico local sem
entradas de 09 a 11/09): 8. "Não identificado com segurança":
`2026-10-02-corrige-contagem-tabelas` e `2026-10-30-atualiza-plano-entrega-3`.
Onde houve vários prompts, entram os que definiram o rumo do trabalho; em
`registro-testes-de-aceitacao` foi citado o de 20:38. Credencial colada em
outra sessão não foi copiada para nenhum registro.
