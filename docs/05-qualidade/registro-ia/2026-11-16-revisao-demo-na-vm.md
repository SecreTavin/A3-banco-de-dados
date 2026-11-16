# 2026-11-16 — Revisão do PO da publicação na VM da Oracle (PR #66)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-16 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | ADR 0020 (decisores e seção "Revisão do PO"), documento 16 (seção "Ambiente público"), documento 18 (linhas e contagem), `SUMMARY.md` |

## O que foi pedido

Revisar a PR #66 do Rafael, que documenta o sistema publicado numa VM da Oracle,
comparar com a issue #65 e preparar o merge com a documentação completa.

## Prompt utilizado

> O Rafael subiu o PR com o que foi feito "Subiu o projeto completo na Vm Oracle", confira o PR analise o que foi entregue para realizarmos o Merge e documentar tudo.

Decisões do PO, respondidas a perguntas da IA:

> Endereço: falveshub + redirect. Banco: recriar do seed. Versão: revisar a #63 e a VM na `main`.

## O que a IA produziu

* **Conferência do site público** em `https://euduvido.falveshub.com`:
  * página e repasse de `/api` e `/hubs` funcionando (negociação do SignalR respondeu 200);
  * `/health` e `/swagger` não ficam expostos;
  * login de desenvolvimento aberto, como já previsto.
* **Comparação com a issue #65.** Três desvios foram levados ao PO como decisão:
  * o endereço é do Rafael, e não o com o nome do PO;
  * o banco é uma cópia do ambiente de desenvolvimento, e não o seed;
  * a VM roda uma branch não mesclada (#63).
* **ADR 0020:** passou a registrar as decisões do PO, com uma tabela do que
  ainda está pendente na VM. A frase que dizia que o ADR 0010 "continua como a
  hospedagem prevista" foi trocada, porque contradizia a PR #57.
* **Documento 16:** a seção "Ambiente público" ficou alinhada às decisões.
* **Documento 18:** entrou a linha do registro do Rafael, que faltava, e a
  contagem foi corrigida. Ela já estava errada na `main`: dizia 43 com 44
  linhas.

## O que a IA errou

* **Primeira leitura do banco incompleta.** A IA comparou só a contagem de
  usuários com o seed. Ao conferir pela API o desafio "Correr 5km", achou que
  ele estava com 0 de 2 votos, e não 1 de 2 como no seed. É essa diferença que
  quebra o roteiro da demonstração, e ela virou o motivo da decisão de recriar
  do seed.
* **Colisão de numeração não prevista.** O ADR 0020 da especificação do login
  com Google (PR #61) foi criado sem considerar que outra PR poderia usar o
  mesmo número. Como a #66 entra antes, o ADR do login passa a ser o 0021.

## Como o time validou

* **Site público:** respostas conferidas com `curl` no endereço público. A
  contagem de usuários e o estado da votação foram lidos pela API com o login
  de desenvolvimento, só leitura e sem voto.
* **Documento 18:** cada arquivo de `registro-ia/` foi comparado com a tabela,
  por script.
* **Decisões:** as três foram do PO, por escolha explícita entre alternativas.

## Decisão final

A PR #66 entra com o ADR 0020 ajustado às decisões do PO. O que falta na VM fica
na issue #65:

* recriar o banco do seed;
* passar a VM para a `main`;
* fazer o redirect do Worker;
* versionar o override e o nginx;
* backup.
