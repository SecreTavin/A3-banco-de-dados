# Roteiro completo dos testes de ponta a ponta

Mapa de **todos os caminhos** que o sistema oferece, do ponto de vista de quem
o usa: cada endpoint com cada resposta possível, cada tela com cada estado, as
jornadas completas, os prazos, a concorrência e o tempo real. Cada cenário diz
se já é coberto pelos roteiros do [documento 17](17-testes.md) ou se é lacuna.

Levantado em 27/11/2026, por leitura do código na `main` (`17996e8`):
endpoints, validadores, handlers, domínio, procedures de
`database/scripts/ddl/functions/` e telas de `apps/web/src`. Atualizado no
mesmo dia com o PR #84 (`edd7ceb`): RN29, voto pela tela do desafio e aba
Votação do desafiado. Ainda em 27/11, todos os cenários ganharam caso de teste
e foram executados. Os 10 que reprovaram na primeira execução eram defeitos do sistema e
foram corrigidos no mesmo dia; hoje **os 201 passam**. Os cinco de login com o
Google rodam com o validador simulado do
[ADR 0024](../02-arquitetura/adr/0024-validador-google-simulado-para-testes.md). A história de cada defeito está em
[Riscos](#riscos-encontrados-na-análise).

## Como ler

| Marca | Significado |
| --- | --- |
| ✅ `E04` | Coberto por um roteiro automatizado (ID do documento 17) |
| ✎ `E19` | Caso escrito no roteiro, ainda não executado |
| ◐ | Conferido à mão em alguma rodada, mas sem roteiro que repita |
| ⬜ | Lacuna: nenhum roteiro exercita |
| ❌ `D25` | Executado e **reprovado**: defeito confirmado (nenhum, hoje). Detalhes em [Riscos](#riscos-encontrados-na-análise) |
| ⚠ | Lacuna em que o código sugere um defeito, ainda não executada |

| Prioridade | Critério |
| --- | --- |
| **P1** | Dinheiro (CP, escrow, pote), regra de negócio, permissão ou visibilidade |
| **P2** | Erro esperado com mensagem, validação, caso de borda |
| **P3** | Cosmético, leitura auxiliar, caminho improvável |

### Atores

Os cenários usam papéis, não nomes do seed, para valer em qualquer banco:

| Ator | Quem é |
| --- | --- |
| **Anônimo** | Sem token |
| **ADMIN** | Administrador do grupo do cenário |
| **Membro** | Membro comum do grupo |
| **Forasteiro** | Usuário logado que não é do grupo |
| **Criador** | Quem criou o desafio |
| **Desafiado / Desafiante / Apostador** | Papéis no desafio (RN09) |
| **Jurado** | Membro congelado no júri da evidência (RN14) |
| **Retardatário** | Membro que entrou no grupo depois do envio da evidência |

### Ciclo de vida que os cenários percorrem

```
Desafio:   ABERTA ──(2 duelistas)──> EM_ANDAMENTO ──(evidência)──> EM_VOTACAO
             │                            │                           │
             │ prazo vence (worker)       │ criador cancela           ├─ ACEITA ──> FINALIZADA_CUMPRIU
             │ criador cancela            v                           ├─ 3ª recusa ou 5ª evidência ──> FINALIZADA_PERDEU
             └──────────────────────> CANCELADA <─────────────────────┘ (criador cancela)

Evidência: EM_VOTACAO ──> ACEITA | RECUSADA (quórum de inválidos, ou prazo com votos)
                      └──> EXPIRADA (prazo sem nenhum voto)
```

Cada seta é ao menos um cenário abaixo.

Os prefixos dos IDs (A, S, G, D, V, M, K, F, J, P, C, H) não repetem os do
documento 17 (T, E, U, I, R). Na coluna *Situação*, um ID entre crases que
começa com E, U ou I é do documento 17. Um ID igual ao do próprio cenário é o
caso de mesmo nome em
[`roteiro-e2e-completo.py`](../../scripts/testes/roteiro-e2e-completo.py) (API)
ou em [`roteiro-e2e-ui-completo.mjs`](../../scripts/testes/roteiro-e2e-ui-completo.mjs)
(tela e tempo real).

---

## 1. Acesso e cadastro

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| A01 | `GET /api/auth/configuracao` sem login | 200 com `googleClientId` | ✅ `E01` | P3 |
| A02 | `POST /api/auth/google` sem Client ID no servidor | 503 | ✅ `E01` | P3 |
| A03 | `POST /api/auth/google` com `credential` vazia | 400 | ✅ `A03` | P2 |
| A04 | `POST /api/auth/google` com token falso | 401 `Auth.GoogleInvalido`, sem sessão | ✅ `E01` | P1 |
| A05 | Token Google válido com e-mail não verificado | 401 `Auth.GoogleInvalido` | ✅ `A05` | P2 |
| A06 | Token Google válido de usuário existente | 200 com `token` e `usuario` | ✅ `A06` | P1 |
| A07 | Token Google válido de usuário novo | 200 com `cadastroPendente`, `tokenCadastro`, nome e e-mail do Google | ✅ `A07` | P1 |
| A08 | `POST /api/auth/cadastro` com 22 anos | 201, usuário criado | ✅ `E07` | P1 |
| A09 | Cadastro com 12 anos | 422 `Usuario.IdadeMinima`, nada gravado | ✅ `E06` | P1 |
| A10 | Cadastro no limite: 16 anos completos hoje; 16 anos amanhã | Hoje: 201. Amanhã: 422 (RN26) | ✅ `A10` | P2 |
| A11 | Token de cadastro expirado ou adulterado | 401 `Auth.CadastroExpirado` | ✅ `A11` | P2 |
| A12 | Cadastro com e-mail que já tem conta | 409 `Usuario.EmailEmUso` | ✅ `A12` | P2 |
| A13 | Apelido vazio; apelido com 51 caracteres | 400 | ✅ `A13` | P2 |
| A14 | Data de nascimento ausente ou antes de 1900 | 400 | ✅ `A14` | P3 |
| A15 | Apelido igual ao de outro usuário | 201 (apelido não é único) | ✅ `A15` | P3 |
| A16 | `GET /api/auth/dev/usuarios` | 404 (login de desenvolvimento removido) | ✅ `E01`, `U14` | P1 |

## 2. Sessão e segurança transversal

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| S01 | Cada um dos 20 endpoints protegidos chamado sem token | 401 em todos | ✅ `S01` | P1 |
| S02 | Token expirado | 401 | ✅ `S02` | P1 |
| S03 | Token assinado com outra chave ou com claims alteradas | 401 | ✅ `S03` | P1 |
| S04 | `GET /health` com banco no ar | 200 `{"status":"ok"}` | ✅ (espera do `roteiro-e2e-ia.mjs`) | P3 |
| S05 | `GET /health` com banco fora | 503 | ✅ `S05` | P3 |

## 3. Grupos

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| G01 | `GET /api/grupos` | Grupos do usuário com saldo, papel e nível | ✅ `E02` | P2 |
| G02 | `GET /api/grupos` de usuário sem grupo | `[]` | ✅ `G02` | P3 |
| G03 | `GET /api/grupos/{id}` como Membro | Cabeçalho, membros com pendências, `desafiosAtivos` | ✅ `U04`, `U12` | P2 |
| G04 | `cpEmJogo` do detalhe | Igual à soma de `vw_cp_em_escrow` do grupo | ✅ `G04` | P2 |
| G05 | `GET /api/grupos/{id}` como Forasteiro | 404, sem revelar que o grupo existe | ✅ `E24` | P1 |
| G06 | `GET /api/grupos/{id}` inexistente | 404 | ✅ `G06` | P3 |
| G07 | `POST /api/grupos` válido | 201; criador `ADMIN` com 100 CP e `CREDITO_INICIAL` (RN06) | ✅ `U03` | P1 |
| G08 | `POST /api/grupos` sem `nivelFiltro` | 201 com `MODERADO` | ✅ `E22` | P3 |
| G09 | `POST /api/grupos` com nome vazio ou só espaços | 400 | ✅ `E23` | P2 |
| G10 | `POST /api/grupos` com nível `EXTREMO` | 400 | ✅ `E23` | P2 |
| G11 | `PATCH .../nivel-filtro` como ADMIN | 200, nível trocado | ✅ `E11`, `I07` | P1 |
| G12 | `PATCH .../nivel-filtro` com valor inválido | 400, nível inalterado | ✅ `E11` | P2 |
| G13 | `PATCH .../nivel-filtro` como Membro | 403 `Grupo.SomenteAdmin` (RN27) | ✅ `E10` | P1 |
| G14 | `PATCH .../nivel-filtro` como Forasteiro | 404 | ✅ `E24` | P2 |
| G15 | `POST .../membros` como ADMIN, e-mail cadastrado | 201; 100 CP no ledger (RN06, RN25) | ✅ `E08`, `U04` | P1 |
| G16 | E-mail com maiúsculas e espaços | Encontra o mesmo usuário | ✅ `E25` | P3 |
| G17 | E-mail sem conta | 404 `Grupo.UsuarioNaoEncontrado` | ✅ `E25` | P2 |
| G18 | E-mail vazio | 400 | ✅ `E25` | P2 |
| G19 | Usuário que já é membro | 409 `Grupo.JaMembro` | ✅ `E25` | P2 |
| G20 | `POST .../membros` como Membro | 403 | ✅ `E09` | P1 |
| G21 | `POST .../membros` como Forasteiro | 404 | ✅ `E24` | P3 |
| G22 | Ex-membro readmitido | Volta com 100 CP; `vw_reconciliacao_saldo` vazia (ADR 0018) | ✅ `E29` | P1 |
| G23 | `DELETE .../membros/{u}` como ADMIN, membro sem pendência | 204; `SAIDA_GRUPO` zera o saldo | ✅ `E15`, `U04` | P1 |
| G24 | Remover membro com desafio em curso | 409 `Grupo.MembroComPendencias` | ✅ `E14` | P1 |
| G25 | Remover membro que está em júri de votação aberta | 409 `Grupo.MembroComPendencias` | ✅ `E30` | P1 |
| G26 | Membro remove a si mesmo (sair do grupo) | 204; `SAIDA_GRUPO` | ✅ `E28` | P1 |
| G27 | Membro remove outro membro | 403 | ✅ `E26` | P1 |
| G28 | Único ADMIN tenta sair com outros membros no grupo | 409 `Grupo.UltimoAdmin` | ✅ `E27` | P1 |
| G29 | Único membro, que é ADMIN, sai | 204; grupo fica sem membros | ✅ `G29` | P3 |
| G30 | Remover id que não é membro | 404 `Grupo.NaoMembro` | ✅ `E26` | P3 |

## 4. Desafios

### Leitura

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D01 | `GET /api/categorias` | Lista ordenada por nome | ✅ indireto (`U05` carrega a tela de criação) | P3 |
| D02 | `GET /api/desafios` | Só desafios dos grupos do usuário | ✅ `U01` | P1 |
| D03 | `GET /api/desafios?status=ABERTA` | Só abertos | ✅ `D03` | P3 |
| D04 | `GET /api/desafios/{id}` como Membro | Detalhe, participantes, evidências e júri | ✅ `U02` | P2 |
| D05 | RN29: jurado que ainda não votou abre o detalhe com a votação aberta | Sabe quem votou; voto, justificativa e data dos outros vêm nulos | ✅ `E19` | P1 |
| D34 | Desafiado e Desafiante abrem o mesmo detalhe | Veem voto, justificativa e data de cada jurado | ✅ `E19` | P1 |
| D35 | Jurado que já votou abre o detalhe com a votação aberta | Vê os votos de todos | ✅ `D35` | P2 |
| D36 | Votação fechada: jurado que nunca votou abre o detalhe | Vê todos os votos e comentários | ✅ `E21` | P1 |
| D06 | `GET /api/desafios/{id}` como Forasteiro | 404 | ✅ `D06` | P1 |

### Criação (RN27, RN28)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D07 | IA aprova | 201; `ABERTA`; moderação ligada | ✅ `I01` | P1 |
| D08 | IA recusa | 422 com motivo; moderação auditada, sem desafio | ✅ `I02` | P1 |
| D09 | IA com 500, timeout, chave recusada ou resposta sem JSON | 503; nada gravado | ✅ `E12`, `I03` a `I06` | P1 |
| D10 | IA não configurada (`Ia__BaseUrl` vazio) | 503 antes de qualquer chamada | ✅ `D10` | P3 |
| D11 | Título vazio ou com 121 caracteres, descrição vazia, custo 0 ou negativo, prazo passado, tipo de recompensa inválido | 400; a IA não é chamada | ✅ `I08` | P2 |
| D12 | Descrição com 2001 caracteres; `descricaoRecompensa` com 256 | 400 | ✅ `D12` | P3 |
| D13 | Forasteiro cria no grupo | 403 `Desafio.NaoMembroDoGrupo`; a IA não é chamada | ✅ `I09` | P1 |
| D14 | Categoria inexistente | 400 `Desafio.CategoriaInexistente`; a IA não é chamada | ✅ `D14` | P2 |
| D15 | Mesma proposta em `LEVE`, `MODERADO`, `PESADO` | Veredito muda com o nível | ✅ `I07` | P1 |
| D16 | Injeção de prompt no título e na descrição | Marcas neutralizadas | ✅ `I10` | P1 |

### Aceite (RN08, RN09, RN18, RN21)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D17 | Primeiro duelista aceita | Debitado, CP em escrow; continua `ABERTA` | ✅ `E13`, `U06` | P1 |
| D18 | Segundo duelista aceita | `EM_ANDAMENTO` | ✅ `U06` | P1 |
| D19 | Apostador entra enquanto `ABERTA` | Debitado; status inalterado | ✅ `D19` | P1 |
| D20 | Papel `DESAFIADO` já ocupado | 409 `Desafio.PapelJaOcupado`; nada debitado | ✅ `D20` | P1 |
| D21 | Quem já participa aceita de novo, com outro papel | 409 `Desafio.JaParticipa` | ✅ `D21` | P1 |
| D22 | Saldo menor que o custo | 409 `Desafio.SaldoInsuficiente`; saldo intacto | ✅ `D22` | P1 |
| D23 | Aceitar desafio `EM_ANDAMENTO` (apostador atrasado) ou encerrado | 409 `Desafio.NaoAceitaParticipante` | ✅ `D23` | P1 |
| D24 | Papel ou escolha fora do domínio | 400 | ✅ `D24` | P2 |
| D25 | Forasteiro aceita | Esperado 404, como no `GET`. O código devolve 403 | ✅ `D25` | P2 |
| D26 | Desafio inexistente | 404 | ✅ `D26` | P3 |

### Cancelamento (RN12)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D27 | Criador cancela com participantes | `CANCELADA`; cada um estornado | ✅ `E16` | P1 |
| D28 | Criador cancela `ABERTA` sem participantes | `CANCELADA`; nenhum lançamento | ✅ `D28` | P2 |
| D29 | Motivo vazio | 400 `Desafio.MotivoObrigatorio` | ✅ `D29` | P2 |
| D30 | Quem não é o criador cancela | 403 `Desafio.SomenteCriadorCancela` | ✅ `D30` | P1 |
| D31 | Cancelar desafio já encerrado | 409 `Desafio.JaEncerrado` | ✅ `D31` | P2 |
| D32 | Cancelar `EM_VOTACAO` com evidência em votação | Evidência encerrada junto; o júri não vota mais nem recebe CP | ✅ `D32` | P1 |
| D33 | Desafio inexistente | 404 | ✅ `D33` | P3 |

## 5. Evidência e votação

### Envio (RN10, RN14, RN22)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V01 | Desafiado envia `LINK` | 201; `EM_VOTACAO`; júri congelado sem os duelistas | ✅ `U07` | P1 |
| V02 | Desafiado envia `FOTO` depois do upload | 201; URL `/api/midia/...` | ✅ `U15` | P1 |
| V03 | Desafiado envia `TEXTO` (relato, sem URL) | 201 | ✅ `V03` | P2 |
| V04 | Desafiado envia `VIDEO` | 201 | ✅ `V04` | P3 |
| V05 | Desafiante, Apostador ou Membro envia | 403 `Evidencia.SomenteDesafiadoEnvia` | ✅ `V05` | P1 |
| V06 | Envio em desafio `ABERTA`, `CANCELADA` ou finalizado | 409 `Evidencia.DesafioNaoAceitaEvidencia` | ✅ `V06` | P2 |
| V07 | Envio com evidência anterior ainda em votação | 409 `Evidencia.AnteriorEmVotacao` | ✅ `V07` | P1 |
| V08 | Nova evidência depois de uma `RECUSADA` | 201 com `ordem = 2` e júri novo | ✅ `V08` | P1 |
| V09 | `LINK`, `FOTO` ou `VIDEO` com URL sem `http(s)` | 400 | ✅ `V09` | P2 |
| V10 | Tipo de mídia inválido, URL vazia, URL com 501 caracteres, comentário com 1001 | 400 | ✅ `V10` | P2 |
| V11 | Grupo só com os dois duelistas (júri vazio) | Esperado: definir. O código cria a evidência sem jurados, e ela só expira | ✅ `V11` | P2 |

A sexta evidência (RN10) não é alcançável pela API, e a quinta também não:
toda prova não aceita é `RECUSADA` ou `EXPIRADA`, e a terceira delas já encerra
o desafio (`apurar_votacao`). O ramo "5ª evidência esgotada" da procedure é
código que nunca roda; o cenário que o testaria (antigo V18) saiu do roteiro, e
o encerramento pela terceira recusa é o V17. O limite de 5 continua coberto por
`T13`, no nível 1.

### Júri e voto (RN04, RN14 a RN17, RN19, RN23)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V12 | `GET /api/validacao/pendentes` como Jurado | Evidência listada com placar | ✅ `E03` | P1 |
| V13 | Pendentes como Desafiado ou Desafiante | Não lista a evidência | ✅ `V13` | P1 |
| V14 | Pendentes como Retardatário | Não lista (júri congelado) | ✅ `V14` | P1 |
| V15 | Votos `VALIDO` até o quórum | `ACEITA`; `FINALIZADA_CUMPRIU`; pote aos `VAI_CUMPRIR`; 2 CP por votante | ✅ `E04`, `U08` | P1 |
| V16 | Votos `INVALIDO` até o quórum | `RECUSADA`; 2 CP por votante; desafio continua `EM_VOTACAO` e aceita nova evidência | ✅ `V16` | P1 |
| V17 | Terceira evidência `RECUSADA` | `FINALIZADA_PERDEU`; pote aos `NAO_VAI_CUMPRIR` | ✅ `V17` | P1 |
| V19 | Empate dentro do prazo | Segue `EM_VOTACAO` (RN16) | ✅ `V19` | P1 |
| V20 | Segundo voto do mesmo jurado | 409 `Evidencia.JaVotou` | ✅ `E05`, `U09` | P1 |
| V21 | Desafiado, Desafiante, Retardatário ou Forasteiro vota | 403 `Evidencia.NaoEhValidador` | ✅ `V21` | P1 |
| V22 | Voto em evidência já decidida | 409 `Evidencia.NaoEstaEmVotacao` | ✅ `V22` | P1 |
| V23 | Voto depois do prazo, antes de o worker apurar | 409 `Evidencia.PrazoExpirado` | ✅ `V23` | P2 |
| V24 | Voto `TALVEZ`; justificativa com 256 caracteres | 400 | ✅ `V24` | P2 |
| V25 | Evidência inexistente | 404 | ✅ `V25` | P3 |
| V26 | Pote que não divide exato (ex.: 3 vencedores, pote de 100) | Primeiro vencedor recebe o resto; soma igual ao pote | ✅ `V26` | P1 |
| V27 | Desafio decidido sem nenhum participante do lado vencedor | Esperado: pote devolvido ou regra definida. O código deixa o pote preso | ✅ `V27` | P1 |

### Provas do desafiado no júri (#83)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V28 | `GET /api/validacao/minhas-provas` como Desafiado | A própria prova em votação, com placar, quórum e cada jurado com voto e justificativa | ✅ `E20` | P1 |
| V29 | `minhas-provas` como Jurado da mesma prova | Não inclui a prova | ✅ `E20` | P1 |
| V30 | `minhas-provas` sem login | 401 | ✅ `E20` | P2 |
| V31 | `minhas-provas` depois que o júri fecha | A prova sai da lista | ✅ `E21` | P2 |
| V32 | `minhas-provas` de quem não tem prova em votação | `[]` | ✅ `V32` | P3 |

## 6. Foto da prova (ADR 0022)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| M01 | `POST /api/midia` com PNG | 201 com `url` | ✅ `U15` | P1 |
| M02 | JPG e WebP | 201 | ✅ `M02` | P3 |
| M03 | Sem arquivo | 400 "Escolha uma foto." | ✅ `M03` | P3 |
| M04 | Arquivo acima do limite | 400 | ✅ `M04` | P2 |
| M05 | Texto com extensão `.png` | 400 (tipo pelos primeiros bytes) | ✅ `M05` | P1 |
| M06 | `GET /api/midia/{nome}` sem login | 401 | ✅ `U15` | P1 |
| M07 | `GET` logado | 200, mesmos bytes, `Cache-Control: private` | ✅ `M07` | P2 |
| M08 | Nome com `../` ou fora do formato | 404 | ✅ `M08` | P1 |
| M09 | Nome válido que não existe | 404 | ✅ `M09` | P3 |
| M10 | Forasteiro lê foto de outro grupo pela URL | 200: o ADR 0022 exige só login. Registrar como decisão | ✅ `M10` | P3 |

## 7. Ranking e perfil

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| K01 | `GET /api/ranking/grupos/{id}` como Membro | Ordenado por saldo e acertos | ✅ `E17`, `U10` | P2 |
| K02 | Ranking como Forasteiro | 404 | ✅ `E17` | P1 |
| K03 | Acertos, erros e `cpGanhoEmPremios` depois de um desafio finalizado | Batem com `participante_desafio` e `transacao_cp` | ✅ `K03` | P2 |
| K04 | `GET .../maiores-desafios` como Membro | Top 10 por pote | ✅ `K04` | P3 |
| K05 | `maiores-desafios` como Forasteiro | 404 | ✅ `K05` | P3 |
| K06 | `GET /api/perfil` | Dados e saldo por grupo iguais ao banco | ✅ `U10` | P2 |
| K07 | Extrato do perfil | `saldoApos` do lançamento mais recente igual ao saldo do membro | ✅ `K07` | P2 |
| K08 | Histórico do perfil | Contagens de criados, participações e evidências batem | ✅ `K08` | P3 |

## 8. Telas

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| F01 | `/` sem sessão; `/` logado | `/login`; `/desafios` | ✅ `U13` | P2 |
| F02 | Abrir `/perfil` direto, sem sessão | Vai para `/login` | ✅ `F02` | P1 |
| F03 | Rota inexistente | Vai para `/desafios` | ✅ `F03` | P3 |
| F04 | Login sem Client ID | Aviso de "não configurado", sem usuários do seed | ✅ `U14` | P1 |
| F05 | Primeiro login: formulário de apelido e nascimento | Cadastro conclui e entra | ✅ `F05` | P1 |
| F06 | Cadastro com menos de 16 anos | Mensagem da RN26 na tela | ✅ `F06` | P2 |
| F07 | Sessão expira durante o uso | Volta ao login com "Sessão expirada" | ✅ `F07` | P1 |
| F08 | Lista de desafios | Igual ao banco | ✅ `U01` | P2 |
| F09 | Detalhe do desafio | Título igual ao banco | ✅ `U02` | P2 |
| F10 | Detalhe: papéis já ocupados não aparecem como opção | Só sobra o livre e `APOSTADOR` | ✅ `F10` | P2 |
| F11 | Detalhe: entrar como Apostador | Debitado; aparece na lista | ✅ `F11` | P1 |
| F12 | Detalhe: cancelar como Criador, com motivo | `CANCELADA`; estorno no banco | ✅ `F12` | P1 |
| F13 | Detalhe: quem não é o Criador não vê "Cancelar" | Botão ausente | ✅ `F13` | P1 |
| F14 | Detalhe: enviar evidência `TEXTO` | `EM_VOTACAO` | ✅ `F14` | P2 |
| F15 | Criar desafio: aprovado, recusado, IA fora | Destino e alerta corretos | ✅ `U05`, `I11` a `I13` | P1 |
| F16 | Criar desafio: campos inválidos no formulário | Mensagem por campo; nada enviado | ✅ `F16` | P2 |
| F17 | Criar grupo | Grupo na lista | ✅ `U03` | P2 |
| F18 | Detalhe do grupo: ADMIN troca o nível de filtro | Nível novo no banco | ✅ `U18` | P1 |
| F19 | Detalhe do grupo: Membro não vê ações de ADMIN | Sem adicionar, remover ou trocar nível | ✅ `U20` | P1 |
| F20 | Detalhe do grupo: "Sair do grupo…" e confirmação | Sai; `SAIDA_GRUPO` | ✅ `U21` | P1 |
| F21 | Único ADMIN abre "Sair" | Aviso "o grupo precisa de outro admin" | ✅ `U20` | P2 |
| F22 | Remover membro com pendência | Tela avisa antes; banco recusa se insistir | ✅ `F22` | P2 |
| F23 | Adicionar membro com e-mail sem conta | Alerta com a mensagem da API | ✅ `U19` | P2 |
| F24 | Votação: "Vale" até o quórum | `ACEITA` | ✅ `U08` | P1 |
| F25 | Votação: "Não vale" com motivo | Voto `INVALIDO` com justificativa | ✅ `F25` | P1 |
| F26 | Votação sem pendências | Estado vazio | ✅ `F26` | P3 |
| F27 | Votação ao vivo: outro jurado vota | Placar atualiza sem recarregar | ✅ `F27` | P2 |
| F28 | Ranking com `?grupo=` e troca de grupo | Lista do grupo escolhido | ✅ `F28` | P3 |
| F29 | Perfil: extrato | Igual ao ledger | ✅ `F29` | P3 |
| F30 | Tema persiste e 8 telas sem rolagem em 1440x900 | Sem rolagem vertical | ✅ `U11` | P3 |
| F31 | Celular 390x844 | Sem overflow horizontal | ✅ `U12` | P2 |
| F32 | Botão **A+** de fonte maior persiste ao recarregar | Fonte mantida | ✅ `F32` | P3 |
| F33 | Erros 403 e 409 da API | Viram alerta legível, não tela quebrada | ✅ `F33` | P2 |
| F34 | Detalhe: Jurado pendente vê "Você está no júri desta prova" e vota **Vale** com comentário | Voto e justificativa gravados | ✅ `U16` | P1 |
| F35 | Detalhe: outro Jurado pendente abre a mesma prova | Aviso de que os votos aparecem depois do dele; comentário ausente (RN29) | ✅ `U16` | P1 |
| F36 | Detalhe: Desafiado abre a prova | Vê o voto e o comentário | ✅ `U16` | P2 |
| F37 | Detalhe: voto **Não vale** com motivo pela tela do desafio | Voto `INVALIDO` gravado | ✅ `F37` | P2 |
| F38 | Detalhe: Desafiante ou Membro fora do júri | Não vê os botões de voto | ✅ `F38` | P2 |
| F39 | Votação: Desafiado vê "Suas provas no júri" | Placar igual ao banco, comentário do jurado, sem botão de voto (RN14) | ✅ `U17` | P1 |
| F40 | Votação: um jurado vota enquanto o Desafiado está na aba | Placar da prova dele atualiza sem recarregar | ✅ `F40` | P3 |

## 9. Jornadas completas

Encadeiam vários cenários e terminam conferindo a contabilidade (J10).

| ID | Jornada | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| J01 | Criar → dois duelistas → evidência → quórum `VALIDO` | Pote aos `VAI_CUMPRIR` | ✅ `U03` a `U08` | P1 |
| J02 | J01 com apostadores dos dois lados | Só os acertadores dividem o pote (RN23) | ✅ `J02` | P1 |
| J03 | Três evidências recusadas | `FINALIZADA_PERDEU`; pote aos `NAO_VAI_CUMPRIR` | ✅ `J03` | P1 |
| J04 | Primeira evidência recusada, segunda aceita | `FINALIZADA_CUMPRIU`; votantes das duas recebem 2 CP | ✅ `J04` | P1 |
| J05 | Evidência sem nenhum voto até o prazo | `EXPIRADA`; ninguém recebe 2 CP | ✅ `J05` | P1 |
| J06 | Evidência com votos, sem maioria, até o prazo | `RECUSADA`; votantes recebem 2 CP | ✅ `J06` | P1 |
| J07 | Desafio `ABERTA` vence sem os dois duelistas | Worker cancela e estorna quem entrou | ✅ `J07` | P1 |
| J08 | Usuário novo: Google → cadastro → convite → aceite | Entra com 100 CP e aceita | ✅ `J08` | P2 |
| J09 | Membro sai e é readmitido | 100 CP novos; reconciliação fecha | ✅ `E29` | P1 |
| J10 | Ao fim de cada jornada | `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias | ✅ `E18`, `U08`, `I14` | P1 |

## 10. Prazos (`PrazosWorker`)

O worker roda ao subir a API e depois a cada 5 minutos. Para testar sem
esperar: mova o prazo para o passado por SQL e reinicie o contêiner da API
(`docker compose restart api`).

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| P01 | Evidência vencida sem votos | `EXPIRADA` | ✅ `P01` | P1 |
| P02 | Evidência vencida com votos e sem maioria | `RECUSADA`; 2 CP por votante | ✅ `P02` | P1 |
| P03 | Terceira não aceita por prazo | `FINALIZADA_PERDEU` | ✅ `P03` | P1 |
| P04 | Desafio `ABERTA` vencido | `CANCELADA` com motivo de prazo; estorno | ✅ `P04` | P1 |
| P05 | Desafio `EM_ANDAMENTO` com prazo vencido e sem evidência | Esperado: definir. Hoje nada acontece e o CP fica em escrow | ✅ `P05` | P2 |
| P06 | Worker roda duas vezes sobre o mesmo item | Nada muda na segunda (procedures idempotentes) | ✅ `P06` | P2 |

## 11. Concorrência

Duas requisições disparadas juntas (`Promise.all` no roteiro).

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| C01 | Dois votos que completam o quórum | Uma apuração; pote e 2 CP pagos uma vez só | ✅ `C01` | P1 |
| C02 | Dois aceites no mesmo papel | Um 200, outro 409. O código não trata a violação de unicidade, e o provável é 500 | ✅ `C02` | P1 |
| C03 | Dois aceites de desafios diferentes com saldo para um só | Um debitado, outro 409; saldo nunca negativo | ✅ `C03` | P1 |
| C04 | Dois envios de evidência no mesmo desafio | Um 201, outro 409 `Evidencia.AnteriorEmVotacao` | ✅ `C04` | P2 |
| C05 | Dois cadastros com o mesmo e-mail | Um 201, outro 409 | ✅ `C05` | P3 |

## 12. Tempo real (`/hubs/votacao`)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| H01 | Conectar ao hub sem token | Recusado | ✅ `H01` | P1 |
| H02 | Logado, `EntrarNoGrupo` de grupo alheio | Recusado | ✅ `H02` | P1 |
| H03 | Voto registrado | `VotacaoAtualizada` chega depois do commit, com o placar do banco | ✅ `H03` | P2 |
| H04 | Voto que encerra o desafio | `DesafioEncerrado` com o status final | ✅ `H04` | P2 |

---

## Resumo

| Área | Cenários | ✅ aprovados |
| --- | --- | --- |
| 1. Acesso e cadastro | 16 | 16 |
| 2. Sessão e segurança | 5 | 5 |
| 3. Grupos | 30 | 30 |
| 4. Desafios | 36 | 36 |
| 5. Evidência e votação | 31 | 31 |
| 6. Foto da prova | 10 | 10 |
| 7. Ranking e perfil | 8 | 8 |
| 8. Telas | 40 | 40 |
| 9. Jornadas | 10 | 10 |
| 10. Prazos | 6 | 6 |
| 11. Concorrência | 5 | 5 |
| 12. Tempo real | 4 | 4 |
| **Total** | **201** | **201** |

Executados: **201 de 201**. Aprovados: **201**.

Na primeira execução, 10 reprovaram. Eram defeitos do sistema: 9 apontados
pela análise, e o S05, achado na execução. Foram corrigidos em 27/11/2026, com
as regras decididas pelo responsável. A tabela de riscos abaixo guarda o que
cada um era e como foi resolvido.

O número é por cenário, não por endpoint: cada resposta possível conta
separado.

### Como rodar

Os roteiros completos escrevem no banco e mexem nos contêineres (reiniciam a
API, param o banco). Rode numa pilha própria, com banco recém-criado:

```bash
export COMPOSE_PROJECT_NAME=euduvido-e2e
docker compose down -v && docker compose up -d --build --wait
EUDUVIDO_DB=euduvido-e2e-db-1 EUDUVIDO_API_CONTAINER=euduvido-e2e-api-1     python3 scripts/testes/roteiro-e2e-completo.py
EUDUVIDO_DB=euduvido-e2e-db-1 node scripts/testes/roteiro-e2e-ui-completo.mjs
```

No Windows, acrescente
`CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"` ao
roteiro de tela.

| Roteiro | Casos | Aprovados | Reprovados | Tempo |
| --- | --- | --- | --- | --- |
| `roteiro-e2e-completo.py` (API, prazos, concorrência, Google simulado) | 92 | 92 | 0 | ~7 min |
| `roteiro-e2e-ui-completo.mjs` (tela, primeiro login e tempo real) | 26 | 26 | 0 | ~4 min |

Os casos de concorrência (C01 a C05) disparam as duas requisições juntas cinco
vezes cada; basta uma tentativa errada para reprovar.

## Riscos encontrados na análise

Comportamentos que a leitura do código indicou como problema, executados em
27/11/2026. A coluna *Resultado* diz o que a primeira execução mostrou, e
*Correção*, como o defeito foi resolvido no mesmo dia.

| ID | O que o código faz | Por que preocupa | Onde | Resultado | Correção |
| --- | --- | --- | --- | --- | --- |
| V27 | `encerrar_desafio` só distribui o pote se houver ao menos um vencedor. Sem vencedor, marca o desafio como finalizado e o pote fica na conta do desafio | A tela deixa cada participante escolher `VAI_CUMPRIR` ou `NAO_VAI_CUMPRIR` livremente. Se todos escolherem o lado perdedor, o CP sai de circulação e `vw_escrow_orfao` passa a ter linha, o que o projeto trata como bug de contabilidade | `database/scripts/ddl/functions/02-economia.sql`, `encerrar_desafio` | **Confirmado**: 20 CP presos em `vw_escrow_orfao`, desafio `FINALIZADA_CUMPRIU` | `encerrar_desafio` devolve o pote a quem entrou (RN23), migration `RegrasDeEncerramentoECancelamento` |
| D32 | `cancelar_desafio` estorna e marca `CANCELADA`, mas não mexe na evidência `EM_VOTACAO` | O júri continua podendo votar numa evidência de desafio cancelado. Se atingir quórum, `creditar_recompensa_voto` paga 2 CP por votante, e o membro do júri fica impedido de sair do grupo (G25) até o prazo | `02-economia.sql`, `cancelar_desafio`; `Desafio.Cancelar` | **Confirmado**: depois do cancelamento, o voto do jurado deu 200, a prova virou `ACEITA` e 2 CP foram pagos | `cancelar_desafio` expira a prova do júri (RN12), mesma migration |
| C02, C03 | O aceite não captura `DbUpdateException` nem `PostgresException` | Aceite simultâneo no mesmo papel bate em `unq_desafio_papel_unico`. Débito simultâneo além do saldo bate em `chk_membro_saldo`. Os dois devem sair como 500 em vez de 409 | `DesafiosEndpoints.cs`, `POST /{id}/participantes` | **C02 confirmado**: 500 na 5ª tentativa (o esperado era 409). **C03 não se confirmou** em 5 tentativas | O aceite traduz a violação de `unq_desafio_papel_unico`, `unq_participante_desafio` e `chk_membro_saldo` em 409 |
| H01, H02 | `MapHub<VotacaoHub>` sem `RequireAuthorization`, e `EntrarNoGrupo` não confere se quem chama é membro | Qualquer pessoa, mesmo sem login, recebe o placar das votações de qualquer grupo | `Program.cs`; `Shared/Realtime/VotacaoHub.cs` | **Confirmado**: sem token a negociação responde 200 e o WebSocket conecta; um usuário de fora recebeu o placar de outro grupo | `MapHub(...).RequireAuthorization()`; `EntrarNoGrupo` confere se quem chama é membro |
| D25 | O aceite devolve `Forbid()` (403) para Forasteiro | O resto da API devolve 404 para não revelar que o grupo ou o desafio existe | `DesafiosEndpoints.cs` | **Confirmado**: 403 | O aceite devolve 404 para quem não é do grupo |
| P05 | O worker só cancela desafio `ABERTA` vencido | Desafio `EM_ANDAMENTO` cujo Desafiado nunca envia prova fica aberto para sempre, com CP em escrow. Falta regra no documento 08 | `PrazosWorker.cs` | **Confirmado**: desafio continua `EM_ANDAMENTO` com 20 CP em escrow depois do worker | Nova RN30: o `PrazosWorker` encerra como perdido o desafio vencido sem prova no júri; o seed passou a usar prazos relativos |
| V11 | O júri é quem sobra tirando os duelistas, e pode ser vazio | Num grupo de dois, a evidência nasce sem jurados e só pode expirar. Falta regra no documento 08 | `EnviarEvidenciaHandler.CarregarJuri` | **Confirmado**: prova criada com 0 jurados | `EnviarEvidenciaHandler` recusa a prova sem jurados (409 `Evidencia.SemJuri`, RN14) |
| S05 | `/health` chama `CanConnectAsync` sem prazo curto | Com o banco fora, o 503 só chega depois de **121 s**. Um balanceador ou monitor desiste antes e não distingue "banco fora" de "API travada" | `Program.cs`, `/health` | **Encontrado na execução** (não estava na análise) | `/health` com prazo de 5 s: o 503 chega em 5 s |
| F30 | Telas com conteúdo maior que 900 px de altura | A área de conteúdo rola em `/desafios/nova` (146 px), `/grupos/:id` (68 px) e `/perfil` (2 px), contra a regra do redesign desktop | CSS das três telas | **Reprova desde 20/11** (`U11`), para decisão do time | Grupos numa linha em `/desafios/nova`, coluna do filtro mais larga em `/grupos/:id`, rodapé menor: 0 px de rolagem |

Duas observações de regra, que não são defeito de código, para o time decidir:

* **Apostador vota.** A RN14 exclui do júri só o Desafiante e o Desafiado. O
  Apostador julga a prova de um desafio em que tem CP em jogo.
* **Desafiado pode apostar contra si.** Nada impede o Desafiado de escolher
  `NAO_VAI_CUMPRIR`, mandar uma prova ruim de propósito e ganhar o pote.
