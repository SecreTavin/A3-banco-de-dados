# 2026-09-11 — Fortalece contexto e justificativa contra o guia RT01

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-11 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | `docs/00-introducao/03-problema-e-contexto.md`, `docs/00-introducao/04-justificativa.md` |

## O que foi pedido

O usuário enviou o guia RT01 (documento distribuído pelo professor na noite
da revisão) e perguntou se as respostas para os 8 pontos pedidos já
estavam nos `.md`s do projeto.

## O que a IA produziu

Conferência ponto a ponto do RT01 contra os documentos existentes — não só
"existe um arquivo pra isso", mas "o conteúdo responde ao que foi pedido".
Achou dois pontos fracos:

* **Contexto** — o documento só tinha "Setor de Atuação" (classificação de
  mercado), não a narrativa que o RT01 pede explicitamente ("como a
  situação acontece atualmente", "quem está envolvido"). Adicionada seção
  "Contexto Atual" com essa narrativa.
* **Justificativa** — o texto justificava a escolha de *Banco de Dados
  relacional*, não *por que vale a pena resolver o problema* (que é
  literalmente o que o RT01 pede: "por que é importante resolver o
  problema e quais benefícios o sistema poderá proporcionar"). Adicionado
  parágrafo sobre o benefício social (reduzir calote/discussão, dar
  critério justo), mantendo o parágrafo técnico original como justificativa
  secundária da escolha de tecnologia.

## O que a IA errou

Nenhum erro nesta sessão — mas vale registrar que esses dois documentos já
existiam desde a reorganização de 03/09 (ver
[2026-09-03-arquitetura-e-reorganizacao.md](2026-09-03-arquitetura-e-reorganizacao.md))
sem que ninguém tivesse checado se o conteúdo respondia à pergunta
específica que o professor faz em sala — só se o checklist automático
(`gerar-entregas.mjs`) passava, que verifica só a *existência* do arquivo,
não a qualidade do conteúdo.

## Como o time validou

Comparação direta, frase a frase, entre o pedido do RT01 (incluindo os
exemplos que o professor deu, ex.: "atualmente, os alunos utilizam
anotações espalhadas...") e o texto de cada documento. Não houve execução
de script — é conteúdo textual para apresentação oral, avaliado por
leitura humana antes da RT01 de hoje à noite.

## Decisão final

Os dois documentos entram com o conteúdo reforçado. Um terceiro gap achado
na mesma checagem — "Distribuição de responsabilidades" em
[07-plano-de-trabalho.md](../../00-introducao/07-plano-de-trabalho.md),
ainda vazia — **não foi preenchido pela IA**: é informação que só o time
tem (quem fez o quê), não algo que dá pra inferir do repositório.
