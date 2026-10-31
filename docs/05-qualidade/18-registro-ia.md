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

Cada registro identifica a ferramenta, o objetivo (o que foi pedido), o
resultado, o que precisou ser corrigido e como a saída foi validada — os campos
que a seção 13 do edital pede. A tabela abaixo é o índice; o detalhe está em
cada arquivo.

## Registros

38 registros, em ordem cronológica.

| Data | Alteração | Ferramenta | Responsável |
| --- | --- | --- | --- |
| 2026-09-03 | [Reorganização da documentação e decisões de arquitetura](registro-ia/2026-09-03-arquitetura-e-reorganizacao.md) | Claude Code (Opus) | Arthur Marzano |
| 2026-09-03 | [Frontend React: telas de apostas, votação, ranking e perfil](registro-ia/2026-09-03-frontend-react-telas.md) | Claude Code (Opus) | Arthur Marzano |
| 2026-09-03 | [Implementação da API, do banco e da infraestrutura](registro-ia/2026-09-03-implementacao-api-e-banco.md) | Claude Code (Opus) | Arthur Marzano |
| 2026-09-09 | [Bug de ordem no workflow de release da entrega-1](registro-ia/2026-09-09-bug-workflow-tag-entrega.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-09 | [Fecha pendências da Entrega 1](registro-ia/2026-09-09-fecha-entrega-1.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-09 | [Configuração de sync do GitBook](registro-ia/2026-09-09-integracao-gitbook.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-10 | [Resolve ambiguidade de data no Anexo 1 (ficha de inscrição)](registro-ia/2026-09-10-resolve-data-feriado-entrega-4.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-11 | [Corrige número de integrantes (eram 5, não 3)](registro-ia/2026-09-11-corrige-numero-de-integrantes.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-11 | [Registra distribuição de responsabilidades](registro-ia/2026-09-11-distribuicao-de-responsabilidades.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-11 | [Fortalece contexto e justificativa contra o guia RT01](registro-ia/2026-09-11-fortalece-contexto-e-justificativa.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-11 | [Resposta síntese no formato pedido pelo RT01](registro-ia/2026-09-11-resposta-sintese-rt01.md) | Claude Code (Sonnet 5) | Rafael Alves |
| 2026-09-12 | [ADR de idade mínima e moderação de desafios por IA](registro-ia/2026-09-12-adr-idade-minima-moderacao-ia.md) | Claude Code (Sonnet 5) | Octávio Arruda |
| 2026-10-02 | [Atualiza plano de trabalho (E2)](registro-ia/2026-10-02-atualiza-plano-trabalho.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Corrige contagem de tabelas nos docs de modelagem e DDL](registro-ia/2026-10-02-corrige-contagem-tabelas.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [DER com chaves (PK, FK, UK) e júri validando o desafio](registro-ia/2026-10-02-der-com-chaves-e-juri.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Front: tema claro e escuro, fontes maiores, sem rolagem vertical](registro-ia/2026-10-02-front-tema-claro-escuro.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Regenera status da Entrega 2](registro-ia/2026-10-02-gera-status-entrega-2.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Justificativa apoiada em lazer, descontração e diversão](registro-ia/2026-10-02-justificativa-lazer.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Modelagem de dados da moderação por IA (ADR 0015)](registro-ia/2026-10-02-modelagem-moderacao-ia.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Modelo simplificado (10 tabelas, schema único)](registro-ia/2026-10-02-modelo-simplificado.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Objetivo geral descreve o que o sistema é](registro-ia/2026-10-02-objetivo-geral.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Objetivos específicos focados em diversão; parte técnica movida por link](registro-ia/2026-10-02-objetivos-especificos.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Plano de trabalho com responsável por semana e visão por integrante](registro-ia/2026-10-02-plano-trabalho-por-integrante.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Público-alvo na introdução e no documento 06](registro-ia/2026-10-02-publico-alvo.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-02 | [Renomeia "aposta" para "desafio" (docs, banco, API e front)](registro-ia/2026-10-02-renomeia-aposta-para-desafio.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-06 | [Integra o modelo v3 à main com os nomes de "desafio" (issue #30)](registro-ia/2026-10-06-integra-modelo-v3-desafio.md) | Claude Code | Arthur Marzano |
| 2026-10-29 | [Fechamento da Entrega 3: seed, consultas, documentos e CI](registro-ia/2026-10-29-fechamento-entrega-3.md) | Claude Code (Opus 5.5) | Octávio Arruda |
| 2026-10-29 | [Verificação do GitBook e do sistema funcionando](registro-ia/2026-10-29-verificacao-gitbook-e-sistema.md) | Claude Code (Opus 5.5) | Octávio Arruda |
| 2026-10-30 | [Correções de responsividade, legibilidade e toque no front](registro-ia/2026-10-30-correcoes-ux-responsividade.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Redesign desktop: sem rolagem de página, textos maiores, menos margem lateral](registro-ia/2026-10-30-redesign-desktop.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Troca da imagem do MinIO e subida do compose do zero](registro-ia/2026-10-30-troca-imagem-minio.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Atualiza o plano de trabalho para o fechamento da Entrega 3](registro-ia/2026-10-30-atualiza-plano-entrega-3.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Registro dos testes de aceitação do protótipo](registro-ia/2026-10-30-registro-testes-de-aceitacao.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [E2E de tela dos fluxos principais](registro-ia/2026-10-30-e2e-de-tela.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Documenta que o upload direto de evidência não foi implementado](registro-ia/2026-10-30-upload-de-evidencia-nao-implementado.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [E2E de criar desafio com a IA simulada](registro-ia/2026-10-30-e2e-ia-simulada.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Regenera o status da Entrega 3](registro-ia/2026-10-30-gera-status-entrega-3.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-31 | [Jogos online no Brasil em números](registro-ia/2026-10-31-jogos-online-em-numeros.md) | Claude Code (Opus 5.5) | Octávio Arruda |

## Consolidação final

Para o relatório de entrega, os registros são concatenados em ordem cronológica.
Este documento passa a ser a introdução da seção; os arquivos individuais, o
corpo.
