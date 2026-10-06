# 2026-10-02 — Plano de trabalho com responsável por semana e visão por integrante

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/00-introducao/07-plano-de-trabalho.md` |

## O que foi pedido

Adicionar ao plano de trabalho a separação das atividades semanais por
integrante e criar a visualização por semana (gráfico).

## O que a IA produziu

* Coluna **Responsável** em todas as tabelas semanais, preenchida nas semanas
  vencidas a partir de `git log` (autor, data e mensagem).
* Gráfico Gantt em Mermaid (já usado no repositório) com uma faixa por
  integrante.
* Seção explicando como ler a coluna e o que é fato e o que é proposta.

## O que a IA errou

* A exigência de "identificar a participação por etapa" foi apresentada como
  lacuna do plano, mas a IA só conhecia a seção 2 do edital pela citação no
  próprio documento, sem ter o texto original. A premissa não estava
  verificada.
* O Git não rastreia a semana de 04/09 nem qualquer trabalho de Luís e Mario.
  A IA não pode inventar autoria: deixou 04/09 como "a confirmar" e não
  atribuiu nada vencido a eles.
* As semanas futuras são inferidas das funções (Testes, PO, Documentação), não
  de um combinado do time. Estão marcadas como *(proposto)*.

## Como o time validou

* Autoria das semanas vencidas conferida contra `git log` (autor e data).
* A sintaxe do Mermaid precisa ser conferida na renderização do GitBook e do
  GitHub antes do merge.

## Decisão final

Entra com as semanas futuras como proposta, a confirmar pelo time, e com 04/09
pendente de confirmação.
