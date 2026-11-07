# 2026-11-07 — Conclusão e referências da Banca Final

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-07 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/06-encerramento/20-conclusao.md`, `docs/06-encerramento/21-referencias.md` |

## O que foi pedido

Escrever a conclusão do projeto e reunir em ABNT as referências usadas, os dois
itens que faltavam para a Banca Final.

## Prompt utilizado

> vamos após todas as outras tarefas, fazer a conclusão e puxar as referências utilizadas no projeto.

## O que a IA produziu

* **Conclusão:**
  * tabela que liga cada objetivo do documento 05 ao que o sistema faz e ao
    teste ou consulta que comprova;
  * resumo do que está garantido no banco;
  * quatro aprendizados;
  * o que fica para depois, com link para o documento 19.
* **Referências:** 21 entradas em ordem alfabética:
  * as 14 da página de jogos online, já em ABNT;
  * 7 fontes técnicas citadas no documento 13 e nos ADRs (Aiven, Microsoft
    Learn e WebKit), formatadas a partir dos links.

## O que a IA errou

* **Afirmações sem lastro no primeiro rascunho da conclusão.**
  * Um aprendizado dizia que "o banco recusou a gravação quando a tela ou a API
    erraram durante o desenvolvimento". Nenhum registro ou teste documenta esse
    episódio, e a frase virou a descrição do mecanismo.
  * Outro dizia que os roteiros revelaram uma "falha de contabilidade". Isso
    também não está documentado e saiu; ficou só a dependência de dados do U11,
    que está no documento 17.
  * "Views vazias em todas as execuções" virou "nos roteiros de ponta a ponta
    (E18 e U08)".
* **Contagem errada na conversa.** Ao anunciar o trabalho, a IA falou em 8
  fontes técnicas; a busca achou 7. O documento traz o número certo, contado
  pelo script que montou a lista.

## Como o time validou

* **Fontes técnicas:** título, autor e data de cada uma foram conferidos
  abrindo a página em 07/11/2026. Dois exemplos: o artigo do WebKit é de Brady
  Eidson e Jen Simmons, de 16 fev. 2023; as páginas do Microsoft Learn trazem a
  data de atualização no metadado `ms.date`.
* **Lista de referências:** foi tirada da busca de todos os links externos em
  `docs/`, então só entra o que a documentação cita.
* **Conclusão:** cada linha da tabela de objetivos aponta um cenário ou uma
  consulta que existe no documento 17 ou no 16.
* **Entregas:** o gerador foi rodado com `--check`.

## Decisão final

Entram a conclusão e as referências. Falta, para o PO decidir, a referência ao
próprio edital e ao plano de ensino da UC. O repositório cita o edital, mas não
traz o título nem a data, e a IA não inventa esses dados.
