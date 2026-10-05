# 2026-09-10 — Resolve ambiguidade de data no Anexo 1 (ficha de inscrição)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-10 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | `docs/00-introducao/07-plano-de-trabalho.md` |

## O que foi pedido

O usuário enviou o PDF original da Ficha de Inscrição (fonte primária do
Anexo 1). Não foi pedido explicitamente para resolver a pendência de data,
mas o documento continha a evidência que faltava, então a IA cruzou os
dados em vez de só usar o PDF pra extrair campos em branco.

## O que a IA produziu

Releu o Anexo 1 do PDF: a sequência de semanas da Etapa E4 é `06/11 → 13/11
→ 20/12 → 27/11`. "20/12" quebra a ordem cronológica das outras três
semanas, que são todas consecutivas em novembro. Cruzando com o calendário
(20/11 é feriado nacional — Consciência Negra, Lei 14.759/2023) e com o
"Data Revisão: 20/11" já registrado no manifest do projeto, a IA concluiu
que "20/12" é erro de digitação por "20/11" e atualizou a ressalva em
[07-plano-de-trabalho.md](../../00-introducao/07-plano-de-trabalho.md) que
antes pedia confirmação com o professor sem uma hipótese concreta.

## O que a IA errou

Nenhum erro identificado nesta alteração — a leitura anterior do documento
(antes de ter o PDF original) já tinha sinalizado a inconsistência sem
resolvê-la; agora, com a fonte primária em mãos, a IA teve como cruzar
evidência (sequência cronológica + calendário de feriados nacionais) para
propor uma leitura concreta, em vez de inventar uma data.

## Como o time validou

* A hipótese foi checada contra duas fontes independentes dentro do próprio
  Anexo 1: a ordem das semanas (`06/11, 13/11, [?], 27/11`) e o campo
  separado "Data Revisão: 20/11" da mesma etapa — as duas apontam pra
  20/11, não 20/12.
* Checagem externa: 20 de novembro é feriado nacional no Brasil desde 2023
  (Lei 14.759/2023), o que dá uma razão concreta pro Anexo 1 marcar aquela
  semana como "entrega virtual pelo GitBook" em vez de revisão presencial.
* **Pendência que continua real:** apesar da evidência, isso não substitui
  a confirmação do professor — typos em documento oficial podem, em teoria,
  ser outra coisa. O documento atualizado mantém a recomendação de
  confirmar antes da semana em questão, só que agora com uma leitura
  concreta em vez de uma pergunta em aberto.

## Decisão final

`07-plano-de-trabalho.md` atualizado com a leitura de 20/11 e a
justificativa. Nenhuma outra data do cronograma (entregas 1–4, banca final)
precisou de ajuste — todas já batiam com o que está no
[`manifest.json`](../../../scripts/entregas/manifest.json).
