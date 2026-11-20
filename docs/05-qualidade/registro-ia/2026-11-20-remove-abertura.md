# 2026-11-20 — Abertura animada removida do app

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/web/src/App.tsx`, `apps/web/src/features/abertura/` (removida), `scripts/testes/roteiro-e2e-ui.mjs`, `scripts/testes/roteiro-e2e-ia.mjs`, `scripts/telas/capturar-telas.mjs`, `scripts/telas/medir-rolagem.mjs`, documentos 07, 17, 22, 30, README de UX, proposta da tela inicial e roteiro da demonstração |

## O que foi pedido

Tirar a abertura animada do app final. O site passa a abrir direto no login,
ou no app para quem já está logado.

## Prompt utilizado

> animação irá sair do app final, pode criar um pr removendo ela do inicio e apos isso iniciar aquelas correções que passamos após análise das transcrições, essas correções irão subir em um pr, a animação fora ira entrar em outro pr

## O que a IA produziu

* `App.tsx` sem a etapa da abertura. A pasta `features/abertura/` foi apagada,
  e o código continua no histórico do Git (último commit com a abertura:
  `0ffd3e9`). Nenhuma dependência nem arquivo estático era exclusivo dela.
* Os roteiros de tela, de IA simulada, de capturas e de medição de rolagem
  deixaram de esperar a abertura. O U13 passou a conferir o contrário: sem
  sessão, `/` leva a `/login`; logado, leva a `/desafios`; e nenhuma abertura
  aparece no caminho.
* RF17 riscado no documento 07, com a data. As telas 30 e 22, o README de UX e
  a proposta da tela inicial ganharam a nota da remoção, sem apagar o histórico
  das rodadas. O passo 1 do roteiro da demonstração virou "Abrir o site", com a
  mesma numeração dos demais passos.

## O que a IA errou

* Na conversa anterior, a IA tinha dito ao Rafael que a abertura 3D era "a mais
  nova" e não "a antiga". Isso estava certo nas datas, mas não respondia ao
  que importava: o time não queria animação nenhuma na versão final.
* O primeiro plano do roteiro da demonstração renumerava todos os passos.
  Como o PR das correções da reunião com o professor também mexe nesse arquivo,
  a renumeração geraria conflito entre os dois PRs. A IA trocou o plano por
  manter a numeração e reescrever só o passo 1.

## Como o time validou

* `npm run build` em `apps/web` passou, e `node --check` passou nos quatro
  scripts alterados.
* Roteiros num banco recém-criado, com a API sem chave da IA:
  * tela: **13 de 14**, com o U13 novo aprovado;
  * IA simulada: **14 de 14**.
* O único reprovado foi o U11. A falha é anterior a este PR: o redesign
  mobile-first deixa a área de conteúdo rolar em `/desafios/nova`, `/perfil` e
  `/grupos/:id` em 1440x900, e a falha é a mesma da rodada de 20/11 na branch
  do login.

## Decisão final

O app abre direto no login. A abertura fica documentada como proposta que
existiu e foi removida.
