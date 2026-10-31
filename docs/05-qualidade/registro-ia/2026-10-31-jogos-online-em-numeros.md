# 2026-10-31 — Jogos online no Brasil em números

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-31 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/00-introducao/jogos-online-em-numeros.md` (novo), `docs/00-introducao/README.md`, `SUMMARY.md` |

## O que foi pedido

Depois da apresentação, o professor pediu dados numéricos sobre jogos online no
Brasil: quantas pessoas jogam e quantas participam de sites de competição. Os
números entram no GitBook e no slide, com as fontes.

## Prompt utilizado

> preciso de dados estatísticos, numéricos e quantitativos sobre jogos on line no brasil. Quantidade de pessoas envolvidas com jogos e sites de competições, no final me aponte as fontes que voce usou. "Isso deve conter no gitbook e no futuro slide da apresentação."

## O que a IA produziu

* Pesquisa na web com fonte primária quando havia uma: IBGE (PNAD TIC 2025),
  Pesquisa Game Brasil 2026, Newzoo, Abragames, Gamers Club e as audiências do
  CBLOL medidas pela Esports Charts.
* Uma página nova com uma tabela pronta para o slide, as tabelas por tema, a
  ligação com o público do app e as fontes no formato ABNT.

## O que a IA errou

* **Número que não estava na fonte.** A primeira versão dizia que 98,1% de quem
  tem celular acessa a internet por ele. O número veio do resumo de uma busca. Na
  página do IBGE ele não aparece, então saiu.
* **Finais sem os times e sem a etapa.** As linhas do CBLOL 2022 e da CBLOL Cup
  2026 vinham só com o número. Abrindo as matérias, entraram os confrontos (RED
  Canids x paiN e LOUD x RED Canids), a etapa e a medição da Esports Charts.
* **Referências com título e data aproximados.** As entradas da Omelete, da
  Sheep Esports e da Esports.gg foram corrigidas com o título e a data das
  páginas.
* **Busca sem dado do Brasil.** A busca não achou receita nem audiência de
  eSports do Brasil em 2025 publicadas pela própria Newzoo. A página usa o número
  da América Latina e marca a estimativa de jogadores brasileiros como fonte
  secundária.

## Como o time validou

* Os números do IBGE, das duas finais do CBLOL e da Omelete foram conferidos
  abrindo as páginas, não pelo resumo da busca. As páginas que bloqueiam leitura
  automática foram abertas no navegador.
* Os números que não puderam ser conferidos na origem estão na seção "Cuidados
  com os números": a estimativa de jogadores da Newzoo, os R$ 13 bilhões e o
  cadastro da Gamers Club.

## Decisão final

A página entra como subpágina de "03 - Problema e Contexto". As apostas ficam de
fora, de acordo com o ADR 0017. As fontes ainda não foram copiadas para
"21 - Referências", que segue como esboço até a banca final.
