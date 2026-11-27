# 2026-11-27 — Roteiro completo dos testes de ponta a ponta

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/05-qualidade/roteiro-e2e.md` (novo), `docs/05-qualidade/17-testes.md`, `docs/05-qualidade/README.md`, `docs/05-qualidade/18-registro-ia.md`, `SUMMARY.md` |

## O que foi pedido

Depois da medição de cobertura
([registro anterior](2026-11-27-cobertura-e2e.md)), mapear todos os cenários
de ponta a ponta possíveis no sistema e montar o roteiro de testes a partir
deles.

## Prompt utilizado

> muda a branch. Analisa e cria o roteiro dos testes e2e, mapeie todas as possibilidades...

## O que a IA produziu

* Leitura dos 24 endpoints, dos validadores, dos handlers, das regras de
  domínio (`Desafio`, `GrupoAmigos`, `Evidencia`, `Usuario`), das procedures
  `apurar_votacao`, `encerrar_desafio`, `cancelar_desafio` e `remover_membro`,
  do `PrazosWorker`, do `VotacaoHub` e das 9 telas.
* 187 cenários em 12 áreas, cada um com resultado esperado, situação (coberto,
  manual, lacuna ou risco) e prioridade, mais uma ordem sugerida de
  implementação.
* Sete riscos que a leitura do código indica, que cobrem 9 cenários ⚠. Os mais
  graves: o pote preso quando ninguém está do lado vencedor (V27), a evidência
  que continua em votação depois do cancelamento (D32), e o hub do SignalR sem
  autenticação (H01, H02).

## O que a IA errou

* **Trocar de branch.** O `git switch -c docs/roteiro-e2e` foi bloqueado pelo
  modo automático. Os arquivos ficaram na árvore de trabalho da
  `feat/video-demonstracao` até o responsável trocar a branch à mão.
* **IDs repetidos.** A primeira versão usou `T` para telas e `R` para ranking,
  prefixos que o documento 17 já usa para constraints e para a Groq real, e o
  roteiro cita `T06`, `T11`, `T13` e `T19` do documento 17. Telas viraram `F`
  e ranking virou `K`, e o documento explica os prefixos.
* **Sexta evidência.** O levantamento inicial tinha o cenário "sexta evidência
  responde 409 `LimiteAtingido`". Pela `apurar_votacao`, a quinta evidência
  não aceita já encerra o desafio, então a sexta não chega a esse erro. O
  cenário saiu e virou uma nota.
* **Contagem do resumo.** Somada à mão primeiro e depois conferida por script
  sobre as tabelas: 187 cenários, 51 ✅, 8 ◐, 119 ⬜ e 9 ⚠.

## Como o time validou

* Cada erro esperado (`Desafio.PapelJaOcupado`, `Grupo.UltimoAdmin` etc.) foi
  tirado do código que o devolve, não da documentação.
* Cada risco cita o arquivo e a rotina onde está. V27 foi conferido contra a
  definição de `vw_escrow_orfao`, que filtra desafios encerrados com pote
  diferente de zero, e contra a tela, que deixa escolher qualquer lado.
* **Nenhum cenário novo foi executado.** Os riscos ⚠ são hipóteses da leitura
  do código. O documento diz isso no topo e na seção de riscos.

## Decisão final

Entrou o roteiro como documento novo, abaixo do 17. Os riscos ficam para o time
confirmar rodando os cenários, e as duas observações de regra (apostador no
júri, desafiado apostando contra si) ficam para decisão do PO.
