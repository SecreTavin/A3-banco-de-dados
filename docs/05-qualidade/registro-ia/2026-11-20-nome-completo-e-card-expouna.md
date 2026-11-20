# 2026-11-20 — Nome completo do PO e card da EXPOUNA

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | 36 arquivos de `docs/` (identificação, plano de trabalho, ADRs, documento 18 e registros de IA), `docs/04-ux/card-expouna/` (novo), deck da banca (fora do repositório) |

## O que foi pedido

Corrigir em todos os documentos o nome do PO, que aparecia incompleto, e criar
o card de identidade visual que o professor pediu para a Vitrine Virtual da
EXPOUNA 2026: 900 x 1200, em retrato, com o texto na metade de cima.

## Prompt utilizado

> meu nome não está completo nos slides: Octávio Augusto Arruda dos Prazeres

> Corrija todos os documentos com o meu nome completo. o professor também pediu um card para a apresentação, precisamos criar essa imagem.

## O que a IA produziu

* **Nome:** "Octávio Arruda" virou "Octávio Augusto Arruda dos Prazeres" em
  57 ocorrências, em 36 arquivos de `docs/`, além do slide de integrantes.
  * Ficaram como estavam as menções só com o primeiro nome ("Arthur, Octávio
    e Rafael"), que seguem o padrão dos colegas.
  * O usuário fictício "Octávio Augusto" do `seed.sql` (o Tavin) também
    ficou: é dado de demonstração, não o integrante.
* **Card:**
  * a metade de baixo é um quadro real da abertura em 3D, capturado do app em
    900 x 1200;
  * a metade de cima tem marca, título com borda dourada, frase e botão, como
    no exemplo enviado pelo professor;
  * o card e o HTML que o gera ficam em `docs/04-ux/card-expouna/`.

## O que a IA errou

* **O "!" do título virou um bloco.** No peso 900 da fonte Rubik, o contorno
  grosso fechava o vão entre o traço e o ponto. Com o peso 800 e contorno mais
  fino, ainda não deu certo. O "!" passou a ser desenhado em SVG, barra e ponto
  separados, no estilo da joia da abertura.
* **A marca "?!" saiu empilhada.** O `display: grid` pôs o "?" e o "!" em linhas
  diferentes; o certo era `flex`.
* **O selo do rodapé ficou por cima do "DUVIDO!"** da cena. Foi para o topo.
* **O "!" ficou longe do "Duvido" e o título, fora do centro.** Corrigido
  medindo a posição dos pixels na imagem gerada.

## Como o time validou

* **Nome:** depois da troca, `git grep "Octávio Arruda"` em `docs/` não
  devolve nada.
* **Card:**
  * a imagem gerada foi conferida a cada versão, quatro ao todo;
  * o tamanho final é 900 x 1200;
  * todo o texto fica acima de 580 px, dentro da metade de cima.

## Decisão final

Entram o nome completo nos documentos e no deck, e o card com o HTML de origem.
O PO hospeda o card no Imgur e cola o link na plataforma MostraPlus.
