# 2026-11-26 — Voto e comentário do júri na tela do desafio

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-26 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `DesafiosEndpoints.cs` (consulta `JuradosDoDesafio`), `JuradosDoDesafioTests.cs` (novo), `CartaoProva.tsx`, `DetalheDesafioView.tsx`, `ResultadoVoto.tsx`, `detalhe.module.css`, `tipos.ts`, roteiro de tela (U16), documentos 08 e 17, telas 26 e 27 |

## O que foi pedido

O PO achou o bug usando o sistema: o jurado votou com comentário, e ninguém
conseguia ler o comentário. Pediu também para o jurado votar pela própria tela do
desafio. Abrir a issue, corrigir e subir a PR
([#83](https://github.com/SecreTavin/A3-banco-de-dados/issues/83)).

## Prompt utilizado

> Bug: Publiquei uma prova de desafio e o Rafael votou que vale, segundo ele, ele
> adicionou um comentário. Mas não aparece nada pra mim nem na aba de votação, ou
> seja, não consigo ver o que ele comentou sobre a validação da foto. E na tela de
> desafios, deve ter também o campo de fácil acesso para que o user vote, sem ter
> que ir a tela de votação.
>
> Vamos abrir uma issue e após resolver o bug, subir um PR.

## O que a IA produziu

* **Causa.** A justificativa era gravada, mas o detalhe do desafio devolvia só
  "votou ou não". Um comentário no código decidia esconder o voto, e essa regra não
  estava em nenhum documento: o RF07 pede votação com justificativa.
* **API.** O detalhe passa a trazer voto, justificativa e data de cada jurado. A
  consulta foi para a classe `JuradosDoDesafio`, para o teste exercitar o SQL real.
* **Regra nova, RN29.** O jurado que ainda não votou não vê os votos dos outros
  enquanto a prova está em votação, para não ser influenciado. O filtro fica no
  SQL, e não na tela, para o dado nem sair da API.
* **Tela.** O cartão da prova mostra cada voto com o comentário. O jurado pendente
  vota ali, com a mesma confirmação e o mesmo resultado da aba Votação.
* **Testes.** Quatro testes contra o PostgreSQL (I12 e I13) e o cenário U16 no
  roteiro de tela.

## O que a IA errou

* **Teste com o voto em dois passos.** O primeiro teste gravava o voto e depois a
  justificativa. O banco recusou ("voto e definitivo"): a trigger não deixa mudar
  a linha do jurado depois do voto. O teste passou a gravar os dois juntos, como a
  API faz.
* **Botão quebrando linha.** "Não vale" quebrava em duas linhas na coluna estreita
  da prova. Apareceu na conferência visual e foi corrigido.
* **Botão do resultado.** O "Ver o desafio" do resultado do voto navegaria para a
  própria página e deixaria a janela aberta. Na tela do desafio, ele virou "Fechar".

## Como o time validou

* `dotnet test`: 174 de 174, com os 4 novos.
* Roteiro da API: 18 de 18, num ambiente isolado com os dados de teste.
* Fluxo conferido à mão no navegador embutido, num ambiente isolado em outras
  portas, sem tocar na reserva:
  * o desafiado vê o voto e o comentário do jurado;
  * o jurado pendente não vê o comentário;
  * o voto pela tela do desafio grava voto e comentário, fecha o júri e paga;
  * no celular (375 px), a página não rola na horizontal.
* **Não executado:** o roteiro de tela completo, com o U16. O Google Chrome não
  está mais instalado neste computador.

## Decisão final

A regra RN29 é uma decisão de produto tomada pela IA no lugar do PO e explicada na
issue e na PR. Se o PO preferir mostrar os comentários a todos, inclusive aos
jurados pendentes, basta tirar a condição `oculto` da consulta e o teste dela.
