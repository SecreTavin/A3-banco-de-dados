# 2026-11-22 — SQL ao vivo sem e-mails no projetor

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-22 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/demo/ver-sql.py`, documento 16 e roteiro da demonstração |

## O que foi pedido

Esconder os e-mails no SQL ao vivo, porque a demonstração agora usa as contas
Google reais dos integrantes e a janela vai para o projetor.

## Prompt utilizado

> pode mesclar a #76 quando o CI passar e mascarar os e-mails para a apresentação

## O que a IA produziu

A função `mascarar`, que troca todo e-mail por `***@***` nos comandos e nos erros
exibidos. Ela roda antes do corte de tamanho da linha, para um e-mail cortado não
escapar, e preserva os operadores `@>` e `<@` do PostgreSQL.

## O que a IA errou

A versão de 20/11, também feita com IA, preenchia os parâmetros sem considerar dados
pessoais. Com o seed fictício isso não aparecia como problema; com contas reais, os
e-mails iriam para o projetor. Na máscara em si, nenhum erro foi identificado.

## Como o time validou

* Cinco casos diretos da função: e-mail comum, com `+`, com aspas escapadas, sem
  aspas e operadores `@>` e `<@`.
* Execução real num ambiente isolado, com o `ver-sql.py` ligado durante um cadastro,
  uma inclusão de membro e uma busca por e-mail inexistente: **0 e-mails visíveis** e
  4 comandos mascarados, inclusive o `INSERT INTO usuario`.
* Ao sair, o log do banco voltou a `log_statement = none`.

## Decisão final

A máscara vale só para a saída do `ver-sql.py`. O log do PostgreSQL mantém o valor
original, e a tela do site continua mostrando o e-mail digitado no passo 3 e o do
Perfil. O roteiro da demonstração registra esses dois pontos.
