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

Roteiro em [`scripts/testes/roteiro-e2e.py`](../../scripts/testes/roteiro-e2e.py):

```bash
docker compose down -v && docker compose up -d --build
python3 scripts/testes/roteiro-e2e.py
```

| ID | Procedimento | Resultado esperado | Resultado obtido |
| --- | --- | --- | --- |
| E01 | Abrir o login de desenvolvimento | Os 9 usuários do seed listados | Aprovado |
| E02 | Consultar os grupos do Tavin | 2 grupos, com saldo e nível de filtro de cada um | Aprovado |
| E03 | Abrir a Central de Votação como Lari | A evidência "Correr 5km" pendente | Aprovado |
| E04 | Lari vota `VALIDO` (roteiro da demo) | Evidência `ACEITA`, desafio `FINALIZADA_CUMPRIU`, pote de 60 CP dividido entre Tavin e Theus, 2 CP para cada votante, contabilidade fechando | Aprovado |
| E05 | Lari vota de novo na mesma evidência | Recusado (HTTP 409) | Aprovado |
| E06 | Cadastrar usuário com 12 anos | Recusado (HTTP 422, RN26), nada gravado | Aprovado |
| E07 | Cadastrar usuário com 22 anos | Usuário criado (HTTP 201) | Aprovado |
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
| U13 | Abrir `/` sem sessão, apertar uma tecla; entrar, abrir `/` e clicar; abrir com "reduzir movimento" | A abertura anima; a tecla leva a `/login`; logado, o clique leva a `/desafios`; com menos movimento a cena fica parada | Aprovado |

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
