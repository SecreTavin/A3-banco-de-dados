# 2026-11-27 — Testes de ponta a ponta do PR #84 (RN29 e provas do desafiado)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/testes/roteiro-e2e.py` (E19 a E21), `scripts/testes/roteiro-e2e-ui.mjs` (U17), `docs/05-qualidade/17-testes.md`, `docs/05-qualidade/roteiro-e2e.md`, `docs/05-qualidade/18-registro-ia.md`, `SUMMARY.md` |

## O que foi pedido

Trazer para a branch o código do PR #84, já mergeado na `main`, e criar os
testes de ponta a ponta que faltavam para ele.

## Prompt utilizado

> fiz um merge de um pr aberto, atualize o codigo e crie os testes necessários para ele tambem

## O que a IA produziu

* Leitura do diff do #84 (`17996e8..edd7ceb`). O PR já trazia testes de
  integração (I12 a I14 do nível 3) e o cenário de tela U16, que nunca rodou.
  Faltavam a cobertura pela API do endpoint novo `minhas-provas` e da RN29, e
  um cenário para a tela "Suas provas no júri".
* **E19 a E21 no roteiro da API.** Usam a evidência 2 do seed, em que Theus já
  votou com comentário e Lari e Lipe ainda não:
  * E19 e E20 rodam antes do voto da demo (E04), com a votação aberta;
  * E21 roda depois, com a votação fechada;
  * a saída passou a sair ordenada por ID.
* **U17 no roteiro de tela.** O desafiado abre a aba Votação e confere o placar
  contra o banco, o comentário do U16 e a ausência de botão de voto. Se o voto
  do U16 já fechou o júri, confere que a prova saiu da lista.
* Documento 17 e roteiro completo atualizados com os casos novos e a
  cobertura recalculada.

## O que a IA errou

* **Atualização do código.** `git stash`, `git merge`, `git switch` e
  `git add` foram bloqueados pelo modo automático. A IA passou os comandos ao
  responsável, que os rodou, e depois resolveu os conflitos do `stash pop` em
  `SUMMARY.md` e `18-registro-ia.md`, mantendo os dois lados em ordem
  cronológica.
* **D05 desatualizado.** O roteiro completo, escrito antes do #84, dizia que o
  detalhe "nunca mostra o voto de cada um". A RN29 mudou isso, e o cenário foi
  reescrito.
* **Contagem.** Os cenários novos estão escritos mas não rodaram, e
  contá-los como cobertos inflaria o número. O roteiro ganhou a marca ✎ para
  separar os casos escritos dos executados.

## Como o time validou

* `node --check` no roteiro de tela e `py_compile` no da API: sintaxe válida.
* `dotnet test --filter Tests.Unidade` com o código do #84: **122 de 122**.
* **Não executados:** os roteiros de ponta a ponta e os testes de integração,
  porque o Docker Desktop não estava rodando na máquina. E19 a E21, U16 e U17
  estão marcados como "Não executado" no documento 17.
* Os valores esperados do E19 ao E21 (Theus votou, quórum 2, comentário da
  Lari) foram conferidos contra o `seed.sql` e contra o próprio E04.

## Decisão final

Os casos entram escritos e marcados como não executados, até alguém rodá-los
com o Docker no ar. Fica registrado para o time que o PR #84 numerou os testes
de integração como I12 a I14, IDs que o nível 5c já usa.
