# 2026-11-27 — Testes de ponta a ponta de grupo

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/testes/roteiro-e2e.py` (E22 a E30), `scripts/testes/roteiro-e2e-ui.mjs` (U18 a U21), `docs/05-qualidade/17-testes.md`, `docs/05-qualidade/roteiro-e2e.md`, `docs/05-qualidade/18-registro-ia.md`, `SUMMARY.md` |

## O que foi pedido

O responsável perguntou se criação, edição e exclusão de grupo estavam
testadas. Só o caminho feliz da criação e a remoção de membro estavam. Pediu
então os testes que faltavam, rodando com o navegador visível.

## Prompt utilizado

> testou tambem os cenários de criação de grupo, edição e exclusão?

> escreve os testes de grupo e roda visual

## O que a IA produziu

* **Levantamento.** Antes de escrever, a IA conferiu o que existe:
  * criar grupo: existe;
  * editar: só o nível de filtro tem endpoint e tela; nome e descrição, não;
  * excluir o grupo: não existe, só a remoção de membro.

  A RN25 e o documento 23 de telas prometem "edição/exclusão do grupo", o que
  fica para o time decidir.
* **E22 a E30, na API**, sobre um grupo criado pelo próprio roteiro:
  * criação com nome aparado e filtro padrão;
  * validação de nome e de nível;
  * 404 para quem não é do grupo, em leitura, edição, convite e remoção;
  * convite com e-mail vazio, sem conta, com maiúsculas e repetido;
  * membro comum removendo outro;
  * último ADMIN tentando sair;
  * saída voluntária e readmissão com o ledger fechando;
  * saída barrada por júri aberto. O E30 usa a Lari no grupo 1 do seed, que
    está só no júri, para provar que o júri sozinho barra a saída.
* **U18 a U21, na tela**:
  * troca do filtro;
  * convite com e-mail sem conta;
  * visão do membro comum e trava do único admin;
  * saída pelo diálogo.

  Ficam no fim do roteiro e usam o grupo do U03, para não mudar a lista de
  grupos do Tavin que o U11 mede.

## O que a IA errou

* **U11.** Na rodada anterior, com o U11 aprovado, a IA registrou que ele
  "voltou a passar". Nas duas rodadas desta alteração, em banco recém-criado,
  ele reprovou com os mesmos números de 20/11 (146 px, 68 px e 2 px). A frase
  foi corrigida: a aprovação foi a exceção, e o defeito de layout continua
  aberto.
* **Script de atualização da documentação.** A expressão que marca os cenários
  como cobertos contava uma coluna a mais e não achou nenhuma linha. O
  `assert` do script parou a escrita, e a contagem foi corrigida antes de
  gravar.
* Um comando que juntava `rm` dos prints antigos com a execução foi negado
  pelo modo automático. A execução foi refeita sem apagar nada, com outra pasta
  para os prints.

## Como o time validou

Pilha separada (`COMPOSE_PROJECT_NAME=euduvido-e2e`), banco recriado antes de
cada roteiro e navegador visível:

* API: **30 de 30**;
* tela: **20 de 21** nas duas rodadas, com U18 a U21 aprovados e só o U11
  reprovado (defeito anterior a esta alteração);
* print da falha do U11 conferido: em `/grupos/1`, a linha "Sair do grupo…"
  fica abaixo da dobra em 1440x900.

## Decisão final

Os testes entram aprovados. Grupos passa de 10 para 26 dos 30 cenários do
roteiro completo. Ficam para o time dois pontos: o U11, que reprova desde o
redesign mobile-first, e a edição e exclusão de grupo, que a documentação
promete e o sistema não tem.
