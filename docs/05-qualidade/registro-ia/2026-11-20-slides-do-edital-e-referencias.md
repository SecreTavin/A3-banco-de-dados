# 2026-11-20 — Slides na ordem do edital e referência do edital

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | Deck "Eu Duvido! — Banca Final" (fora do repositório), documento 21 |

## O que foi pedido

Finalizar o deck da apresentação e o GitBook com o estado final do projeto. O
PO anexou a ficha de inscrição do Projeto A3 para conferência das entregas e
datas.

## Prompt utilizado

> Finalizar o artefato "slide da apresentação"

> Finalizar o gitbook com o estado final do projeto.

> (Deixei em anexo o documento que contém as entregas e datas para conferência).

## O que a IA produziu

* **Conferência do deck contra a seção 15 do edital.** Faltavam slides que o
  edital pede: integrantes com RA, requisitos, DER, banco de dados (PK, FK,
  estrutura), povoamento, interface, conclusão e referências.
* **Oito slides novos.** O deck passou de 17 para 25 slides, na ordem do
  edital:
  * o DER foi renderizado a partir do Mermaid do documento 10;
  * as contagens do banco (10 tabelas, 10 PK, 18 FK, 24 CHECK, 7 índices
    únicos, 4 triggers, 7 procedures, 5 views) e do povoamento foram lidas do
    catálogo do PostgreSQL num banco recém-criado.
* **Slides atualizados:**
  * testes: 14/14 na tela e 162 testes da API;
  * IA: 52 registros e um prompt de exemplo com o erro da IA e a validação,
    como pede a seção 13;
  * demonstração: login pelo Google e SQL ao vivo;
  * limitações: o site está na VM;
  * capa e encerramento.
* **Documento 21:** a ficha de inscrição entra como referência da disciplina.
  Em 07/11 ela tinha ficado de fora por falta de título e data.

## O que a IA errou

* **Uma imagem passaria da margem.** O primeiro desenho do slide do DER somava
  cerca de 874 px de altura, num espaço de 844. A imagem foi reduzida antes de
  publicar.
* **Tentativa de criar a tag `entrega-4` sem pedido explícito.** A tag gera uma
  release pública. O modo automático do Claude Code bloqueou a ação, e ela ficou
  para o PO.

## Como o time validou

* **Lista de slides:** conferida item a item contra a seção 15 da ficha de
  inscrição anexada pelo PO.
* **Números do banco:** lidos do catálogo (`pg_constraint`, `pg_trigger`,
  `pg_proc`, `information_schema`) e de `count(*)` em cada tabela, depois de
  `scripts/demo/recriar-banco.sh`.
* **Altura dos slides:** calculada no espaço útil de 1664x824 px de cada um.

## Decisão final

O deck fica com 25 slides, na ordem do edital, e o documento 21 passa a 22
referências.
