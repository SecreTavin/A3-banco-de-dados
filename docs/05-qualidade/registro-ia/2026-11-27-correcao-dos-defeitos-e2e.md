# 2026-11-27 — Correção dos 10 defeitos achados pelo roteiro completo

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `database/scripts/ddl/functions/02-economia.sql`, `Shared/Database/Sql/v4-02-economia.sql` (novo), migration `20261127132904_RegrasDeEncerramentoECancelamento` (nova), `database/scripts/ddl/schema.sql` (regenerado), `database/scripts/dml/seed.sql`, `Program.cs`, `Shared/Realtime/VotacaoHub.cs`, `DesafiosEndpoints.cs`, `PrazosWorker.cs`, `EnviarEvidenciaHandler.cs`, `EvidenciaErrors.cs`, três CSS do frontend, `docs/01-negocio/08-regras-de-negocio.md`, roteiros de teste, `docs/05-qualidade/roteiro-e2e.md`, `docs/05-qualidade/17-testes.md` |

## O que foi pedido

O hook da meta "cobrir todos os cenários de testes e2e" recusou o
encerramento com 10 cenários reprovando. A IA perguntou ao responsável o que
fazer, e ele decidiu:

* aprovar o validador do Google simulado (ADR 0024);
* corrigir os 5 defeitos técnicos (H01, H02, C02, D25, S05);
* adotar a proposta padrão para as 4 regras (V27, D32, P05, V11);
* ajustar o CSS do U11.

## Prompt utilizado

> Goal set: cobrir todos os cenários de testes e2e

Respostas do responsável, uma por pergunta da IA: "Aprovo", "Corrigir os 5",
"Proposta padrão", "Ajustar o CSS".

## O que a IA produziu

* **Banco.**
  * `encerrar_desafio`: um ramo novo devolve o pote a quem entrou quando
    ninguém escolheu o lado vencedor.
  * `cancelar_desafio`: expira a prova que estava no júri.
  * O arquivo atual foi congelado como `v4-02-economia.sql` e é aplicado por
    uma migration nova; a volta reaplica a v3.
  * O `schema.sql` foi regenerado pelo `dotnet ef migrations script
    --idempotent`, e o diff só acrescenta a migration.
* **API.**
  * O hub exige login, e `EntrarNoGrupo` confere se quem chama é membro.
  * O aceite traduz as violações de constraint em 409 e devolve 404 para quem
    não é do grupo.
  * O `/health` tem prazo de 5 s.
  * A prova sem júri é recusada.
  * O `PrazosWorker` encerra como perdido o desafio vencido sem prova no júri
    (nova RN30).
* **Regras.** RN12, RN14 e RN23 foram complementadas e a RN30 criada no
  documento 08, junto com o que as garante.
* **Frontend.** Em `/desafios/nova`, os grupos ficaram numa linha só, com
  altura fixa e nome com reticências. Em `/grupos/:id`, a coluna do filtro
  ficou mais larga. O rodapé da área de conteúdo ficou menor a partir de
  1440 px.
* **Testes.** Os cenários corrigidos agora conferem a regra decidida, e não
  só que o defeito sumiu.

## O que a IA errou

* **Efeito da RN30 no seed, pego antes de rodar.** Os desafios 2 e 8 do seed
  tinham prazo fixo já vencido, e a regra nova os encerraria assim que a API
  subisse, quebrando o U15 e a demonstração. O seed passou a usar prazos
  relativos nos desafios em curso. **O mesmo efeito vale para o banco da VM:**
  no deploy, todo desafio em curso vencido e sem prova no júri será encerrado
  como perdido.
* **CSS em três tentativas.** A primeira versão deixou 13 px de rolagem, e a
  segunda, 5 px. Na linha única, o nome "Os Inimigos do Fim" quebrava em duas
  linhas e aumentava o cartão. A terceira pôs o nome em uma linha, com
  reticências. Cada tentativa foi medida a 1440x900 com o Tavin em 3 grupos,
  a condição em que o U11 reprovava.
* **Testes desatualizados pelas próprias correções.**
  * F33 ainda esperava o 403 que o D25 virou 404.
  * H02 montava a mensagem de falha com `.slice` sobre um evento que agora,
    corretamente, não existe.
* **Mistura de dados entre roteiros.** O A15 criava um segundo "Tavin", e o
  roteiro da IA buscava o Tavin pelo apelido sem `LIMIT` (I01 reprovou com
  NaN). O A15 passou a repetir o apelido de um usuário próprio, e as buscas
  por apelido pegam o de menor id.
* **F25 instável.** O teste esperava "nenhum diálogo na tela", mas o diálogo
  de resultado substitui o de confirmação. Agora espera o texto "Voto
  registrado".

## Como o time validou

Pilha própria reconstruída, navegador visível. A tela rodou num banco novo; os
demais roteiros, em sequência no mesmo banco:

* `dotnet test`: **183 de 183**;
* API principal: **30 de 30**;
* tela principal: **21 de 21**, com o U11 aprovado pela primeira vez desde
  20/11;
* API completo: **92 de 92**;
* tela e tempo real completo: **26 de 26**;
* IA simulada: **14 de 14**;
* views de contabilidade vazias no fim.

## Decisão final

Os 201 cenários do roteiro completo passam. Ficam para a revisão do PR:

* conferir que `GOOGLE_SIMULADO_CHAVE` não está no `.env` da VM (ADR 0024);
* avisar o time de que a RN30 encerra, no primeiro deploy, os desafios em
  curso vencidos sem prova;
* duas observações de regra que o PO ainda não decidiu: o apostador vota no
  júri, e o desafiado pode apostar contra si.
