# 2026-11-20 — Ajustes pedidos na revisão do professor (31/10)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | Documentos 05, 07, 17, 18 e 26, roteiro da demonstração; fonte em `rem` e botão **A+** (`apps/web`); foto da prova pelo MinIO (`apps/api`, `apps/web`, `docker-compose.yml`); ADR 0022 (substitui o 0009); RF06, RN22, documentos 13, 15, 16, 19 e `tecnologias.md` |

## O que foi pedido

Ler a transcrição da revisão de 31/10 com o professor, listar o que faltava e
corrigir num PR. Depois o Rafael escolheu como fazer dois itens: a fonte maior
vira um botão "A+", e a foto da prova passa a ser enviada pelo aparelho.

## Prompt utilizado

> baixei a transcrição da ultima apresentação que tivemos com ele, veja depois que terminar e me diga quais pontos faltam...

> animação irá sair do app final, pode criar um pr removendo ela do inicio e apos isso iniciar aquelas correções que passamos após análise das transcrições, essas correções irão subir em um pr, a animação fora ira entrar em outro pr

Nas escolhas, o Rafael marcou **"Botão 'A+'"** para a fonte e **"Implementar
envio de foto"** para a prova.

## O que a IA produziu

| Pedido do professor | O que entrou |
| --- | --- |
| Objetivo começando com "O Eu Duvido! é um protótipo funcional…", para o campo "Sobre" da vitrine | Documento 05 reescrito. Também corrigiu "gerenciamento de desafios, desafios e votações", que repetia uma palavra |
| Plano de trabalho num único slide (set. a nov.) | Seção "Visão em uma tela" no documento 07: atividades × meses, com responsáveis tirados de commits, PRs e registros. As semanas de novembro saíram de "Planejado" com o que o Git mostra |
| Relatório de uso de IA resumido, sem detalhe técnico, mencionando a IA dentro do app | "Resumo para a banca" no documento 18: ferramentas, a moderação pela Groq, o que deu certo, quatro padrões de erro com exemplos dos registros e como o time controlou |
| Roteiro de CRUD com inclusão, alteração e **exclusão** | Passo 3 do roteiro: a Aninha entra e é removida (`remover_membro`, `SAIDA_GRUPO` e `DELETE`). O júri do passo 6 e o ranking do passo 8 foram ajustados |
| Fonte uns 20% maior para o datashow, sem mexer na versão original | 214 `font-size` passaram de `px` para `rem`. O botão **A+**, ao lado do tema, põe `font-size: 120%` na raiz e fica salvo no navegador. O app normal não muda |
| Foto da prova aparecendo | `POST /api/midia` e `GET /api/midia/{nome}`, com login. O tipo é conferido pelos primeiros bytes, o limite é 8 MB e o arquivo vai para o MinIO. A foto é reduzida no navegador, e o júri a vê com o token. ADR 0022 substitui o 0009, e o bucket ficou privado |

O pedido do card em JPEG não entrou: a orientação mais nova do professor
(20/11) pede PNG 900x1200, e o card já segue essa.

## O que a IA errou

* **Mediu a abertura em vez do app.** A primeira rodada de capturas da fonte
  maior deu "nada cortado" em todas as telas. As imagens mostravam a abertura
  animada, que esta branch ainda tem. A IA só viu ao abrir as capturas, e
  refez a medição passando pela abertura.
* **Afirmação sem lastro no resumo de IA.** O primeiro texto dizia que os
  roteiros de ponta a ponta acharam o CP preso no escrow. O registro de 03/09
  mostra que quem achou foi a conferência dos saldos contra uma simulação. O
  texto foi corrigido antes do commit.
* **Helper usado errado no U15.** A IA tratou `precisa()` como se devolvesse o
  valor, e o cenário abriu `/desafios/undefined`. A captura de falha mostrou
  "Desafio não encontrado".
* **Bucket com leitura anônima.** O `storage-init` liberava download anônimo,
  e a porta 9000 fica exposta localmente. Isso contrariava o ADR que a própria
  IA tinha escrito. Virou `mc anonymous set none`, e o acesso direto passou a
  responder 403.

## Como o time validou

* `dotnet test`: **170 de 170**, com 8 testes novos da foto.
* Roteiros num banco recém-criado, com a API sem chave da IA:
  * API: **18 de 18**;
  * tela: **14 de 15**, com o U15 novo aprovado; o U11 falha pela rolagem do
    redesign, como antes deste PR;
  * IA simulada: **14 de 14**.
* A API foi conferida com `curl`:
  * sem login, 401;
  * texto com nome `.png`, 400;
  * 9 MB, 400;
  * nome com `../`, 404;
  * bytes lidos iguais aos enviados.
* A fonte foi medida em 1440x900, 800x600 e 390x844: o texto cresce 20%, sem
  rolagem horizontal. As capturas foram conferidas também na moldura (menu
  lateral, topo e barra inferior).

## Decisão final

Tudo entra num PR só, separado da remoção da abertura. Ficam com o time:

* o U11;
* os prompts literais que faltam em 14 registros antigos;
* o sexto integrante citado na revisão (a documentação lista cinco);
* o tempo da demonstração: 13:30 no roteiro, contra os 35 a 40 minutos que o
  professor reservou.
