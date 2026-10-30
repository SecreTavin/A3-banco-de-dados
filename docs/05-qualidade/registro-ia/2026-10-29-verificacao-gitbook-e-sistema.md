# 2026-10-29 — Verificação do GitBook e do sistema funcionando

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-29 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `SUMMARY.md`, `docs/05-qualidade/18-registro-ia.md`, `docs/05-qualidade/17-testes.md`, `scripts/testes/roteiro-e2e.py` |

## O que foi pedido

Depois do merge das PRs #3 e #32, garantir que a documentação segue o padrão
do GitBook e que as entregas estão efetivas e funcionando conforme a
especificação.

## O que a IA produziu

* **Conferência do GitBook por script:** todo link do `SUMMARY.md` aponta para
  arquivo existente; nenhum link relativo quebrado nos documentos; varredura de
  vocabulário antigo ("aposta", contagens do modelo antigo, RN29, ngrok) sem
  ocorrência fora de títulos históricos.
* **Correção encontrada:** 24 dos 27 registros de IA não estavam no
  `SUMMARY.md` (portanto fora do menu do GitBook) e o documento 18 listava só 3.
  O índice e a tabela foram gerados a partir dos próprios arquivos, agora com a
  ferramenta usada em cada registro, como pede a seção 13 do edital.
* **Teste de ponta a ponta:** sistema completo no ar (`docker compose`), 18
  cenários pela API real com o efeito conferido no banco, e as telas principais
  conferidas no navegador. Documentado como nível 5 no 17; roteiro salvo em
  `scripts/testes/roteiro-e2e.py`.

## O que a IA errou

* A primeira varredura de termos antigos não rodou: o shell (zsh) não separa
  uma variável com a lista de arquivos em palavras, e o `grep` recebeu um nome
  só. A IA percebeu pela saída sem sentido e refez a varredura em Python.
* O roteiro de teste nasceu apontando para o contêiner do ambiente de
  verificação (`a3verif-db-1`). Antes de salvar no repositório, o nome passou a
  vir de variável de ambiente, com o padrão do `docker compose` do projeto
  (`euduvido-db-1`).

## Como o time validou

* O roteiro salvo no repositório foi executado de novo, num banco recém-criado:
  18 de 18 aprovados.
* Na interface, a criação de desafio sem a chave da Groq mostrou o motivo do
  bloqueio e nada foi gravado; a tela de grupo mostrou o nível de filtro, a
  gestão de membros e os saldos que os testes da API produziram.

## Decisão final

Entram o índice completo dos registros de IA, a tabela do 18 com a ferramenta
de cada registro e o nível 5 de testes com o roteiro reproduzível.
