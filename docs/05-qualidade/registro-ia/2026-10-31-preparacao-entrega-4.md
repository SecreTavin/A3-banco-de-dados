# 2026-10-31 — Preparação da Entrega 4: telas reais, IA com chave real e lacunas do edital

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-31 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | Telas 22–29 e `docs/04-ux/README.md`, `scripts/telas/capturar-telas.mjs`, documentos 16, 17, 18 e 19, modelo de registro de IA, três registros anteriores do PO, `manifest.json` |

## O que foi pedido

Seguir para a Entrega 4 (Sistema Funcional, revisão em 20/11). Antes, o PO
pediu para subir o sistema atualizado no Docker e ver a moderação por IA
funcionando com a chave real da Groq, para mostrar ao professor.

## Prompt utilizado

> confira se as mudanças subiram para o docker, para que eu possa mostrar como está o sistema ao professor.

> preciso apresentar o modelo funcionando, então preciso da IA.

> coloquei a chave no .env, pode testar.

> podemos prosseguir com as próxima etapa de entrega

## O que a IA produziu

* **Diagnóstico do ambiente.** O Docker local rodava imagens e banco de 05/09,
  ainda no modelo antigo (schemas `apostas`, `identidade`…). O sistema foi
  reconstruído a partir da `main` e conferido: 10 tabelas no `public`, seed
  completo, views de contabilidade vazias.
* **Primeira execução com a IA real.** O modo `EUDUVIDO_IA_REAL=1` do roteiro
  do nível 5c, registrado como "não executado", rodou com 5 de 5 aprovados. Além
  dele, uma sondagem dos três níveis de filtro, com o resultado no documento 17.
* **Auditoria contra o edital** (seção 20, Entrega 4), lendo o conteúdo dos
  documentos em vez de só a existência deles, como o gerador faz. Lacunas
  encontradas:
  * as telas 22–29 não tinham nenhuma imagem do sistema real;
  * o documento 16 não dizia como configurar a chave da IA, sem a qual criar
    desafio falha;
  * o documento 17 dizia que o modo com IA real não tinha sido executado;
  * o modelo de registro de IA não tinha o campo *prompt*, exigido pelo edital
    (seções 6 e 13);
  * o README de UX ainda dizia que as tabelas são qualificadas por schema.
* **Script de captura** (`capturar-telas.mjs`), no mesmo padrão do roteiro de
  testes, e dez capturas das telas reais.
* **Seção "Como ficou implementada"** em cada tela, com a imagem e a
  comparação entre especificado e implementado.
* **Manifesto da Entrega 4** passando a conferir conteúdo.

## O que a IA errou

* **Afirmou um passo que ainda não tinha acontecido.** Na primeira conferência,
  a IA disse que, depois do merge da PR #33, ainda faltava criar a Entrega 3.
  Ao buscar o remoto, viu que as PRs #40–#42 e a tag `entrega-3` já existiam.
  O plano foi corrigido antes de qualquer ação.
* **Leu "Docker atualizado" pelo estado dos contêineres.** Os contêineres
  estavam `Up` havia um minuto, o que parecia uma subida recente. A data das
  imagens e a consulta ao catálogo do banco mostraram que era o sistema de
  setembro. Status de contêiner não serve como prova de versão.
* **Esperou que o nível `PESADO` recusasse a pimenta.** O primeiro teste de
  nível usou *comer 3 pimentas*, que o próprio seed trata como recusada no
  `PESADO`. O modelo real aprovou. Em vez de concluir que os níveis não
  funcionavam, a IA leu o prompt de cada nível e testou mais duas propostas. A
  foto de pijama separou os níveis; a pimenta foi registrada como limitação.
* **Quase documentou as telas pela especificação.** O rascunho da tela 25
  repetia "seleção de participantes na criação". Ao conferir o código
  (`CriarDesafio` não grava participante; o aceite fica no detalhe), a linha
  virou divergência documentada. Pelo mesmo caminho saíram as divergências das
  telas 23, 28 e 29.

## Como o time validou

* Cada captura foi aberta e conferida contra o seed: o desafio 1 em votação com
  1 de 2 votos, a Lari com o voto pendente, saldos e extrato do Tavin.
* As divergências de tela foram confirmadas no código do frontend
  (`DetalheDesafioView`, `DetalheGrupoView`, `RankingView`, `PerfilView`) e da
  API, não pela memória da especificação.
* O manifesto novo foi testado nos dois sentidos: 10/10 na branch, e 7/10 com o
  mesmo manifesto aplicado à `main` anterior (reprova capturas, documento 16 e
  documento 17).
* Os prompts dos três registros anteriores do PO foram copiados do histórico da
  sessão, não reescritos.
* Depois das capturas e dos testes, o banco foi recriado do zero
  (`docker compose down -v`), e o voto da demonstração voltou a ficar pendente.

## Decisão final

Entram as capturas, o script, as seções de tela, os documentos 16, 17, 18 e 19
atualizados, o campo *Prompt utilizado* no modelo e o manifesto. Fica de fora
qualquer mudança de código: as mensagens da API sem acento e a sobreposição de
selos na lista de desafios foram registradas como limitação no documento 19,
para não mexer no sistema três semanas antes da banca sem necessidade. Os
prompts dos registros de outros autores ficam como pendência deles.
