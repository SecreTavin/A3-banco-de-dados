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

## Resumo para a banca

Relatório sumarizado do uso de IA, como o professor pediu na revisão de
31/10/2026: o que usamos, para quê, o que deu certo e o que não deu. O detalhe de
cada uso está nos registros listados mais abaixo.

### Ferramentas

| Onde | Ferramenta | Para quê |
| --- | --- | --- |
| No desenvolvimento | **Claude Code** (Anthropic), com os modelos Sonnet, Opus e Fable | Todos os registros desta seção |
| **Dentro do app** | Modelo aberto `gpt-oss-120b`, hospedado na **Groq** | Moderação dos desafios antes de entrarem no grupo ([ADR 0015](../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md)) |

**O agente de IA dentro do app.** Toda proposta de desafio passa pela IA antes
de ser criada. O admin do grupo escolhe o nível do filtro (leve, moderado ou
pesado), e a IA aprova ou recusa com um motivo. Toda decisão fica gravada no
banco, na tabela `moderacao_desafio` (RN28). Sem IA disponível, o desafio não é
criado. Na revisão de 31/10, no nível pesado, a IA barrou "correr 15 km em uma
hora" e deixou passar "correr 15 km em uma semana".

### Para que a IA serviu no desenvolvimento

| Uso | Exemplos |
| --- | --- |
| Código | API, banco (procedures, triggers, views), telas em React |
| Testes e depuração | Roteiros de ponta a ponta pela API, pela tela e pela moderação; análise de falhas |
| Design | Seis propostas de redesign, o redesign mobile-first, o card da EXPOUNA |
| Documentação | GitBook, decisões de arquitetura (ADRs), plano de trabalho, justificativa com dados |
| Publicação | Docker, Cloudflare e a VM da demonstração |

### O que deu certo

* **Velocidade:** API, banco e telas saíram em dias, e o time pôde gastar o
  tempo na modelagem e nas regras de negócio.
* **Conferência dos números:** comparar os saldos do banco com o esperado achou
  60 CP presos no escrow por um erro no seed. Daí nasceu a view
  `vw_escrow_orfao`, que hoje vigia esse tipo de falha.
* **Ensaio antes da banca:** os roteiros de ponta a ponta e o ensaio da
  demonstração rodam o sistema inteiro num banco recém-criado. O ensaio achou,
  por exemplo, um erro 500 da API com datas em outro fuso horário.
* **Pesquisa com fontes:** os dados de "Jogos online no Brasil em números"
  vieram da IA, mas cada número foi conferido na fonte original antes de entrar.

### O que não deu certo

Os erros se repetiram em quatro padrões. Todos estão nos registros, com a
correção feita pelo time.

| Padrão | Exemplo |
| --- | --- |
| Afirmar sem conferir | Um número de acesso à internet que não estava na página do IBGE; dizer que a API usava o MinIO para guardar provas, quando ela recebe só um link |
| Mudança em massa sem revisar | Renomear "aposta" para "desafio" quebrou a gramática em vários textos ("o desafio já foi encerrada") |
| Recomendação de regra contrariada pelo time | A IA recomendou recusar a prova em caso de empate; o time manteve em votação, e estava certo (RN16) |
| Visual sem olhar a tela inteira | O menu lateral do desktop saiu cortado em todas as capturas; quem percebeu foi um integrante abrindo o app |

Ações arriscadas também foram barradas antes de causar dano: uma migration
gerada pelo EF que apagaria tabelas (reescrita com `RENAME`), a criação de uma
tag de entrega sem pedido e uma mudança no túnel da Cloudflare que derrubaria
outro projeto.

### Como o time controlou

* **Um registro por alteração**, sempre com a seção "o que a IA errou". A regra
  está no `CLAUDE.md`, que toda sessão de IA lê ao abrir o repositório.
* **Testes automáticos** rodando a cada PR, mais os roteiros de ponta a ponta
  num banco recém-criado.
* **Revisão de PR** por outro integrante antes de ir para a `main`.

## O que cada registro precisa conter

O campo que dá valor ao documento é **o que a IA errou**. A disciplina não
avalia o uso da ferramenta, avalia o discernimento de quem a usou — "usamos IA e
validamos assim" é substancialmente diferente de "usamos IA".

Cada registro identifica a ferramenta, o objetivo (o que foi pedido), o
**prompt utilizado**, o resultado, o que precisou ser corrigido e como a saída
foi validada — os campos que as seções 6 e 13 do edital pedem.

> **Pendência (31/10/2026).** O campo *Prompt utilizado* entrou no
> [modelo](registro-ia/0000-modelo.md) nesta data. Os registros anteriores
> descrevem o pedido em "O que foi pedido", mas a maioria não traz o prompt
> literal. Cada autor completa os seus com o comando que de fato usou — não
> se reconstrói prompt de memória. A tabela abaixo é o índice; o detalhe está em
cada arquivo.

## Registros

68 registros, em ordem cronológica.

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
| 2026-09-12 | [ADR de idade mínima e moderação de desafios por IA](registro-ia/2026-09-12-adr-idade-minima-moderacao-ia.md) | Claude Code (Sonnet 5) | Octávio Augusto Arruda dos Prazeres |
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
| 2026-10-29 | [Fechamento da Entrega 3: seed, consultas, documentos e CI](registro-ia/2026-10-29-fechamento-entrega-3.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-29 | [Verificação do GitBook e do sistema funcionando](registro-ia/2026-10-29-verificacao-gitbook-e-sistema.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-30 | [Correções de responsividade, legibilidade e toque no front](registro-ia/2026-10-30-correcoes-ux-responsividade.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Redesign desktop: sem rolagem de página, textos maiores, menos margem lateral](registro-ia/2026-10-30-redesign-desktop.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Troca da imagem do MinIO e subida do compose do zero](registro-ia/2026-10-30-troca-imagem-minio.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Atualiza o plano de trabalho para o fechamento da Entrega 3](registro-ia/2026-10-30-atualiza-plano-entrega-3.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Registro dos testes de aceitação do protótipo](registro-ia/2026-10-30-registro-testes-de-aceitacao.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [E2E de tela dos fluxos principais](registro-ia/2026-10-30-e2e-de-tela.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Documenta que o upload direto de evidência não foi implementado](registro-ia/2026-10-30-upload-de-evidencia-nao-implementado.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [E2E de criar desafio com a IA simulada](registro-ia/2026-10-30-e2e-ia-simulada.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-30 | [Regenera o status da Entrega 3](registro-ia/2026-10-30-gera-status-entrega-3.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-11-09 | [Preenche o prompt utilizado nos registros de Rafael](registro-ia/2026-11-09-preenche-prompt-utilizado.md) | Claude Code (Sonnet 5.5) | Rafael Alves |
| 2026-10-31 | [Preparação da Entrega 4: telas reais, IA com chave real e lacunas do edital](registro-ia/2026-10-31-preparacao-entrega-4.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-31 | [Redesign de UI/UX: seis propostas, da prancha ao código](registro-ia/2026-10-31-redesign-ux.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-31 | [Tela inicial: abertura animada com o monge e o nerd](registro-ia/2026-10-31-tela-inicial-abertura.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-31 | [Jogos online no Brasil em números](registro-ia/2026-10-31-jogos-online-em-numeros.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-10-31 | [Publicação na Cloudflare com a API por túnel](registro-ia/2026-10-31-publicacao-cloudflare.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-01 | [Abertura em 3D estilo PS1, com plateia de colégio](registro-ia/2026-11-01-abertura-3d-ps1.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-07 | [Conclusão e referências da Banca Final](registro-ia/2026-11-07-conclusao-e-referencias.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-07 | [ADR 0010 com a hospedagem que existe de fato](registro-ia/2026-11-07-adr-0010-hospedagem-real.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-07 | [Especificação do login com Google](registro-ia/2026-11-07-especificacao-login-google.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-10 | [Redesign mobile-first com tema claro padrão](registro-ia/2026-11-10-redesign-mobile-first.md) | Claude Code (Fable 5.1) | Rafael Alves |
| 2026-11-10 | [Ajustes nas resoluções mais usadas e medição de rolagem](registro-ia/2026-11-10-ajustes-resolucoes.md) | Claude Code (Fable 5.1) | Rafael Alves |
| 2026-11-16 | [Demonstração pública na VM da Oracle](registro-ia/2026-11-16-demo-na-vm-oracle.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-16 | [Revisão do PO da publicação na VM da Oracle](registro-ia/2026-11-16-revisao-demo-na-vm.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-16 | [Roteiro da demonstração da Banca Final](registro-ia/2026-11-16-roteiro-da-demonstracao.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-20 | [Banco da demonstração e SQL ao vivo](registro-ia/2026-11-20-banco-da-demo-e-sql-ao-vivo.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-20 | [Slides na ordem do edital e referência do edital](registro-ia/2026-11-20-slides-do-edital-e-referencias.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-20 | [Nome completo do PO e card da EXPOUNA](registro-ia/2026-11-20-nome-completo-e-card-expouna.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-20 | [Login com Google](registro-ia/2026-11-20-login-com-google.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-20 | [Login com Google no visual do redesign](registro-ia/2026-11-20-login-google-no-redesign.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-20 | [Abertura animada removida do app](registro-ia/2026-11-20-remove-abertura.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-20 | [Ajustes pedidos na revisão do professor (31/10)](registro-ia/2026-11-20-ajustes-revisao-do-professor.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-20 | [Produção com o banco limpo](registro-ia/2026-11-20-producao-com-banco-limpo.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-20 | [Regenera o status da Entrega 4](registro-ia/2026-11-20-gera-status-entrega-4.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-20 | [Rascunho do vídeo de demonstração em Remotion](registro-ia/2026-11-20-video-de-demonstracao.md) | Claude Code (Opus 5.5) | Rafael Alves |
| 2026-11-22 | [Demonstração e documentação só com os integrantes](registro-ia/2026-11-22-demo-com-os-integrantes.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-22 | [SQL ao vivo sem e-mails no projetor](registro-ia/2026-11-22-sql-ao-vivo-sem-emails.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-22 | [Roteiro da apresentação dos slides](registro-ia/2026-11-22-roteiro-dos-slides.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-24 | [Vídeo de demonstração com os integrantes e render 3x mais rápido](registro-ia/2026-11-24-video-com-os-integrantes.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-24 | [Narração sintética do vídeo de demonstração](registro-ia/2026-11-24-narracao-sintetica-do-video.md) | Claude Code (Opus 5.5) e voz Luciana (macOS) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-24 | [Vídeo na abertura da banca](registro-ia/2026-11-24-video-na-abertura-da-banca.md) | Claude Code (Opus 5.5) | Octávio Augusto Arruda dos Prazeres |
| 2026-11-25 | [Busca dos prompts dos registros de setembro e outubro](registro-ia/2026-11-25-busca-dos-prompts-antigos.md) | Claude Code (Opus 5.5) | Arthur Araujo Marzano |

## Consolidação final

Para o relatório de entrega, os registros são concatenados em ordem cronológica.
Este documento passa a ser a introdução da seção; os arquivos individuais, o
corpo.
