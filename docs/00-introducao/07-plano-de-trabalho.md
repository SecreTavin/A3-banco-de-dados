# 07 - Plano de Trabalho

Cronograma do Projeto A3, no formato pedido pelo Anexo 1 da ficha de
inscrição (semana a semana, ligado às datas de revisão em sala definidas pelo
professor). O status de cada etapa reflete o estado real do repositório — as
datas ainda não vencidas mostram o planejado, as vencidas mostram o que
efetivamente aconteceu (ver histórico de commits).

Para o status de cada **entrega formal** (o que precisa estar pronto em cada
data de revisão), ver [07 - Entregas](../07-entregas/README.md). Este
documento é sobre a semana a semana; aquele é sobre "o que a entrega N
exige".

## Visão em uma tela (setembro a novembro)

Pedido do professor na revisão de 31/10/2026: o plano inteiro num único slide,
com atividades, responsáveis e meses, para a parte da banca que avalia o plano
de trabalho. O detalhe semana a semana está nas seções seguintes.

| Atividade | Responsáveis | Set | Out | Nov |
| --- | --- | :-: | :-: | :-: |
| Problema, requisitos, regras de negócio e justificativa | Octávio, Rafael | ● | ● | |
| Modelagem: DER, modelo lógico e schema | Arthur, Rafael | ● | ● | |
| Idade mínima e moderação por IA (ADR 0015) | Octávio, Arthur | ● | ● | |
| Banco: constraints, procedures, seed e consultas | Arthur, Octávio | | ● | |
| API e telas | Arthur, Rafael, Octávio | ● | ● | ● |
| Testes de aceitação e roteiros de ponta a ponta | Mario e Luís (testes), Rafael | | ● | ● |
| Redesign de UI/UX e redesign mobile-first | Octávio, Rafael | | ● | ● |
| Login com Google | Octávio (especificação), Rafael (Google Cloud e publicação) | | | ● |
| Publicação: Cloudflare e VM da Oracle | Octávio, Rafael | | ● | ● |
| Registro de uso de IA | Rafael, Octávio, Arthur | ● | ● | ● |
| Apresentação: roteiro da demonstração, slides e card | Octávio | | | ● |
| Revisões em sala: 11/09, 02/10, 30/10 e 20/11 (virtual) | Todos | ● | ● | ● |

Os responsáveis saem dos commits, dos PRs e dos registros de IA de cada
atividade. Trabalho que não deixou rastro no repositório (reuniões, conversas no
grupo, testes manuais) está nas linhas semanais, quando foi informado ao time.

## Como ler a coluna Responsável

* Nas semanas **vencidas**, o responsável sai do histórico de commits e PRs do
  repositório. Trabalho feito em reunião ou fora do Git não aparece — quem
  não tem commit não está sem participação, está sem rastro aqui.
* Nas semanas **futuras**, o responsável é uma **proposta** (marcada com
  *(proposto)*) derivada da função de cada integrante em
  [Distribuição de responsabilidades](#distribuição-de-responsabilidades). O
  time ainda precisa confirmar.

## E1 — Proposta e Requisitos

| Semana | Atividade | Responsável | Status |
| --- | --- | --- | --- |
| 27–28/08 | Definição do problema, refinamento de telas iniciais | Octávio Augusto Arruda dos Prazeres (arquivos `.md` iniciais), Rafael Alves (refinamento das telas) | ✅ Concluído |
| 04/09 | Levantamento de requisitos, regras de negócio, justificativa | Sem commit próprio na semana — a confirmar com o time | ✅ Concluído |
| 03/09 | *(fora da grade, adiantado)* modelagem, DER, schema, API, frontend e povoamento implementados de uma vez | Arthur Araujo Marzano | ✅ Concluído |
| 11/09 | **Revisão de Projeto em sala** (RT01) — fechamento da Entrega 1 | Rafael Alves (ficha, resposta-síntese, tag), Octávio Augusto Arruda dos Prazeres (ADR 0015) | ✅ Concluído — 9/9, tag `entrega-1` enviada |

## E2 — Modelagem

| Semana | Atividade | Responsável | Status |
| --- | --- | --- | --- |
| 18/09 | Revisão da modelagem contra o schema já implementado | Rafael Alves | ✅ Concluído — feita em 02/10, junto com os ajustes abaixo |
| 25/09 | Ajustes de DER/modelo lógico conforme feedback da revisão de 11/09 | Rafael Alves, Octávio Augusto Arruda dos Prazeres (ADR 0015) | ✅ Concluído — modelagem de idade mínima e moderação por IA (RT01, ADR 0015); em 02/10, simplificação do modelo para 10 tabelas em schema único (ADR 0016) |
| 02/10 | **Revisão de Projeto em sala** — fechamento da Entrega 2 | Rafael Alves | ✅ Concluído — 8/8, tag `entrega-2` enviada |

## E3 — Banco de Dados

| Semana | Atividade | Responsável | Status |
| --- | --- | --- | --- |
| 09/10 | Revisão de constraints, índices e consultas analíticas | Arthur Araujo Marzano (modelo v3 e IA de moderação, 05–06/10), Octávio Augusto Arruda dos Prazeres (seed, consultas e documentos, 29/10) | ✅ Concluído — PRs #3 e #32 na `main` em 29/10, 147 testes passando |
| 16/10 | Recesso do professor | — | — |
| 23/10 | **Semana Prova A1** — presencial em sala (15 pontos, individual) | Todos, individualmente | ➖ Individual, em sala — sem rastro no repositório |
| 26–30/10 | Testes de aceitação do protótipo: desktop e mobile; feedback consolidado e corrigido | Mario Lana Veloso Junior (desktop) e Luís Phillipe Pedra Souza (mobile), testes; Rafael Alves, correções | ✅ Concluído — correções nos PRs #34 e #35 (ver [17 - Testes](../05-qualidade/17-testes.md)) |
| 30/10 | **Revisão de Projeto em sala** — fechamento da Entrega 3 | Rafael Alves (PRs #34 a #36: redesign do front e MinIO), Octávio Augusto Arruda dos Prazeres (PR #33: GitBook e registros de IA) | ✅ Concluído — 8/8, tag `entrega-3` enviada |

## E4 — Sistema Funcional e Banca ExpoUna (1ª janela)

| Semana | Atividade | Responsável | Status |
| --- | --- | --- | --- |
| 06/11 | Testes do sistema, registro de uso de IA | Luís Phillipe Pedra Souza, Mario Lana Veloso Junior (testes); Rafael Alves (registro de IA) *(proposto)* | ✅ Concluído — roteiros reexecutados com a abertura em 3D em 07/11 (Octávio) e campo *Prompt utilizado* preenchido nos registros em 09/11 (Rafael, PR #55); testes de Luís e Mario nesta semana sem rastro no repositório |
| 13/11 | Preparação da apresentação e roteiro de demonstração | Octávio Augusto Arruda dos Prazeres (roteiro), Rafael Alves (VM e redesign) | ✅ Concluído em 16/11 — roteiro da demonstração (Octávio) e site público na VM da Oracle (Rafael, ADR 0020); redesign mobile-first em 10/11 (Rafael, PR #63) |
| 20/11 | Feriado (Consciência Negra) — **fechamento da Entrega 4 é virtual, pelo GitBook**, em vez de revisão presencial | Rafael Alves *(proposto)* | 🔵 Em andamento — login com Google (PR #61), slides, card da EXPOUNA e conclusão no GitBook; a tag `entrega-4` fica com o PO |
| 27/11 | **Banca ExpoUna (1ª janela)** — apresentação do Projeto A3 (20 pontos, 2 ou 3 grupos nesta janela) | Todos | 🔵 É hoje — o grupo apresenta nesta janela: trailer, 14 slides, vídeo "Demonstracao" e demonstração ao vivo ([roteiro dos slides](../06-encerramento/roteiro-dos-slides.md)) |

> O Anexo 1 original (ficha de inscrição) imprime essa semana como "20/12",
> o que quebra a sequência cronológica das outras semanas (06/11 → 13/11 →
> 20/12 → 27/11). Lendo como **20/11** — erro de digitação — a sequência
> fecha certinho, e 20/11 é feriado nacional (Consciência Negra, Lei
> 14.759/2023), o que explica por que o Anexo 1 marca essa entrega como
> virtual pelo GitBook em vez de revisão em sala. Isso também bate com o
> "Data Revisão: 20/11" da Entrega 4 em
> [07-entregas/entrega-4-sistema-funcional.md](../07-entregas/entrega-4-sistema-funcional.md).
> Interpretação com boa confiança, mas ainda vale confirmar com o professor
> antes da semana em questão.

## E5 — Banca ExpoUna (2ª janela) e encerramento

| Semana | Atividade | Responsável | Status |
| --- | --- | --- | --- |
| 04/12 | **Banca ExpoUna (2ª janela)** — reserva: o grupo já apresenta em 27/11 | Todos | ⚪ Reserva |
| 11/12 | **Semana Prova A2** — presencial em sala (15 pontos, individual) | Todos, individualmente | ⚪ Planejado |
| 18/12 | Fim do semestre letivo | — | — |

> O grupo apresenta na **1ª janela, em 27/11**. A 2ª janela (04/12) só é usada
> se o professor remarcar. Os documentos de
> [Entrega 4](../07-entregas/entrega-4-sistema-funcional.md) e
> [Banca Final](../07-entregas/banca-final.md) seguem essas datas.

## Visão semanal por integrante

Mesmo conteúdo das tabelas acima, agora com uma faixa por pessoa. Barras
preenchidas são trabalho concluído (com base no Git); as demais são a
proposta para as semanas que faltam. Provas individuais (23/10 e 11/12) e
bancas (27/11 e 04/12) envolvem todos e aparecem na faixa de cada um.

```mermaid
gantt
    title Plano de Trabalho por integrante
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    todayMarker off

    section Arthur Marzano
    API, frontend e povoamento (adiantado)  :done, ar1, 2026-09-03, 1d
    Modelo v3 e IA de moderação             :done, ar2, 2026-10-05, 2d
    Prova A1                                :ar3, 2026-10-23, 7d
    Banca ExpoUna 1ª janela                 :ar4, 2026-11-27, 7d
    Prova A2                                :ar5, 2026-12-11, 7d

    section Luís Souza
    Testes de aceitação do mobile           :done, lu0, 2026-10-26, 5d
    Prova A1                                :lu1, 2026-10-23, 7d
    Testes do sistema                       :lu2, 2026-11-06, 7d
    Banca ExpoUna 1ª janela                 :lu3, 2026-11-27, 7d
    Prova A2                                :lu4, 2026-12-11, 7d

    section Mario Veloso
    Testes de aceitação do desktop          :done, ma0, 2026-10-26, 5d
    Prova A1                                :ma1, 2026-10-23, 7d
    Testes do sistema                       :ma2, 2026-11-06, 7d
    Banca ExpoUna 1ª janela                 :ma3, 2026-11-27, 7d
    Prova A2                                :ma4, 2026-12-11, 7d

    section Octávio Augusto Arruda dos Prazeres
    Arquivos iniciais do projeto            :done, oc1, 2026-08-27, 2d
    ADR 0015 idade mínima e moderação       :done, oc2, 2026-09-12, 1d
    Fechamento da Entrega 3 (seed e docs)   :done, oc2b, 2026-10-29, 1d
    Prova A1                                :oc3, 2026-10-23, 7d
    Roteiro de demonstração                 :oc4, 2026-11-13, 7d
    Banca ExpoUna 1ª janela                 :oc5, 2026-11-27, 7d
    Prova A2                                :oc6, 2026-12-11, 7d

    section Rafael Alves
    Refinamento de telas                    :done, ra1, 2026-08-27, 2d
    Fechamento da Entrega 1                 :done, ra2, 2026-09-09, 3d
    Modelagem e fechamento da Entrega 2     :done, ra3, 2026-09-25, 8d
    Redesign do front e MinIO (30/10)       :done, ra4, 2026-10-30, 1d
    Prova A1                                :ra5, 2026-10-23, 7d
    Fechamento da Entrega 3                 :active, ra6, 2026-10-30, 1d
    Registro de IA e material               :ra7, 2026-11-06, 14d
    Banca ExpoUna 1ª janela                 :ra8, 2026-11-27, 7d
    Prova A2                                :ra9, 2026-12-11, 7d
```

## Distribuição de responsabilidades

Exigência da seção 2 do edital, para permitir identificar a participação de
cada integrante nas diferentes etapas.

| Integrante | Responsabilidade |
| --- | --- |
| Arthur Araujo Marzano | Melhoria contínua |
| Luís Phillipe Pedra Souza | Testes |
| Mario Lana Veloso Junior | Testes |
| Octávio Augusto Arruda dos Prazeres | Product Owner |
| Rafael Martins Alves | Documentação |
