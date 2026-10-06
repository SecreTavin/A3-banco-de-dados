# 2026-10-02 — DER com chaves (PK, FK, UK) e júri validando o desafio

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/03-banco-de-dados/modelagem/10-der.md` |

## O que foi pedido

Um diagrama com o relacionamento entre as entidades, mostrando chaves primárias
e estrangeiras, para facilitar a apresentação à banca, e deixar explícito que o
júri valida o desafio.

## O que a IA produziu

Segundo diagrama Mermaid (`erDiagram`) com atributos e chaves das dez entidades,
tabela das 18 FKs com o comportamento ao apagar o pai, rótulos novos nas
relações do júri e a seção "O júri valida o desafio".

## O que a IA errou

* Uma primeira versão do texto sobre `ON DELETE` dizia para "conferir antes de
  citar na banca", transferindo ao time uma checagem que a IA devia ter feito.
  Foi trocada pela regra: FK sem `ON DELETE` explícito no modelo lógico é
  `RESTRICT`.
* O diagrama omite colunas de data e textos livres para caber em um slide; isso
  não é erro, mas o time deve saber que ele não substitui o modelo lógico.

## Como o time validou

Chaves e restrições conferidas contra `11-modelo-logico.md` e contra as FKs do
`EuDuvidoDbContext`. **O Mermaid não foi renderizado** (só a sintaxe foi
revisada); abrir o arquivo no GitHub/GitBook antes de apresentar.

## Decisão final

Entra no `10-der.md`, sem commit. As quatro instâncias (`desafio_postado`,
`desafio_validado`, `desafio_executado`, `desafio_cumprido`) não foram
modeladas, por decisão do time: o estado continua sendo a coluna `status`.
