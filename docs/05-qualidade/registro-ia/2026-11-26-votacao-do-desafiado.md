# 2026-11-26 — Aba Votação do desafiado: placar e comentários da própria prova

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-26 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `MinhasProvasNoJuri.cs` e `GET /api/validacao/minhas-provas` (novos), `MinhasProvasNoJuriTests.cs` (novo), `VotacaoView.tsx`, `CardMinhaProva.tsx` e `VotosDoJuri.tsx` (novos), `CartaoProva.tsx`, documentos 17 e tela 27 |

## O que foi pedido

Na aba Votação, o desafiado deve ver o estado atual da própria aposta e os
comentários do júri, sem mudar o bloqueio que impede quem é parte de votar.
Continuação da [#83](https://github.com/SecreTavin/A3-banco-de-dados/issues/83),
para testar na reserva antes da banca.

## Prompt utilizado

> Vamos subir essas mudanças para que rode aqui no backup "cloudflare" pois estou
> testando o sistema para a apresentação. Não precisa mudar o bloqueio do banco,
> apenas coloque para que quem seja o desafiado, na tela de votação veja o status
> atual da aposta e os comentários.

## O que a IA produziu

* **API:** `GET /api/validacao/minhas-provas`, com as provas que o usuário enviou e
  que estão em votação: placar, quórum, prazo e o voto e a justificativa de cada
  jurado. Quem enviou nunca é jurado da própria prova (RN14), então a RN29 não
  esconde nada aqui.
* **Tela:** a seção **Suas provas no júri** na aba Votação, com o placar ao vivo e
  o aviso de que o desafiado acompanha, mas não vota.
* **Componente:** a lista de votos virou `VotosDoJuri`, usada pela tela do desafio e
  pela aba Votação.
* **Bloqueio mantido:** o banco e a RN29 continuam como estavam.

## O que a IA errou

Nenhum erro identificado nesta alteração. Uma variável saiu com o nome
`recarregarTudo`, mas só recarregava as provas do desafiado. Foi renomeada para
`recarregarMinhas` antes do commit.

## Como o time validou

* `dotnet test`: 176 de 176, com 2 novos (I14). Um deles confere a prova do
  desafiado com o comentário; o outro, que ela não aparece para os outros nem depois
  de a votação fechar.
* Conferido num ambiente isolado:
  * a API devolve a prova ao desafiado e nada ao jurado;
  * a aba Votação mostra o placar, o prazo e o comentário do Rafael.
* O roteiro de tela completo não rodou, porque o Google Chrome não está instalado
  neste computador.

## Decisão final

Entra na mesma PR da [#83](https://github.com/SecreTavin/A3-banco-de-dados/pull/84),
como um commit separado.
