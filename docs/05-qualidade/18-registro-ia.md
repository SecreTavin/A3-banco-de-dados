# 18 - Registro de Programação Assistida por IA

Registro obrigatório da disciplina. Documenta onde a IA foi usada, o que ela
errou e como o time validou a saída.

## Como o registro funciona

Cada alteração assistida por IA gera **um arquivo próprio** em
[registro-ia/](registro-ia/), nomeado `AAAA-MM-DD-descricao-curta.md` e baseado
no [modelo](registro-ia/0000-modelo.md).

A escolha por um arquivo por alteração — em vez de uma tabela única neste
documento — é deliberada: três desenvolvedores trabalhando em paralelo num
monorepo gerariam conflito de merge em toda semana se editassem a mesma tabela.
Arquivos separados nunca conflitam, e a consolidação final é uma concatenação.

A obrigação está registrada no [`CLAUDE.md`](../../CLAUDE.md) da raiz, que é
carregado automaticamente por toda sessão de IA no repositório. Sem isso a
prática dependeria de alguém lembrar.

## O que cada registro precisa conter

O campo que dá valor ao documento é **o que a IA errou**. A disciplina não
avalia o uso da ferramenta, avalia o discernimento de quem a usou — "usamos IA e
validamos assim" é substancialmente diferente de "usamos IA".

Além disso, commits assistidos carregam o trailer `Co-Authored-By:`, o que dá um
rastro mecânico independente destes documentos.

## Registros

| Data | Alteração | Responsável |
| --- | --- | --- |
| 2026-09-03 | [Reorganização da documentação e decisões de arquitetura](registro-ia/2026-09-03-arquitetura-e-reorganizacao.md) | Arthur Marzano |

## Consolidação final

Para o relatório de entrega, os registros são concatenados em ordem cronológica.
Este documento passa a ser a introdução da seção; os arquivos individuais, o
corpo.
