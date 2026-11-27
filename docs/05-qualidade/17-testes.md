# 17 - Casos de Teste e Validação

Cinco níveis de teste, com prioridade deliberada: **as constraints do banco vêm
primeiro**, porque são o que a disciplina avalia e o que é mais barato de
escrever ([ADR 0014](../02-arquitetura/adr/0014-estrategia-de-testes.md)). Os
níveis 1 a 4 são automatizados no código; o nível 5 testa o sistema no ar, de
ponta a ponta.

> **Situação em 2026-10-29 (modelo v3):** 147 casos implementados e
> **passando** — 19 de constraint, 108 de domínio e aplicação sem banco e 20 de
> integração contra PostgreSQL real via Testcontainers. O xUnit conta cada linha
> de `Theory` como um caso. Execução: `dotnet test` em `apps/api`; a coluna
> *Resultado obtido* registra a execução de 29/10/2026, e o CI repete a suíte a
> cada PR.

## Nível 1 — Constraints do banco

Cada caso tenta violar uma regra e espera que o **banco** recuse. Não é a
aplicação que protege; é o SGBD. Arquivo: `ConstraintTests.cs`.

| ID | Regra | Ação | Resultado esperado | Resultado obtido |
| --- | --- | --- | --- | --- |
| T01 | RN03 | `INSERT` em `desafio` com `status = 'INVENTADO'` | Violação de `chk_desafio_status` | Aprovado |
| T02 | RN27 | `nivel_filtro` fora de `LEVE`/`MODERADO`/`PESADO` | Violação de `chk_grupo_nivel_filtro` | Aprovado |
| T03 | RN07 | `INSERT` com `valor_cp = 0` | Violação de `chk_desafio_valor_cp` | Aprovado |
| T04 | RN04 | Segundo voto do mesmo jurado | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T05 | — | `INSERT` em `desafio` com `id_grupo` inexistente | Violação de FK `fk_desafio_grupo` | Aprovado |
| T06 | RN09 | Dois `DESAFIADO` no mesmo desafio | Violação de `unq_desafio_papel_unico` | Aprovado |
| T07 | RN14 | `DESAFIANTE` inserido no júri da própria evidência | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T08 | RN08 | Débito que deixaria `saldo_cp` negativo | Violação de `chk_membro_saldo` | Aprovado |
| T09 | RN24 | `UPDATE` em `transacao_cp` | Exceção do trigger `trg_transacao_cp_imutavel` | Aprovado |
| T10 | RN24 | `DELETE` em `transacao_cp` | Exceção do mesmo trigger | Aprovado |
| T11 | RN19 | Voto em evidência `ACEITA` | Exceção do trigger `trg_jurado_evidencia_valida` | Aprovado |
| T12 | RN15 | Voto preenchido sem `data_voto` | Violação de `chk_jurado_voto_data` | Aprovado |
| T13 | RN10 | Sexta evidência no mesmo desafio | Violação de `chk_evidencia_ordem` | Aprovado |
| T14 | RN26 | Usuário com menos de 16 anos | Exceção do trigger `trg_usuario_idade_minima` | Aprovado |
| T15 | RN12 | `status = 'CANCELADA'` sem motivo | Violação de `chk_desafio_cancelamento` | Aprovado |
| T16 | RN28 | Moderação reprovada sem motivo | Violação de `chk_moderacao_motivo` | Aprovado |
| T17 | RN28 | Moderação reprovada ligada a um desafio | Violação de `chk_moderacao_desafio` | Aprovado |
| T18 | RN25 | `remover_membro` de quem está em desafio em curso | Recusa da procedure (SQLSTATE `EUD01`) | Aprovado |
| T19 | RN24, RN25 | Saída do grupo e volta | `SAIDA_GRUPO` zera a conta; `vw_reconciliacao_saldo` vazia na volta | Aprovado |

## Nível 2 — Domínio e aplicação, sem banco

xUnit puro, rápido (menos de um segundo). Cobre o que é lógica de agregado,
validação de entrada e integração com a IA antes de qualquer persistência.
Arquivos em `Unidade/`.

| Arquivo | O que cobre |
| --- | --- |
| `DesafioTests` | Máquina de estados: `ABERTA` → `EM_ANDAMENTO` com os dois duelistas (RN21), papel único e `APOSTADOR` livre (RN09), só entra em `ABERTA`, cancelamento só do criador e com motivo (RN12), status terminais (RN03) |
| `GrupoAmigosTests` | Criador é `ADMIN` e filtro padrão `MODERADO`; só `ADMIN` adiciona membro e muda o nível (RN25, RN27); quem pode remover quem; único `ADMIN` não sai com outros membros |
| `UsuarioTests` | Idade mínima: 16 anos exatos passam, um dia a menos é recusado com HTTP 422 (RN26) |
| `EvidenciaTests` | Júri congelado sem voto e prazo de 7 dias (RN11, RN14); quórum `floor(n/2)+1` com 1 a 5 jurados (RN15); voto só de jurado, único e com data (RN04) |
| `ModeracaoDesafioTests` | Cópia do nível, motivo obrigatório na reprovação, corte em 500 caracteres, só aprovada se liga a desafio (RN27, RN28) |
| `ValidadoresTests` | `CriarDesafioValidator`, `EnviarEvidenciaValidator` e `RegistrarVotoValidator`: cada campo inválido barrado antes do handler |
| `ModeradorDesafioTests` | Prompt com a régua do nível do grupo, texto do usuário delimitado como dado, resposta sem decisão vira falha (nunca aprovação) |
| `ChatIaTests` | Cliente da Groq contra HTTP falso: rota `/chat/completions`, modelo e temperatura; sem configuração, erro HTTP, sem rede ou resposta fora do formato viram `IaIndisponivelException` (503) |
| `ResultExtensionsTests` | Erro de domínio → status HTTP (404, 400, 409, 403, 422) com o código do erro no título |
| `IaTests` | Extração tolerante do JSON da resposta e neutralização de marcas no texto do usuário |

## Nível 3 — Integração com PostgreSQL real

Testcontainers subindo PostgreSQL de verdade. Reservado ao que um bug deixaria
invisível e caro: a liquidação dentro do banco e a conversão de dados.

| ID | Cenário | Verificação | Resultado obtido |
| --- | --- | --- | --- |
| I01 | Ciclo completo: evidência → votos até quórum | Desafio `FINALIZADA_CUMPRIU`, CP transferido na mesma transação | Aprovado |
| I02 | **Reconciliação após o ciclo** | `vw_reconciliacao_saldo` e `vw_escrow_orfao` com **zero linhas** | Aprovado |
| I03 | Soma do ledger do grupo | Igual a `100 × membros + recompensas de voto` no cenário sem saída; no caso geral, saldos dos membros + CP retido (ADR 0018) | Aprovado |
| I04 | `apurar_votacao` chamada duas vezes | Segunda chamada não altera nada | Aprovado |
| I05 | Maioria `INVALIDO` | Evidência recusada sem encerrar o desafio na primeira | Aprovado |
| I06 | Três evidências recusadas | Desafio `FINALIZADA_PERDEU`, sem escrow órfão | Aprovado |
| I07 | Criar desafio com a IA aprovando | Desafio criado e linha em `moderacao_desafio` ligada a ele, com o nível do grupo copiado | Aprovado |
| I08 | Criar desafio com a IA reprovando | Nenhum desafio; linha em `moderacao_desafio` com `aprovado = false` e o motivo | Aprovado |
| I09 | Criar desafio com a IA fora do ar | Exceção; nada gravado em `desafio` nem em `moderacao_desafio` | Aprovado |
| I10 | Envio de evidência | Júri congelado em `jurado_evidencia` sem as partes; desafio `EM_VOTACAO` | Aprovado |
| I11 | Migration `AlinhamentoModeloV3` sobre banco povoado no modelo anterior | Só o schema `public`, com as 10 tabelas; linhas e saldos preservados; validador + voto viram `jurado_evidencia`; valor monetário e prenda viram `descricao_recompensa`; o voto que faltava fecha o desafio | Aprovado |
| I12 | Voto e justificativa no detalhe do desafio, vistos pelo desafiado | Voto `VALIDO`, justificativa e data de quem votou; nulos para quem ainda não votou | Aprovado |
| I13 | RN29: o mesmo detalhe visto por jurado pendente, por quem já votou e com a votação fechada | Pendente: só sabe quem votou, sem voto nem comentário. Quem votou e votação fechada: tudo visível | Aprovado |
| I14 | Aba Votação do desafiado (`MinhasProvasNoJuri`) | A própria prova em votação, com placar e comentários; quem não enviou não a recebe; votação fechada sai da lista | Aprovado |

**I02 é o teste mais importante do projeto.** A view `vw_reconciliacao_saldo`
deve estar sempre vazia; qualquer linha significa que o saldo materializado
divergiu do ledger.

Os testes de criação de desafio substituem a Groq por um moderador falso: o
comportamento do provedor em si é coberto no nível 2 (`ChatIaTests`), e a
chamada real depende da chave, que fica fora do repositório.

## Nível 4 — Arquitetura

> **Especificado, não implementado.** A convenção é hoje garantida por revisão.

Testes que falham quando uma convenção é violada, para que a regra não dependa
de alguém lembrar na revisão:

* Nenhum handler de `Query` referencia `DbContext`.
* Nenhum handler de `Command` referencia Dapper.
* Nenhum módulo referencia tipos internos de outro módulo.

## Nível 5 — Sistema funcionando, de ponta a ponta

Os níveis anteriores testam o banco e o código isolados. Este testa o sistema
como a banca vai vê-lo: `docker compose up` com banco recém-povoado, chamadas à
API real como o frontend faz, e o efeito de cada passo conferido direto no
PostgreSQL. Cobre o que a seção 12 do edital lista — cadastro, consulta,
alteração, exclusão, relacionamentos, validação, dados inválidos e comunicação
entre sistema e banco.

> **Dados destes roteiros.** Os cenários abaixo usam o `seed.sql`, com usuários
> fictícios, porque precisam de um estado fixo para conferir saldos e ids. Esses
> nomes existem só nos testes: a demonstração usa as contas dos cinco integrantes
> ([13 - Povoamento](../03-banco-de-dados/implementacao/13-povoamento-dml.md)).

Roteiro em [`scripts/testes/roteiro-e2e.py`](../../scripts/testes/roteiro-e2e.py):

```bash
docker compose down -v && docker compose up -d --build
python3 scripts/testes/roteiro-e2e.py
```

| ID | Procedimento | Resultado esperado | Resultado obtido |
| --- | --- | --- | --- |
| E01 | Acesso: tentar o login de desenvolvimento e um token falso do Google | `/api/auth/dev/usuarios` responde 404; a configuração do login responde 200; o token falso é recusado (401, ou 503 sem Client ID) e não gera sessão | Aprovado |
| E02 | Consultar os grupos do Tavin | 2 grupos, com saldo e nível de filtro de cada um | Aprovado |
| E03 | Abrir a Central de Votação como Lari | A evidência "Correr 5km" pendente | Aprovado |
| E04 | Lari vota `VALIDO` (roteiro da demo) | Evidência `ACEITA`, desafio `FINALIZADA_CUMPRIU`, pote de 60 CP dividido entre Tavin e Theus, 2 CP para cada votante, contabilidade fechando | Aprovado |
| E05 | Lari vota de novo na mesma evidência | Recusado (HTTP 409) | Aprovado |
| E06 | Completar o cadastro do Google com 12 anos | Recusado (HTTP 422, RN26), nada gravado | Aprovado |
| E07 | Completar o cadastro do Google com 22 anos | Usuário criado (HTTP 201) | Aprovado |
| E08 | ADMIN adiciona o novo usuário ao grupo | Membro entra com 100 CP lançados no ledger (RN06, RN25) | Aprovado |
| E09 | Membro comum tenta adicionar alguém | Recusado (HTTP 403) | Aprovado |
| E10 | Membro comum tenta mudar o nível de filtro | Recusado (HTTP 403), nível inalterado (RN27) | Aprovado |
| E11 | ADMIN muda o nível para `PESADO`; depois tenta `EXTREMO` | Primeiro aceito; valor inválido recusado (HTTP 400) | Aprovado |
| E12 | Criar desafio sem a IA disponível | HTTP 503 e nenhuma linha em `desafio` nem em `moderacao_desafio` (RN28) | Aprovado |
| E13 | Theus aceita um desafio aberto | 10 CP debitados e retidos em escrow (RN18) | Aprovado |
| E14 | ADMIN remove membro que está num desafio em andamento | Recusado (HTTP 409), membro continua (RN25) | Aprovado |
| E15 | ADMIN remove membro sem pendências | Removido; saldo zerado por `SAIDA_GRUPO` (ADR 0018) | Aprovado |
| E16 | Criador cancela um desafio com motivo | `CANCELADA`, CP estornado aos participantes (RN12) | Aprovado |
| E17 | Consultar o ranking do grupo; não-membro tenta o mesmo | Ranking devolvido; não-membro não vê (HTTP 404) | Aprovado |
| E18 | Conferir a contabilidade depois de tudo | `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias | Aprovado |
| E19 | Antes do E04: Lari, jurada que ainda não votou, abre o desafio da demo; Tavin (desafiado) e Biel (desafiante) também | Lari sabe que Theus votou, mas voto, justificativa e data vêm nulos (RN29). Tavin e Biel veem `VALIDO` e o comentário do Theus | Aprovado |
| E20 | Antes do E04: `GET /api/validacao/minhas-provas` como Tavin, como Lari e sem login | Tavin recebe a prova com placar 1 x 0, quórum 2 e os 3 jurados, com o comentário do Theus. A Lari não recebe a prova. Sem login: 401 | Aprovado |
| E21 | Depois do E04: Lipe, que não votou, abre o desafio; Tavin consulta `minhas-provas` | Com o júri fechado, Lipe vê o voto e o comentário da Lari. A prova sai da lista do Tavin | Aprovado |
| E22 | Tavin cria um grupo pela API, com espaços em volta do nome e sem nível de filtro | 201; nome aparado; `MODERADO` por padrão; criador `ADMIN` com 100 CP e `CREDITO_INICIAL` (RN06) | Aprovado |
| E23 | Criar grupo com nome só de espaços; criar com nível `EXTREMO` | 400 nos dois; nenhum grupo gravado | Aprovado |
| E24 | Lari, que não é do grupo, tenta ler o detalhe, mudar o nível, convidar e remover | 404 nos quatro, sem revelar que o grupo existe; nada muda | Aprovado |
| E25 | Tavin convida com e-mail vazio, sem conta, com maiúsculas e espaços, e repetido | 400; 404 `Grupo.UsuarioNaoEncontrado`; 201 (acha a conta da Lari); 409 `Grupo.JaMembro` | Aprovado |
| E26 | Lari, membro comum, remove o Lipe; Tavin remove quem não é do grupo | 403 `Grupo.SomenteAdmin`, Lipe continua; 404 `Grupo.NaoMembro` | Aprovado |
| E27 | Tavin, único ADMIN, tenta sair com outros membros no grupo | 409 `Grupo.UltimoAdmin`; continua no grupo (RN25) | Aprovado |
| E28 | Lipe sai do grupo por conta própria | 204; `SAIDA_GRUPO` de -100; conta do Lipe no grupo em zero; views vazias | Aprovado |
| E29 | Tavin readmite o Lipe | 201; volta com 100 CP; ledger `CREDITO_INICIAL`, `SAIDA_GRUPO`, `CREDITO_INICIAL`; reconciliação fecha (ADR 0018) | Aprovado |
| E30 | Antes do E04: Lari, que só está no júri da evidência 2, tenta sair do grupo 1 | 409 `Grupo.MembroComPendencias`; continua no grupo (RN25) | Aprovado |

Executado em 29/10/2026: **18 de 18 aprovados**, duas vezes, cada uma num banco
recém-criado. Reexecutado em 31/10/2026, depois das leituras novas da API do
redesign: **18 de 18**. Na mesma data, as telas de login, desafios, criação de desafio e
detalhe do grupo foram conferidas no navegador. Sem a chave da Groq, a tela de
criação mostra o motivo do bloqueio e não cria nada.

### Nível 5b — Os mesmos fluxos, pela tela

O roteiro de API prova a regra; este prova que **a tela** a entrega. Ele abre o
Chrome de verdade, faz o que um usuário faria (login, formulários, botões,
caixa de confirmação) e, a cada escrita, confere o efeito direto no PostgreSQL.
Os dados são descobertos na hora, sem ids fixos, então roda em banco semeado.

Roteiro em [`scripts/testes/roteiro-e2e-ui.mjs`](../../scripts/testes/roteiro-e2e-ui.mjs):

```bash
npm i --no-save playwright-core                 # uma vez, fora do package.json
node scripts/testes/roteiro-e2e-ui.mjs          # navegador visível (padrão)
HEADED=0 node scripts/testes/roteiro-e2e-ui.mjs # sem janela
```

O roteiro **escreve** no banco e consome um desafio aberto e uma evidência por
rodada. Para repetir, volte ao seed (`docker compose down -v` e `up`, ou
`pg_restore` de um dump do banco recém-semeado).

| ID | Procedimento | Resultado esperado (tela e banco) | Resultado obtido |
| --- | --- | --- | --- |
| U01 | Entrar como Tavin | `/desafios` lista os desafios dos grupos dele (7 = 7 no banco) | Aprovado |
| U02 | Abrir o detalhe de um desafio | Título da tela igual ao do banco | Aprovado |
| U03 | Criar um grupo pelo formulário | Grupo na lista; criador `ADMIN` com 100 CP e `CREDITO_INICIAL` | Aprovado |
| U04 | Adicionar um membro por e-mail e removê-lo (menu "⋯" e diálogo de confirmação) | Entra com 100 CP; sai com `SAIDA_GRUPO` e ledger do membro em zero | Aprovado |
| U05 | Criar desafio sem a IA | A tela explica o bloqueio; `desafio` e `moderacao_desafio` inalteradas (RN28) | Aprovado |
| U06 | Dois membros aceitam um desafio aberto, como Desafiado e Desafiante | Cada um debitado do valor e retido em escrow; desafio `EM_ANDAMENTO` (RN18, RN21) | Aprovado |
| U07 | O Desafiado envia a evidência | `EM_VOTACAO`; júri congelado sem Desafiante nem Desafiado (RN14) | Aprovado |
| U08 | Os jurados votam "Vale" na Votação, confirmando cada voto, até o quórum | Evidência `ACEITA`, desafio `FINALIZADA_CUMPRIU`, pote pago, 2 CP por voto, views de contabilidade vazias | Aprovado |
| U09 | Quem já votou volta à Votação | A tela não oferece mais Vale/Não vale; 1 voto no banco | Aprovado |
| U10 | Perfil e Ranking | Saldos iguais aos do banco, por grupo e por membro | Aprovado |
| U11 | Alternar o tema, recarregar e percorrer 8 telas em 1440x900 | Tema persiste; nenhuma tela rola na vertical | Aprovado |
| U12 | Celular 390x844: login, desafios e detalhe do grupo | Nenhum overflow horizontal | Aprovado |
| U13 | Abrir `/` sem sessão; entrar e abrir `/` de novo | Sem sessão vai direto a `/login`; logado vai a `/desafios`; nenhuma abertura animada no caminho (removida em 20/11/2026) | Aprovado |
| U14 | Abrir a tela de login | Só o botão do Google (ou o aviso de "não configurado"); nenhum usuário do seed listado; `/api/auth/dev/usuarios` responde 404 | Aprovado |
| U15 | Como Lipe, escolher **Foto** no desafio do dinossauro, enviar um PNG pelo seletor de arquivo e mandar ao júri; depois, como Tavin, abrir a Votação | "Mandar para o júri" só libera depois da foto; `url_comprovante` aponta para `/api/midia/<guid>`; a URL sem login responde 401; o júri vê a imagem carregada ([ADR 0022](../02-arquitetura/adr/0022-foto-da-prova-no-minio-pela-api.md)) | Aprovado |
| U16 | Na prova do U15, um jurado vota **Vale** pela tela do desafio, com comentário; outro jurado pendente abre a mesma tela; depois, o desafiado | Voto e comentário gravados; o jurado pendente não vê o comentário (RN29); o desafiado vê | Aprovado (27/11; antes, conferido à mão em 26/11) |
| U17 | Depois do U16, o desafiado abre a aba Votação | Se o júri continua aberto: "Suas provas no júri" com placar igual ao banco, o comentário do U16 e nenhum botão de voto (RN14). Se o voto do U16 fechou o júri: a prova não aparece | Aprovado |
| U18 | Tavin, ADMIN do grupo do U03, troca o filtro para **Leve** e salva | `LEVE` no banco; continua marcado depois de recarregar (RN27) | Aprovado |
| U19 | Convidar pela tela um e-mail sem conta; depois, o da Mila | Alerta "Nenhum usuário cadastrado com este e-mail." e nada gravado; Mila entra com 100 CP | Aprovado |
| U20 | Tavin, único admin, tenta sair; depois a Mila, membro comum, abre o grupo | A tela avisa e a API recusa a saída do Tavin. A Mila não tem menu de ações nem convite, e o filtro fica travado | Aprovado |
| U21 | Mila sai pelo diálogo "Sair do grupo" | Volta para `/grupos` sem o grupo; `SAIDA_GRUPO` de -100; views vazias (RN25, ADR 0018) | Aprovado |

Executado em 30/10/2026 num banco recém-semeado: **12 de 12 aprovados**, uma vez
com o navegador visível e outra sem janela.

Reexecutado em 31/10/2026, depois do redesign de UI/UX
([propostas](../04-ux/propostas/README.md), issues #44 a #49), com os seletores
do roteiro adaptados às telas novas: **12 de 12 aprovados**, num banco
recém-semeado e com a API sem chave da IA — o U05 testa justamente o bloqueio
sem chave; com a chave configurada, a IA real aprova a proposta e o cenário não
se aplica.

Reexecutado em 31/10/2026 com a abertura animada
([tela inicial](../04-ux/propostas/tela-inicial/README.md)): **13 de 13
aprovados**, num banco recém-semeado e com a API sem chave da IA. Toda carga de
página agora passa pela abertura, então os roteiros de tela e de IA a dispensam
com uma tecla depois de cada `goto` e de cada recarga.

Numa rodada anterior, feita sem recriar o banco, o U11 acusou 45 px de rolagem
interna em `/desafios/nova`. Cada rodada cria um grupo novo para o Tavin, e a
lista de grupos dessa tela cresce até passar da altura. A falha vem dos dados
acumulados, não da abertura; com o banco recém-semeado, o U11 passa.

Reexecutado em 07/11/2026 com a abertura em 3D
([rodada 4](../04-ux/propostas/tela-inicial/README.md#rodada-4-abertura-em-3d-estilo-ps1)),
sem recriar o banco e com a API sem chave da IA: **12 de 13**. O U13 passou; o
único reprovado foi o U11, pelos mesmos 45 px de `/desafios/nova` causados pelos
dados acumulados. O roteiro de IA simulada passou **14 de 14**.

Reexecutado em 20/11/2026 com o login só pelo Google
([ADR 0021](../02-arquitetura/adr/0021-login-exclusivo-google.md)), num banco
recém-criado e com a API sem chave da IA nem Client ID do Google:

* API de ponta a ponta: **18 de 18**;
* tela: **14 de 14**, com o U14 novo;
* IA simulada: **14 de 14**;
* testes da API (`dotnet test`): **162 de 162**, com 15 novos de login e tokens.

O popup do Google não se automatiza. Os roteiros criam a sessão assinando o JWT
com a chave do ambiente de teste
([`scripts/testes/sessao.mjs`](../../scripts/testes/sessao.mjs)), e o popup real
é testado à mão, com uma conta Google, antes do merge.

Reexecutado em 20/11/2026 com a foto da prova pelo MinIO
([ADR 0022](../02-arquitetura/adr/0022-foto-da-prova-no-minio-pela-api.md)) e o
botão **A+** de fonte maior, num banco recém-criado e com a API sem chave da IA:

* API de ponta a ponta: **18 de 18**;
* tela: **14 de 15**, com o U15 novo aprovado. O U11 reprovou pela rolagem da
  área de conteúdo em `/desafios/nova` (146 px), `/grupos/:id` (68 px) e
  `/perfil` (2 px) em 1440x900. A falha vem do redesign mobile-first, é a mesma
  da branch do login e fica para decisão do time;
* IA simulada: **14 de 14**;
* testes da API (`dotnet test`): **170 de 170**, com 8 novos para a foto (tipo
  pelos primeiros bytes e nome sem caminho).

Reexecutado em 26/11/2026 com o voto e a justificativa na tela do desafio
([#83](https://github.com/SecreTavin/A3-banco-de-dados/issues/83)):

* testes da API (`dotnet test`): **176 de 176**, com 6 novos (I12 a I14);
* API de ponta a ponta: **18 de 18**;
* tela: **o roteiro não rodou**, porque o Google Chrome não estava instalado no
  computador. O fluxo do U16 foi conferido à mão, no navegador embutido do
  Claude Code, num ambiente isolado:
  * o desafiado vê o voto e o comentário;
  * o jurado pendente não vê o comentário e vota pela tela do desafio;
  * o desafiado vê a própria prova na aba Votação, com o placar e os comentários;
  * o voto que fecha o júri apura e paga;
  * no celular (375 px), a página não rola na horizontal.

Reexecutado em 27/11/2026 no Windows, com o código do PR #84 e os casos novos
E19 a E21, U16 e U17. Cada roteiro rodou numa pilha separada
(`COMPOSE_PROJECT_NAME=euduvido-e2e`) com banco recém-criado, com o navegador
visível e com a API sem chave da IA:

* testes da API (`dotnet test`): **176 de 176**;
* API de ponta a ponta: **21 de 21**;
* tela: **17 de 17**, com U16 e U17 rodando pela primeira vez no roteiro;
* IA simulada: **14 de 14**.

Na mesma data, depois dos casos de grupo (E22 a E30 e U18 a U21), cada roteiro
rodou de novo num banco recém-criado:

* API de ponta a ponta: **30 de 30**;
* tela: **20 de 21**. Os 4 cenários de grupo passaram nas duas rodadas. O U11
  reprovou nas duas, com os mesmos números de 20/11: rolagem da área de conteúdo
  em `/desafios/nova` (146 px), `/grupos/1` (68 px) e `/perfil` (2 px). A
  aprovação dele na rodada anterior foi a exceção. A tela está no limite da
  altura, e o defeito continua aberto para decisão do time.

A primeira rodada de tela, feita no mesmo banco logo depois do roteiro da API,
deu U15 a U17 como "não coberto": o E16 cancela o desafio do dinossauro, que o
U15 precisa encontrar em andamento. **Os roteiros da API e da tela não podem
rodar em sequência no mesmo banco.** Recrie o banco entre eles, ou rode a tela
primeiro.

No Windows, o roteiro de tela precisa de
`CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"`, porque o
caminho padrão é o do Mac.

O envio também foi conferido direto na API: sem login responde 401; texto com
nome `.png` responde 400; arquivo de 9 MB responde 400; nome com `../` responde
404; e a foto lida de volta tem os mesmos bytes enviados.

O que a tela **não** cobre, e onde cada coisa é testada:

* **Segundo voto na mesma evidência (HTTP 409):** a tela esconde os botões de
  quem já votou, então não há como tentar. O erro da API é o cenário E05.
* **Criar desafio com a IA funcionando:** exige a chave da Groq, que o ambiente
  de teste não tem. A tela só exercita o bloqueio (U05); o restante da moderação
  é o nível 5c, com um provedor simulado.
* **Envio de arquivo de evidência:** não existe; o comprovante é uma URL
  ([documento 16](../02-arquitetura/16-execucao-local.md)).

### Nível 5c — Criar desafio com a moderação por IA respondendo

Os roteiros anteriores rodam sem a chave da Groq, então só exercitam o caminho
em que a IA falha. Este cobre o resto da RN28: a IA aprova, recusa, cai, demora,
rejeita a chave ou responde fora do formato — e o que a aplicação faz em cada
caso, na API, na tela e no PostgreSQL.

> **Alcance.** O provedor é **simulado**
> ([`ia-falsa.mjs`](../../scripts/testes/ia-falsa.mjs)): um servidor local que
> cumpre o contrato da API de chat (`POST /v1/chat/completions`, `Bearer`, JSON
> `{"aprovado", "motivo"}`) e decide o veredito por marcadores no título. O teste
> prova que **a aplicação integra corretamente** com um provedor que cumpre o
> contrato. Ele **não** prova como o modelo real da Groq julgará um desafio:
> isso depende do modelo e só se avalia com a chave real (abaixo).

Só existe um uso de IA no código: a moderação de desafios
(`ModeradorDesafio`). Não há IA de prova ou de evidência.

Roteiro em [`scripts/testes/roteiro-e2e-ia.mjs`](../../scripts/testes/roteiro-e2e-ia.mjs):

```bash
npm i --no-save playwright-core                  # uma vez, fora do package.json
node scripts/testes/roteiro-e2e-ia.mjs           # navegador visível nos cenários de tela
HEADED=0 node scripts/testes/roteiro-e2e-ia.mjs  # sem janela
```

O que o roteiro faz com o ambiente: sobe o provedor simulado na porta 5099,
recria **só o contêiner da API** com
[`compose.ia-falsa.yml`](../../scripts/testes/compose.ia-falsa.yml) (`Ia__BaseUrl`
para o simulado, chave de teste, timeout de 3 s) e, ao terminar, recria a API sem
esse override — volta ao padrão, sem chave. Não usa `down` nem toca em banco,
storage ou web. Se a restauração falhar, o próprio roteiro diz o comando:
`docker compose up -d --no-deps api`. Escreve no banco (desafios e moderações),
troca e restaura o nível de filtro de um grupo; pode rodar várias vezes.

| ID | Procedimento | Resultado esperado (API, tela e banco) | Resultado obtido |
| --- | --- | --- | --- |
| I01 | Criar proposta que a IA aprova | HTTP 201; desafio `ABERTA`; `moderacao_desafio` aprovada e ligada ao desafio; 1 chamada ao provedor com `Bearer`, modelo configurado, temperatura 0, mensagens `system` e `user` e o nível do grupo | Aprovado |
| I02 | Criar proposta que a IA recusa | HTTP 422 `Desafio.DesafioRecusado` com o motivo da IA; nenhum desafio; ledger intacto; avaliação gravada com `aprovado=false`, `id_desafio` nulo, nível e motivo (RN28) | Aprovado |
| I03 | O provedor responde HTTP 500 | HTTP 503 `Ia.Indisponivel`, "Nada foi criado"; `desafio`, `moderacao_desafio` e `transacao_cp` inalteradas | Aprovado |
| I04 | O provedor demora mais que o timeout (3 s) | HTTP 503 em ~3 s; depois da resposta tardia continua sem gravar | Aprovado |
| I05 | O provedor rejeita a chave (401) | HTTP 503 citando o 401; nada gravado | Aprovado |
| I06 | Resposta sem JSON; resposta com `<think>` e cerca ```` ```json ```` | Sem JSON: 503 sem gravar. Com raciocínio e cerca: 201 e motivo extraído | Aprovado |
| I07 | Mesma proposta de risco em grupo `LEVE`, `MODERADO` e `PESADO` (o nível é trocado pela API e restaurado) | `LEVE` aprova (201); `MODERADO` e `PESADO` recusam (422); o prompt e a moderação gravada trazem o nível de cada rodada (RN27) | Aprovado |
| I08 | Sete entradas inválidas (título vazio ou com 121 caracteres, descrição vazia, custo 0 e negativo, prazo no passado, tipo de recompensa inválido) | HTTP 400 em todas; o provedor não recebe nenhuma chamada; banco inalterado | Aprovado |
| I09 | Criar desafio em grupo de que o usuário não é membro | HTTP 403 `Desafio.NaoMembroDoGrupo`; nenhuma chamada ao provedor; banco inalterado | Aprovado |
| I10 | Título e descrição com `</desafio>` e um JSON de aprovação | O prompt tem 1 abertura e 1 fechamento de marca; os `<` e `>` do usuário viram `‹` e `›` | Aprovado |
| I11 | Tela: criar proposta aprovada | A tela vai para `/desafios/{id}` (`ABERTA`, moderação aprovada ligada) e o desafio aparece na lista do criador | Aprovado |
| I12 | Tela: criar proposta recusada | Alerta com o motivo da IA; continua em `/desafios/nova`; moderação +1, desafio inalterado | Aprovado |
| I13 | Tela: provedor fora do ar | Alerta "Nada foi criado"; nada gravado | Aprovado |
| I14 | Fechamento | `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias; todo desafio da rodada tem moderação aprovada; recusas auditadas sem desafio | Aprovado |

Executado em 30/10/2026: **14 de 14 aprovados**, uma vez com o navegador visível
e outra sem janela (a primeira rodada visível teve 4 reprovações, todas erro do
próprio roteiro — comparação de booleano do `psql` —, corrigido; ver o
[registro de IA](registro-ia/2026-10-30-e2e-ia-simulada.md)).

Reexecutado em 31/10/2026 depois do redesign: **14 de 14 aprovados**. Antes, o
I04 reprovou porque procurava "nao respondeu a tempo" e a mensagem da API passou
a ter acento; a verificação foi ajustada. Na mesma rodada, o roteiro imprimiu a
chave real da Groq ao restaurar a API; agora ela sai mascarada.

Reexecutado em 31/10/2026 com a abertura animada no caminho de cada carga de
página: **14 de 14 aprovados**.

**Com a chave real da Groq.** `EUDUVIDO_IA_REAL=1` não sobe o simulado nem mexe
na API, que deve ter sido iniciada com `IA_API_KEY` válida (`.env` do
compose). Nesse modo rodam só os cenários que não dependem de veredito
controlado — I08, I09, I14 — mais R01 (proposta inofensiva aprovada) e R02
(proposta claramente perigosa recusada).

Executado em 31/10/2026 com a chave do PO e o modelo `openai/gpt-oss-120b`:
**5 de 5 aprovados** (I08, I09, I14, R01, R02); os outros 11 ficam "não
coberto" de propósito, porque dependem de veredito controlado.

| ID | Procedimento | Resultado obtido |
| --- | --- | --- |
| R01 | Proposta inofensiva | HTTP 201, desafio criado com moderação aprovada — Aprovado |
| R02 | Proposta claramente perigosa (pular de um muro de 2 m) | HTTP 422: *"risco de lesão grave ao pular de 2 metros sem proteção"* — Aprovado |

**Sondagem dos níveis com o modelo real.** Além do roteiro, a mesma proposta foi
enviada aos três grupos do seed, um de cada nível, pela API (31/10/2026). Não é
caso de teste com resultado esperado fixo — é a observação de como o modelo
aplica o prompt de cada nível:

| Proposta | `LEVE` | `MODERADO` | `PESADO` |
| --- | --- | --- | --- |
| Correr 5 km no parque | — | aprovada | — |
| Beber uma garrafa de vodka em 10 minutos | — | recusada: *"risco de intoxicação alcoólica grave"* | — |
| Postar foto de pijama nos stories por 24 h | aprovada | aprovada | recusada: *"envolve exposição nas redes sociais"* |
| Pular de um muro de 2 m sem colchão | recusada | recusada | recusada |
| Comer 3 pimentas malaguetas seguidas | aprovada | — | **aprovada** |

O nível chega ao modelo e muda o veredito (a foto de pijama), e o que é
perigoso em qualquer nível é recusado em todos (o muro). A pimenta aprovada no
`PESADO` mostra o limite: o prompt manda recusar "qualquer desafio com risco
físico", e o modelo julgou que não havia risco. Para a banca, o caso que
demonstra a diferença entre níveis é a foto de pijama. Todas as recusas
apareceram em menos de 2,5 s, e as views de contabilidade continuaram vazias.

O que o nível 5c **não** cobre:

* **A calibração do modelo real.** A sondagem acima mostra o comportamento em
  cinco propostas; não é uma bateria de casos que garanta o veredito do modelo,
  que pode mudar de versão sem aviso (ADR 0015).
* **IA não configurada** (`Ia__BaseUrl` vazio): o cliente responde 503 antes de
  qualquer chamada; o ramo existe no código, mas este roteiro não o exercita.
* **Envio de arquivo de evidência:** não existe no app (a evidência é uma URL).

### Cobertura do nível 5

Os roteiros de ponta a ponta não usam ferramenta de cobertura de linha: a API
roda em contêiner, sem instrumentação. A cobertura é medida pelo que o sistema
expõe — endpoints, telas e regras de negócio —, cruzando o código com os três
roteiros (`roteiro-e2e.py`, `roteiro-e2e-ui.mjs` e `roteiro-e2e-ia.mjs`).
Medição de 27/11/2026, sobre a `main` em `edd7ceb` (com o PR #84). O PR
trouxe o endpoint `GET /api/validacao/minhas-provas` e a RN29, cobertos pelos
casos E19 a E21, U16 e U17. Os casos foram executados e aprovados em
27/11/2026.

| Dimensão | Cobertos | Total | Cobertura |
| --- | --- | --- | --- |
| Endpoints da API (incluindo `/health`) | 24 | 25 | **96%** |
| Telas do frontend (rotas do `App.tsx`) | 9 | 9 | **100%** |
| Regras de negócio ([documento 08](../01-negocio/08-regras-de-negocio.md)) | 18 | 28 | **64%** |

Um endpoint conta como coberto quando algum roteiro o chama, direto pela API ou
pela tela que o usa. Uma regra conta quando algum caso confere o comportamento
que ela exige, no aceite ou na recusa; observar um status no caminho feliz não
basta para as regras de domínio de valores (RN03, RN13).

**Endpoint não coberto:** `GET /api/ranking/grupos/{id}/maiores-desafios`.
Nenhum roteiro o chama, e o frontend também não.

**Cobertura parcial:** `POST /api/auth/google` só é exercitado com token falso
(E01). O login real depende do popup do Google, testado à mão antes do merge.

**Regras cobertas:** RN01 (I08), RN04 (E05, U09), RN05 (E01, U14), RN06 (E08,
U03, U04), RN07 (I08), RN12 (E16), RN14 (U07), RN15 (E04, U08), RN17 (E04,
U08), RN18 (E13, U06), RN21 (U06), RN22 (U15), RN23 (E04), RN25 (E09, E14,
E15), RN26 (E06, E07), RN27 (E10, E11, I07), RN28 (E12, U05, I01 a I13) e
RN29 (E19, E21, U16).

**Regras fora do nível 5**, e onde cada uma é testada:

| Regra | Onde é testada |
| --- | --- |
| RN02 — valor monetário maior que zero | Em nenhum nível. A migration `AlinhamentoModeloV3` removeu `chk_desafio_valor` e levou o valor para `descricao_recompensa` (I11 do nível 3), mas o documento 08 ainda cita a constraint. A regra precisa ser revista |
| RN03 — status do desafio restrito | T01 |
| RN08 — saldo nunca negativo | T08 |
| RN09 — um `DESAFIANTE` e um `DESAFIADO` | T06 (U06 só percorre o caminho feliz) |
| RN10 — no máximo 5 evidências | T13 |
| RN11 — prazo de votação de 1 semana | `EvidenciaTests` (nível 2) |
| RN13 — status da evidência restrito | Nenhum caso dedicado |
| RN16 — empate e prazo expirado | Nenhum caso |
| RN19 — voto só em `EM_VOTACAO` e no prazo | T11 |
| RN24 — ledger append-only | T09, T10, T19 |

Contando os níveis 1 a 3 junto com o 5, só RN02, RN13 e RN16 ficam sem teste.
A RN16 (empate e prazo expirado) passou a ser coberta pelos cenários V19, P01 e
P02 do roteiro completo, descrito abaixo.

### Nível 5d — Roteiro completo

O [roteiro completo dos testes de ponta a ponta](roteiro-e2e.md) desce um
nível: conta cada resposta possível de cada endpoint e tela, não só se o
endpoint foi chamado. São 201 cenários, e os que os roteiros acima não
cobriam ganharam caso em dois scripts novos. Cada caso leva o ID do cenário:

* [`roteiro-e2e-completo.py`](../../scripts/testes/roteiro-e2e-completo.py):
  API, banco, prazos, concorrência, configuração e banco fora do ar;
* [`roteiro-e2e-ui-completo.mjs`](../../scripts/testes/roteiro-e2e-ui-completo.mjs):
  tela no Chrome e hub do SignalR por WebSocket.

Cada cenário monta o próprio mundo por SQL (usuários, grupo, desafio) e age
pela API ou pela tela. Os prazos são testados movendo as datas para o passado e
reiniciando a API, porque o `PrazosWorker` roda ao subir.

Executado em 27/11/2026 numa pilha própria (`euduvido-e2e`), com banco
recém-criado e navegador visível:

Primeira execução, antes das correções:

| Roteiro | Casos | Aprovados | Reprovados |
| --- | --- | --- | --- |
| API completo | 92 | 85 | 7 |
| Tela e tempo real completo | 26 | 24 | 2 |

Somando os roteiros dos níveis 5 a 5c: 201 de 201 cenários executados, 191
aprovados e 10 reprovados, todos por defeito do sistema (abaixo).

O login com o Google (A05 a A07, F05 e F06) roda com o validador simulado do
[ADR 0024](../02-arquitetura/adr/0024-validador-google-simulado-para-testes.md).
Os roteiros recriam a API com `GOOGLE_SIMULADO_CHAVE`, e ela passa a aceitar ID
tokens no formato do Google assinados com essa chave. Na tela, o script do
Google é trocado por um botão que devolve esse token. Daí em diante, o fluxo é
o real: `cadastroPendente`, formulário de apelido e nascimento, criação da
conta. O popup do Google de verdade continua sendo testado à mão antes do
merge. Testes de unidade do validador: **129 de 129**, com 7 novos.

**Os 10 reprovados eram defeitos do sistema, corrigidos no mesmo dia** com as
regras decididas pelo responsável:

| ID | Defeito | Correção |
| --- | --- | --- |
| V27 | Desafio decidido sem ninguém do lado vencedor deixava o pote preso: 20 CP em `vw_escrow_orfao` | `encerrar_desafio` devolve o pote a quem entrou (RN23) |
| D32 | Cancelar com prova no júri não fechava a votação: o júri continuava votando e recebia 2 CP | `cancelar_desafio` expira a prova (RN12) |
| H01, H02 | O hub `/hubs/votacao` aceitava conexão sem login, e qualquer logado entrava no canal de outro grupo | Hub exige login; `EntrarNoGrupo` confere se quem chama é membro |
| C02 | Dois aceites simultâneos no mesmo papel davam 500 | Violação de constraint vira 409 |
| P05 | Desafio `EM_ANDAMENTO` com prazo vencido ficava parado, com CP em escrow | Nova RN30: o worker encerra como perdido o desafio vencido sem prova no júri |
| V11 | Num grupo só com os duelistas, a prova nascia sem júri | Envio recusado (409 `Evidencia.SemJuri`, RN14) |
| D25 | Quem não é do grupo recebia 403 ao aceitar, o que revelava o desafio | 404, como no `GET` |
| S05 | Com o banco fora, o `/health` levava 121 s para responder 503 | Prazo de 5 s |
| F30 (`U11`) | Rolagem vertical em `/desafios/nova`, `/grupos/:id` e `/perfil` a 1440x900 | CSS de desktop: grupos numa linha, coluna do filtro mais larga, rodapé menor |

As procedures mudaram por migration (`RegrasDeEncerramentoECancelamento`, com
o `schema.sql` regenerado), e as regras, no
[documento 08](../01-negocio/08-regras-de-negocio.md). O seed passou a usar
prazos relativos nos desafios em curso, senão a RN30 os encerraria ao subir a
API.

**Execução final em 27/11/2026, depois das correções.** Pilha própria
reconstruída, navegador visível. O roteiro de tela rodou num banco novo; os
outros quatro, em sequência no mesmo banco, para provar que um não interfere
no outro:

| Suíte | Resultado |
| --- | --- |
| `dotnet test` (níveis 1 a 3) | **183 de 183** |
| API de ponta a ponta (`roteiro-e2e.py`) | **30 de 30** |
| Tela (`roteiro-e2e-ui.mjs`) | **21 de 21**, com o U11 aprovado |
| API completo | **92 de 92** |
| Tela e tempo real completo | **26 de 26** |
| IA simulada | **14 de 14** |

`vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias no fim. **Os 201 cenários
do roteiro completo passam.**

Na execução final, dois testes precisaram de ajuste, sem mudança no app:

* **F33:** a correção do D25 trocou o 403 por 404, e o teste ainda procurava o
  403.
* **I01:** o A15 cadastrava um segundo "Tavin", e o roteiro da IA buscava o
  Tavin pelo apelido sem `LIMIT`. O A15 agora repete o apelido de um usuário
  próprio, e as buscas por apelido pegam o de menor id.

A análise também mostrou que o ramo "5ª evidência esgotada" de
`apurar_votacao` nunca roda: a terceira prova não aceita já encerra o desafio.

## Execução

```bash
cd apps/api && dotnet test
```

Requer Docker: cada classe de integração sobe seu próprio PostgreSQL via
Testcontainers e aplica as migrations — incluindo procedures e triggers, que são
justamente o que se quer exercitar. Só os testes sem banco:

```bash
cd apps/api && dotnet test --filter "FullyQualifiedName~Tests.Unidade"
```

O CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) roda a cada
PR e a cada push na `main`, em `ubuntu-latest` (os runners Windows e macOS
hospedados não têm Docker utilizável para contêineres Linux):

* **banco** — aplica `schema.sql`, `seed.sql` e as consultas analíticas num
  PostgreSQL 16 limpo, parando no primeiro erro, e confere que
  `vw_reconciliacao_saldo` e `vw_escrow_orfao` estão vazias. Prova a cada commit
  que o DDL do [documento 12](../03-banco-de-dados/implementacao/12-ddl-schema.md)
  é válido e aplicável (RNF05).
* **api** — `dotnet build` e `dotnet test` (níveis 1 a 3).
* **web** — build do frontend.

O nível 4 continua especificado e não implementado.

## Validação de aceitação pelos testadores

Além dos testes automatizados e do roteiro de ponta a ponta, dois integrantes
testaram o protótipo na semana de 26/10 e passaram o feedback ao Rafael Alves,
que o consolidou e conduziu as correções. O feedback foi dado diretamente a ele e
não ficou registrado em issue ou PR; este documento é o registro.

| Testador | Plataforma | Papel |
| --- | --- | --- |
| Mario Lana Veloso Junior | Desktop | Testou o protótipo no computador e relatou o que atrapalhava o uso |
| Luís Phillipe Pedra Souza | Mobile | Testou o protótipo no celular e relatou o que atrapalhava o uso |

O que o feedback pediu, e onde foi tratado:

| Ponto levantado | Correção | Onde |
| --- | --- | --- |
| Conteúdo que não dava para alcançar, principalmente no celular | A área de conteúdo passou a rolar por dentro, com topo e navegação fixos | [PR #34](https://github.com/SecreTavin/A3-banco-de-dados/pull/34) |
| Legibilidade: contraste e alvos de toque pequenos | Contraste AA e alvos de pelo menos 40px; avatar com fallback | [PR #34](https://github.com/SecreTavin/A3-banco-de-dados/pull/34) |
| Desktop: rolagem vertical, textos pequenos e muito espaço em branco nas laterais | Redesign: telas sem rolagem vertical, texto maior, largura útil de 1360px | [PR #35](https://github.com/SecreTavin/A3-banco-de-dados/pull/35) |
| Mobile: experiência de uso e legibilidade | Redesign mobile desenhado e aprovado no Figma; implementação a seguir | Figma, página "Redesign (mobile 390x844)" |

As correções foram revalidadas por medição (conteúdo inalcançável, overflow,
contraste e alvos de toque, antes e depois), registrada nos registros de IA
[2026-10-30-correcoes-ux-responsividade](registro-ia/2026-10-30-correcoes-ux-responsividade.md)
e [2026-10-30-redesign-desktop](registro-ia/2026-10-30-redesign-desktop.md).
Uma nova rodada de testes do sistema está prevista para a semana de 06/11, como
no [plano de trabalho](../00-introducao/07-plano-de-trabalho.md).
