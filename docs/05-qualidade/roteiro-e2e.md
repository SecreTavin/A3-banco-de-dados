# Roteiro completo dos testes de ponta a ponta

Mapa de **todos os caminhos** que o sistema oferece, do ponto de vista de quem
o usa: cada endpoint com cada resposta possível, cada tela com cada estado, as
jornadas completas, os prazos, a concorrência e o tempo real. Cada cenário diz
se já é coberto pelos roteiros do [documento 17](17-testes.md) ou se é lacuna.

Levantado em 27/11/2026, por leitura do código na `main` (`17996e8`):
endpoints, validadores, handlers, domínio, procedures de
`database/scripts/ddl/functions/` e telas de `apps/web/src`. Atualizado no
mesmo dia com o PR #84 (`edd7ceb`): RN29, voto pela tela do desafio e aba
Votação do desafiado. **Nenhum cenário novo foi executado ainda.** Os marcados com ⚠ são comportamentos suspeitos
encontrados na leitura, e só a execução confirma se o problema existe.

## Como ler

| Marca | Significado |
| --- | --- |
| ✅ `E04` | Coberto por um roteiro automatizado (ID do documento 17) |
| ✎ `E19` | Caso escrito no roteiro, ainda não executado |
| ◐ | Conferido à mão em alguma rodada, mas sem roteiro que repita |
| ⬜ | Lacuna: nenhum roteiro exercita |
| ⚠ | Lacuna em que o código sugere um defeito. Detalhes em [Riscos](#riscos-encontrados-na-análise) |

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
documento 17 (T, E, U, I, R). Um ID entre crases na coluna *Situação* é sempre
do documento 17.

---

## 1. Acesso e cadastro

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| A01 | `GET /api/auth/configuracao` sem login | 200 com `googleClientId` | ✅ `E01` | P3 |
| A02 | `POST /api/auth/google` sem Client ID no servidor | 503 | ✅ `E01` | P3 |
| A03 | `POST /api/auth/google` com `credential` vazia | 400 | ⬜ | P2 |
| A04 | `POST /api/auth/google` com token falso | 401 `Auth.GoogleInvalido`, sem sessão | ✅ `E01` | P1 |
| A05 | Token Google válido com e-mail não verificado | 401 `Auth.GoogleInvalido` | ⬜ (precisa de validador simulado) | P2 |
| A06 | Token Google válido de usuário existente | 200 com `token` e `usuario` | ◐ popup manual antes do merge | P1 |
| A07 | Token Google válido de usuário novo | 200 com `cadastroPendente`, `tokenCadastro`, nome e e-mail do Google | ◐ popup manual | P1 |
| A08 | `POST /api/auth/cadastro` com 22 anos | 201, usuário criado | ✅ `E07` | P1 |
| A09 | Cadastro com 12 anos | 422 `Usuario.IdadeMinima`, nada gravado | ✅ `E06` | P1 |
| A10 | Cadastro no limite: 16 anos completos hoje; 16 anos amanhã | Hoje: 201. Amanhã: 422 (RN26) | ⬜ | P2 |
| A11 | Token de cadastro expirado ou adulterado | 401 `Auth.CadastroExpirado` | ⬜ | P2 |
| A12 | Cadastro com e-mail que já tem conta | 409 `Usuario.EmailEmUso` | ⬜ | P2 |
| A13 | Apelido vazio; apelido com 51 caracteres | 400 | ⬜ | P2 |
| A14 | Data de nascimento ausente ou antes de 1900 | 400 | ⬜ | P3 |
| A15 | Apelido igual ao de outro usuário | 201 (apelido não é único) | ⬜ | P3 |
| A16 | `GET /api/auth/dev/usuarios` | 404 (login de desenvolvimento removido) | ✅ `E01`, `U14` | P1 |

## 2. Sessão e segurança transversal

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| S01 | Cada um dos 20 endpoints protegidos chamado sem token | 401 em todos | ⬜ (só `GET /api/midia` em `U15`) | P1 |
| S02 | Token expirado | 401 | ⬜ | P1 |
| S03 | Token assinado com outra chave ou com claims alteradas | 401 | ⬜ | P1 |
| S04 | `GET /health` com banco no ar | 200 `{"status":"ok"}` | ✅ (espera do `roteiro-e2e-ia.mjs`) | P3 |
| S05 | `GET /health` com banco fora | 503 | ⬜ | P3 |

## 3. Grupos

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| G01 | `GET /api/grupos` | Grupos do usuário com saldo, papel e nível | ✅ `E02` | P2 |
| G02 | `GET /api/grupos` de usuário sem grupo | `[]` | ⬜ | P3 |
| G03 | `GET /api/grupos/{id}` como Membro | Cabeçalho, membros com pendências, `desafiosAtivos` | ✅ `U04`, `U12` | P2 |
| G04 | `cpEmJogo` do detalhe | Igual à soma de `vw_cp_em_escrow` do grupo | ⬜ | P2 |
| G05 | `GET /api/grupos/{id}` como Forasteiro | 404, sem revelar que o grupo existe | ⬜ | P1 |
| G06 | `GET /api/grupos/{id}` inexistente | 404 | ⬜ | P3 |
| G07 | `POST /api/grupos` válido | 201; criador `ADMIN` com 100 CP e `CREDITO_INICIAL` (RN06) | ✅ `U03` | P1 |
| G08 | `POST /api/grupos` sem `nivelFiltro` | 201 com `MODERADO` | ⬜ | P3 |
| G09 | `POST /api/grupos` com nome vazio ou só espaços | 400 | ⬜ | P2 |
| G10 | `POST /api/grupos` com nível `EXTREMO` | 400 | ⬜ | P2 |
| G11 | `PATCH .../nivel-filtro` como ADMIN | 200, nível trocado | ✅ `E11`, `I07` | P1 |
| G12 | `PATCH .../nivel-filtro` com valor inválido | 400, nível inalterado | ✅ `E11` | P2 |
| G13 | `PATCH .../nivel-filtro` como Membro | 403 `Grupo.SomenteAdmin` (RN27) | ✅ `E10` | P1 |
| G14 | `PATCH .../nivel-filtro` como Forasteiro | 404 | ⬜ | P2 |
| G15 | `POST .../membros` como ADMIN, e-mail cadastrado | 201; 100 CP no ledger (RN06, RN25) | ✅ `E08`, `U04` | P1 |
| G16 | E-mail com maiúsculas e espaços | Encontra o mesmo usuário | ⬜ | P3 |
| G17 | E-mail sem conta | 404 `Grupo.UsuarioNaoEncontrado` | ⬜ | P2 |
| G18 | E-mail vazio | 400 | ⬜ | P2 |
| G19 | Usuário que já é membro | 409 `Grupo.JaMembro` | ⬜ | P2 |
| G20 | `POST .../membros` como Membro | 403 | ✅ `E09` | P1 |
| G21 | `POST .../membros` como Forasteiro | 404 | ⬜ | P3 |
| G22 | Ex-membro readmitido | Volta com 100 CP; `vw_reconciliacao_saldo` vazia (ADR 0018) | ⬜ (só `T19`, nível 3) | P1 |
| G23 | `DELETE .../membros/{u}` como ADMIN, membro sem pendência | 204; `SAIDA_GRUPO` zera o saldo | ✅ `E15`, `U04` | P1 |
| G24 | Remover membro com desafio em curso | 409 `Grupo.MembroComPendencias` | ✅ `E14` | P1 |
| G25 | Remover membro que está em júri de votação aberta | 409 `Grupo.MembroComPendencias` | ⬜ | P1 |
| G26 | Membro remove a si mesmo (sair do grupo) | 204; `SAIDA_GRUPO` | ⬜ | P1 |
| G27 | Membro remove outro membro | 403 | ⬜ | P1 |
| G28 | Único ADMIN tenta sair com outros membros no grupo | 409 `Grupo.UltimoAdmin` | ⬜ | P1 |
| G29 | Único membro, que é ADMIN, sai | 204; grupo fica sem membros | ⬜ (comportamento a decidir) | P3 |
| G30 | Remover id que não é membro | 404 `Grupo.NaoMembro` | ⬜ | P3 |

## 4. Desafios

### Leitura

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D01 | `GET /api/categorias` | Lista ordenada por nome | ✅ indireto (`U05` carrega a tela de criação) | P3 |
| D02 | `GET /api/desafios` | Só desafios dos grupos do usuário | ✅ `U01` | P1 |
| D03 | `GET /api/desafios?status=ABERTA` | Só abertos | ⬜ | P3 |
| D04 | `GET /api/desafios/{id}` como Membro | Detalhe, participantes, evidências e júri | ✅ `U02` | P2 |
| D05 | RN29: jurado que ainda não votou abre o detalhe com a votação aberta | Sabe quem votou; voto, justificativa e data dos outros vêm nulos | ✎ `E19` | P1 |
| D34 | Desafiado e Desafiante abrem o mesmo detalhe | Veem voto, justificativa e data de cada jurado | ✎ `E19` | P1 |
| D35 | Jurado que já votou abre o detalhe com a votação aberta | Vê os votos de todos | ⬜ (só `I13`, nível 3) | P2 |
| D36 | Votação fechada: jurado que nunca votou abre o detalhe | Vê todos os votos e comentários | ✎ `E21` | P1 |
| D06 | `GET /api/desafios/{id}` como Forasteiro | 404 | ⬜ | P1 |

### Criação (RN27, RN28)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D07 | IA aprova | 201; `ABERTA`; moderação ligada | ✅ `I01` | P1 |
| D08 | IA recusa | 422 com motivo; moderação auditada, sem desafio | ✅ `I02` | P1 |
| D09 | IA com 500, timeout, chave recusada ou resposta sem JSON | 503; nada gravado | ✅ `E12`, `I03` a `I06` | P1 |
| D10 | IA não configurada (`Ia__BaseUrl` vazio) | 503 antes de qualquer chamada | ⬜ | P3 |
| D11 | Título vazio ou com 121 caracteres, descrição vazia, custo 0 ou negativo, prazo passado, tipo de recompensa inválido | 400; a IA não é chamada | ✅ `I08` | P2 |
| D12 | Descrição com 2001 caracteres; `descricaoRecompensa` com 256 | 400 | ⬜ | P3 |
| D13 | Forasteiro cria no grupo | 403 `Desafio.NaoMembroDoGrupo`; a IA não é chamada | ✅ `I09` | P1 |
| D14 | Categoria inexistente | 400 `Desafio.CategoriaInexistente`; a IA não é chamada | ⬜ | P2 |
| D15 | Mesma proposta em `LEVE`, `MODERADO`, `PESADO` | Veredito muda com o nível | ✅ `I07` | P1 |
| D16 | Injeção de prompt no título e na descrição | Marcas neutralizadas | ✅ `I10` | P1 |

### Aceite (RN08, RN09, RN18, RN21)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D17 | Primeiro duelista aceita | Debitado, CP em escrow; continua `ABERTA` | ✅ `E13`, `U06` | P1 |
| D18 | Segundo duelista aceita | `EM_ANDAMENTO` | ✅ `U06` | P1 |
| D19 | Apostador entra enquanto `ABERTA` | Debitado; status inalterado | ⬜ | P1 |
| D20 | Papel `DESAFIADO` já ocupado | 409 `Desafio.PapelJaOcupado`; nada debitado | ⬜ (só `T06`, nível 1) | P1 |
| D21 | Quem já participa aceita de novo, com outro papel | 409 `Desafio.JaParticipa` | ⬜ | P1 |
| D22 | Saldo menor que o custo | 409 `Desafio.SaldoInsuficiente`; saldo intacto | ⬜ | P1 |
| D23 | Aceitar desafio `EM_ANDAMENTO` (apostador atrasado) ou encerrado | 409 `Desafio.NaoAceitaParticipante` | ⬜ | P1 |
| D24 | Papel ou escolha fora do domínio | 400 | ⬜ | P2 |
| D25 | Forasteiro aceita | Esperado 404, como no `GET`. O código devolve 403 | ⚠ | P2 |
| D26 | Desafio inexistente | 404 | ⬜ | P3 |

### Cancelamento (RN12)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| D27 | Criador cancela com participantes | `CANCELADA`; cada um estornado | ✅ `E16` | P1 |
| D28 | Criador cancela `ABERTA` sem participantes | `CANCELADA`; nenhum lançamento | ⬜ | P2 |
| D29 | Motivo vazio | 400 `Desafio.MotivoObrigatorio` | ⬜ | P2 |
| D30 | Quem não é o criador cancela | 403 `Desafio.SomenteCriadorCancela` | ⬜ | P1 |
| D31 | Cancelar desafio já encerrado | 409 `Desafio.JaEncerrado` | ⬜ | P2 |
| D32 | Cancelar `EM_VOTACAO` com evidência em votação | Evidência encerrada junto; o júri não vota mais nem recebe CP | ⚠ | P1 |
| D33 | Desafio inexistente | 404 | ⬜ | P3 |

## 5. Evidência e votação

### Envio (RN10, RN14, RN22)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V01 | Desafiado envia `LINK` | 201; `EM_VOTACAO`; júri congelado sem os duelistas | ✅ `U07` | P1 |
| V02 | Desafiado envia `FOTO` depois do upload | 201; URL `/api/midia/...` | ✅ `U15` | P1 |
| V03 | Desafiado envia `TEXTO` (relato, sem URL) | 201 | ⬜ | P2 |
| V04 | Desafiado envia `VIDEO` | 201 | ⬜ | P3 |
| V05 | Desafiante, Apostador ou Membro envia | 403 `Evidencia.SomenteDesafiadoEnvia` | ⬜ | P1 |
| V06 | Envio em desafio `ABERTA`, `CANCELADA` ou finalizado | 409 `Evidencia.DesafioNaoAceitaEvidencia` | ⬜ | P2 |
| V07 | Envio com evidência anterior ainda em votação | 409 `Evidencia.AnteriorEmVotacao` | ⬜ | P1 |
| V08 | Nova evidência depois de uma `RECUSADA` | 201 com `ordem = 2` e júri novo | ⬜ | P1 |
| V09 | `LINK`, `FOTO` ou `VIDEO` com URL sem `http(s)` | 400 | ⬜ | P2 |
| V10 | Tipo de mídia inválido, URL vazia, URL com 501 caracteres, comentário com 1001 | 400 | ⬜ | P2 |
| V11 | Grupo só com os dois duelistas (júri vazio) | Esperado: definir. O código cria a evidência sem jurados, e ela só expira | ⚠ | P2 |

A sexta evidência (RN10) não é alcançável pela API: a quinta não aceita já
encerra o desafio, e o envio cai em V06. O limite é coberto por `T13`, no
nível 1.

### Júri e voto (RN04, RN14 a RN17, RN19, RN23)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V12 | `GET /api/validacao/pendentes` como Jurado | Evidência listada com placar | ✅ `E03` | P1 |
| V13 | Pendentes como Desafiado ou Desafiante | Não lista a evidência | ⬜ | P1 |
| V14 | Pendentes como Retardatário | Não lista (júri congelado) | ⬜ | P1 |
| V15 | Votos `VALIDO` até o quórum | `ACEITA`; `FINALIZADA_CUMPRIU`; pote aos `VAI_CUMPRIR`; 2 CP por votante | ✅ `E04`, `U08` | P1 |
| V16 | Votos `INVALIDO` até o quórum | `RECUSADA`; 2 CP por votante; desafio continua `EM_VOTACAO` e aceita nova evidência | ⬜ | P1 |
| V17 | Terceira evidência `RECUSADA` | `FINALIZADA_PERDEU`; pote aos `NAO_VAI_CUMPRIR` | ⬜ | P1 |
| V18 | Quinta evidência não aceita, com menos de 3 recusas | `FINALIZADA_PERDEU` | ⬜ | P2 |
| V19 | Empate dentro do prazo | Segue `EM_VOTACAO` (RN16) | ⬜ | P1 |
| V20 | Segundo voto do mesmo jurado | 409 `Evidencia.JaVotou` | ✅ `E05`, `U09` | P1 |
| V21 | Desafiado, Desafiante, Retardatário ou Forasteiro vota | 403 `Evidencia.NaoEhValidador` | ⬜ | P1 |
| V22 | Voto em evidência já decidida | 409 `Evidencia.NaoEstaEmVotacao` | ⬜ (só `T11`, nível 1) | P1 |
| V23 | Voto depois do prazo, antes de o worker apurar | 409 `Evidencia.PrazoExpirado` | ⬜ | P2 |
| V24 | Voto `TALVEZ`; justificativa com 256 caracteres | 400 | ⬜ | P2 |
| V25 | Evidência inexistente | 404 | ⬜ | P3 |
| V26 | Pote que não divide exato (ex.: 3 vencedores, pote de 100) | Primeiro vencedor recebe o resto; soma igual ao pote | ⬜ | P1 |
| V27 | Desafio decidido sem nenhum participante do lado vencedor | Esperado: pote devolvido ou regra definida. O código deixa o pote preso | ⚠ | P1 |

### Provas do desafiado no júri (#83)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| V28 | `GET /api/validacao/minhas-provas` como Desafiado | A própria prova em votação, com placar, quórum e cada jurado com voto e justificativa | ✎ `E20` | P1 |
| V29 | `minhas-provas` como Jurado da mesma prova | Não inclui a prova | ✎ `E20` | P1 |
| V30 | `minhas-provas` sem login | 401 | ✎ `E20` | P2 |
| V31 | `minhas-provas` depois que o júri fecha | A prova sai da lista | ✎ `E21` | P2 |
| V32 | `minhas-provas` de quem não tem prova em votação | `[]` | ⬜ | P3 |

## 6. Foto da prova (ADR 0022)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| M01 | `POST /api/midia` com PNG | 201 com `url` | ✅ `U15` | P1 |
| M02 | JPG e WebP | 201 | ⬜ | P3 |
| M03 | Sem arquivo | 400 "Escolha uma foto." | ⬜ | P3 |
| M04 | Arquivo acima do limite | 400 | ◐ 20/11 | P2 |
| M05 | Texto com extensão `.png` | 400 (tipo pelos primeiros bytes) | ◐ 20/11 | P1 |
| M06 | `GET /api/midia/{nome}` sem login | 401 | ✅ `U15` | P1 |
| M07 | `GET` logado | 200, mesmos bytes, `Cache-Control: private` | ◐ 20/11 | P2 |
| M08 | Nome com `../` ou fora do formato | 404 | ◐ 20/11 | P1 |
| M09 | Nome válido que não existe | 404 | ⬜ | P3 |
| M10 | Forasteiro lê foto de outro grupo pela URL | 200: o ADR 0022 exige só login. Registrar como decisão | ⬜ | P3 |

## 7. Ranking e perfil

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| K01 | `GET /api/ranking/grupos/{id}` como Membro | Ordenado por saldo e acertos | ✅ `E17`, `U10` | P2 |
| K02 | Ranking como Forasteiro | 404 | ✅ `E17` | P1 |
| K03 | Acertos, erros e `cpGanhoEmPremios` depois de um desafio finalizado | Batem com `participante_desafio` e `transacao_cp` | ⬜ | P2 |
| K04 | `GET .../maiores-desafios` como Membro | Top 10 por pote | ⬜ (sem tela) | P3 |
| K05 | `maiores-desafios` como Forasteiro | 404 | ⬜ | P3 |
| K06 | `GET /api/perfil` | Dados e saldo por grupo iguais ao banco | ✅ `U10` | P2 |
| K07 | Extrato do perfil | `saldoApos` do lançamento mais recente igual ao saldo do membro | ⬜ | P2 |
| K08 | Histórico do perfil | Contagens de criados, participações e evidências batem | ⬜ | P3 |

## 8. Telas

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| F01 | `/` sem sessão; `/` logado | `/login`; `/desafios` | ✅ `U13` | P2 |
| F02 | Abrir `/perfil` direto, sem sessão | Vai para `/login` | ⬜ | P1 |
| F03 | Rota inexistente | Vai para `/desafios` | ⬜ | P3 |
| F04 | Login sem Client ID | Aviso de "não configurado", sem usuários do seed | ✅ `U14` | P1 |
| F05 | Primeiro login: formulário de apelido e nascimento | Cadastro conclui e entra | ◐ popup manual | P1 |
| F06 | Cadastro com menos de 16 anos | Mensagem da RN26 na tela | ⬜ | P2 |
| F07 | Sessão expira durante o uso | Volta ao login com "Sessão expirada" | ⬜ | P1 |
| F08 | Lista de desafios | Igual ao banco | ✅ `U01` | P2 |
| F09 | Detalhe do desafio | Título igual ao banco | ✅ `U02` | P2 |
| F10 | Detalhe: papéis já ocupados não aparecem como opção | Só sobra o livre e `APOSTADOR` | ⬜ | P2 |
| F11 | Detalhe: entrar como Apostador | Debitado; aparece na lista | ⬜ | P1 |
| F12 | Detalhe: cancelar como Criador, com motivo | `CANCELADA`; estorno no banco | ⬜ | P1 |
| F13 | Detalhe: quem não é o Criador não vê "Cancelar" | Botão ausente | ⬜ | P1 |
| F14 | Detalhe: enviar evidência `TEXTO` | `EM_VOTACAO` | ⬜ | P2 |
| F15 | Criar desafio: aprovado, recusado, IA fora | Destino e alerta corretos | ✅ `U05`, `I11` a `I13` | P1 |
| F16 | Criar desafio: campos inválidos no formulário | Mensagem por campo; nada enviado | ⬜ | P2 |
| F17 | Criar grupo | Grupo na lista | ✅ `U03` | P2 |
| F18 | Detalhe do grupo: ADMIN troca o nível de filtro | Nível novo no banco | ⬜ | P1 |
| F19 | Detalhe do grupo: Membro não vê ações de ADMIN | Sem adicionar, remover ou trocar nível | ⬜ | P1 |
| F20 | Detalhe do grupo: "Sair do grupo…" e confirmação | Sai; `SAIDA_GRUPO` | ⬜ | P1 |
| F21 | Único ADMIN abre "Sair" | Aviso "o grupo precisa de outro admin" | ⬜ | P2 |
| F22 | Remover membro com pendência | Tela avisa antes; banco recusa se insistir | ⬜ | P2 |
| F23 | Adicionar membro com e-mail sem conta | Alerta com a mensagem da API | ⬜ | P2 |
| F24 | Votação: "Vale" até o quórum | `ACEITA` | ✅ `U08` | P1 |
| F25 | Votação: "Não vale" com motivo | Voto `INVALIDO` com justificativa | ⬜ | P1 |
| F26 | Votação sem pendências | Estado vazio | ⬜ | P3 |
| F27 | Votação ao vivo: outro jurado vota | Placar atualiza sem recarregar | ⬜ | P2 |
| F28 | Ranking com `?grupo=` e troca de grupo | Lista do grupo escolhido | ⬜ | P3 |
| F29 | Perfil: extrato | Igual ao ledger | ⬜ | P3 |
| F30 | Tema persiste e 8 telas sem rolagem em 1440x900 | Sem rolagem vertical | ✅ `U11` (reprovando desde 20/11) | P3 |
| F31 | Celular 390x844 | Sem overflow horizontal | ✅ `U12` | P2 |
| F32 | Botão **A+** de fonte maior persiste ao recarregar | Fonte mantida | ⬜ | P3 |
| F33 | Erros 403 e 409 da API | Viram alerta legível, não tela quebrada | ⬜ | P2 |
| F34 | Detalhe: Jurado pendente vê "Você está no júri desta prova" e vota **Vale** com comentário | Voto e justificativa gravados | ✎ `U16` | P1 |
| F35 | Detalhe: outro Jurado pendente abre a mesma prova | Aviso de que os votos aparecem depois do dele; comentário ausente (RN29) | ✎ `U16` | P1 |
| F36 | Detalhe: Desafiado abre a prova | Vê o voto e o comentário | ✎ `U16` | P2 |
| F37 | Detalhe: voto **Não vale** com motivo pela tela do desafio | Voto `INVALIDO` gravado | ⬜ | P2 |
| F38 | Detalhe: Desafiante ou Membro fora do júri | Não vê os botões de voto | ⬜ | P2 |
| F39 | Votação: Desafiado vê "Suas provas no júri" | Placar igual ao banco, comentário do jurado, sem botão de voto (RN14) | ✎ `U17` | P1 |
| F40 | Votação: um jurado vota enquanto o Desafiado está na aba | Placar da prova dele atualiza sem recarregar | ⬜ | P3 |

## 9. Jornadas completas

Encadeiam vários cenários e terminam conferindo a contabilidade (J10).

| ID | Jornada | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| J01 | Criar → dois duelistas → evidência → quórum `VALIDO` | Pote aos `VAI_CUMPRIR` | ✅ `U03` a `U08` | P1 |
| J02 | J01 com apostadores dos dois lados | Só os acertadores dividem o pote (RN23) | ⬜ | P1 |
| J03 | Três evidências recusadas | `FINALIZADA_PERDEU`; pote aos `NAO_VAI_CUMPRIR` | ⬜ | P1 |
| J04 | Primeira evidência recusada, segunda aceita | `FINALIZADA_CUMPRIU`; votantes das duas recebem 2 CP | ⬜ | P1 |
| J05 | Evidência sem nenhum voto até o prazo | `EXPIRADA`; ninguém recebe 2 CP | ⬜ | P1 |
| J06 | Evidência com votos, sem maioria, até o prazo | `RECUSADA`; votantes recebem 2 CP | ⬜ | P1 |
| J07 | Desafio `ABERTA` vence sem os dois duelistas | Worker cancela e estorna quem entrou | ⬜ | P1 |
| J08 | Usuário novo: Google → cadastro → convite → aceite | Entra com 100 CP e aceita | ◐ partes em `E06` a `E08` | P2 |
| J09 | Membro sai e é readmitido | 100 CP novos; reconciliação fecha | ⬜ | P1 |
| J10 | Ao fim de cada jornada | `vw_reconciliacao_saldo` e `vw_escrow_orfao` vazias | ✅ `E18`, `U08`, `I14` | P1 |

## 10. Prazos (`PrazosWorker`)

O worker roda ao subir a API e depois a cada 5 minutos. Para testar sem
esperar: mova o prazo para o passado por SQL e reinicie o contêiner da API
(`docker compose restart api`).

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| P01 | Evidência vencida sem votos | `EXPIRADA` | ⬜ | P1 |
| P02 | Evidência vencida com votos e sem maioria | `RECUSADA`; 2 CP por votante | ⬜ | P1 |
| P03 | Terceira não aceita por prazo | `FINALIZADA_PERDEU` | ⬜ | P1 |
| P04 | Desafio `ABERTA` vencido | `CANCELADA` com motivo de prazo; estorno | ⬜ | P1 |
| P05 | Desafio `EM_ANDAMENTO` com prazo vencido e sem evidência | Esperado: definir. Hoje nada acontece e o CP fica em escrow | ⚠ | P2 |
| P06 | Worker roda duas vezes sobre o mesmo item | Nada muda na segunda (procedures idempotentes) | ⬜ | P2 |

## 11. Concorrência

Duas requisições disparadas juntas (`Promise.all` no roteiro).

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| C01 | Dois votos que completam o quórum | Uma apuração; pote e 2 CP pagos uma vez só | ⬜ | P1 |
| C02 | Dois aceites no mesmo papel | Um 200, outro 409. O código não trata a violação de unicidade, e o provável é 500 | ⚠ | P1 |
| C03 | Dois aceites de desafios diferentes com saldo para um só | Um debitado, outro 409; saldo nunca negativo | ⚠ (provável 500) | P1 |
| C04 | Dois envios de evidência no mesmo desafio | Um 201, outro 409 `Evidencia.AnteriorEmVotacao` | ⬜ | P2 |
| C05 | Dois cadastros com o mesmo e-mail | Um 201, outro 409 | ⬜ | P3 |

## 12. Tempo real (`/hubs/votacao`)

| ID | Cenário | Resultado esperado | Situação | P |
| --- | --- | --- | --- | --- |
| H01 | Conectar ao hub sem token | Recusado | ⚠ | P1 |
| H02 | Logado, `EntrarNoGrupo` de grupo alheio | Recusado | ⚠ | P1 |
| H03 | Voto registrado | `VotacaoAtualizada` chega depois do commit, com o placar do banco | ⬜ | P2 |
| H04 | Voto que encerra o desafio | `DesafioEncerrado` com o status final | ⬜ | P2 |

---

## Resumo

| Área | Cenários | ✅ | ✎ | ◐ | ⬜ | ⚠ |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Acesso e cadastro | 16 | 6 | 0 | 2 | 8 | 0 |
| 2. Sessão e segurança | 5 | 1 | 0 | 0 | 4 | 0 |
| 3. Grupos | 30 | 10 | 0 | 0 | 20 | 0 |
| 4. Desafios | 36 | 13 | 3 | 0 | 18 | 2 |
| 5. Evidência e votação | 32 | 5 | 4 | 0 | 21 | 2 |
| 6. Foto da prova | 10 | 2 | 0 | 4 | 4 | 0 |
| 7. Ranking e perfil | 8 | 3 | 0 | 0 | 5 | 0 |
| 8. Telas | 40 | 9 | 4 | 1 | 26 | 0 |
| 9. Jornadas | 10 | 2 | 0 | 1 | 7 | 0 |
| 10. Prazos | 6 | 0 | 0 | 0 | 5 | 1 |
| 11. Concorrência | 5 | 0 | 0 | 0 | 3 | 2 |
| 12. Tempo real | 4 | 0 | 0 | 0 | 2 | 2 |
| **Total** | **202** | **51** | **11** | **8** | **123** | **9** |

Cobertos por roteiro já executado: **51 de 202 (25%)**. Com os 11 casos do
PR #84 escritos e ainda não executados (E19 a E21, U16, U17): 62 (31%).
Somando os conferidos à mão: 70 (35%). O número é menor que os 96% de endpoints do documento 17 porque aqui
cada resposta possível conta separado. Um endpoint chamado uma vez, no caminho
feliz, conta como coberto lá, e aqui só cobre um dos seus cenários.

### Ordem sugerida de implementação

1. **Os 9 ⚠.** Rodar primeiro, porque podem ser defeitos reais. Se o defeito
   se confirmar, abrir issue e corrigir antes da banca.
2. **P1 de dinheiro**, em `roteiro-e2e.py` (API e banco, sem navegador):
   D19 a D23, D30, V16, V17, V19, V21, V26, J02 a J07, J09, P01 a P04 e C01.
3. **P1 de permissão e visibilidade**, também na API: S01 a S03, G05, G25 a
   G28, D06, V05, V13, V14 e V22.
4. **P1 de tela**, em `roteiro-e2e-ui.mjs`: F02, F07, F11 a F13, F18 a F20 e
   F25.
5. P2 e P3 conforme sobrar tempo.

## Riscos encontrados na análise

Comportamentos que a leitura do código indica como problema. **Nenhum foi
executado.** Cada um vira caso de teste, e só o resultado confirma ou descarta.

| ID | O que o código faz | Por que preocupa | Onde |
| --- | --- | --- | --- |
| V27 | `encerrar_desafio` só distribui o pote se houver ao menos um vencedor. Sem vencedor, marca o desafio como finalizado e o pote fica na conta do desafio | A tela deixa cada participante escolher `VAI_CUMPRIR` ou `NAO_VAI_CUMPRIR` livremente. Se todos escolherem o lado perdedor, o CP sai de circulação e `vw_escrow_orfao` passa a ter linha, o que o projeto trata como bug de contabilidade | `database/scripts/ddl/functions/02-economia.sql`, `encerrar_desafio` |
| D32 | `cancelar_desafio` estorna e marca `CANCELADA`, mas não mexe na evidência `EM_VOTACAO` | O júri continua podendo votar numa evidência de desafio cancelado. Se atingir quórum, `creditar_recompensa_voto` paga 2 CP por votante, e o membro do júri fica impedido de sair do grupo (G25) até o prazo | `02-economia.sql`, `cancelar_desafio`; `Desafio.Cancelar` |
| C02, C03 | O aceite não captura `DbUpdateException` nem `PostgresException` | Aceite simultâneo no mesmo papel bate em `unq_desafio_papel_unico`. Débito simultâneo além do saldo bate em `chk_membro_saldo`. Os dois devem sair como 500 em vez de 409 | `DesafiosEndpoints.cs`, `POST /{id}/participantes` |
| H01, H02 | `MapHub<VotacaoHub>` sem `RequireAuthorization`, e `EntrarNoGrupo` não confere se quem chama é membro | Qualquer pessoa, mesmo sem login, recebe o placar das votações de qualquer grupo | `Program.cs`; `Shared/Realtime/VotacaoHub.cs` |
| D25 | O aceite devolve `Forbid()` (403) para Forasteiro | O resto da API devolve 404 para não revelar que o grupo ou o desafio existe | `DesafiosEndpoints.cs` |
| P05 | O worker só cancela desafio `ABERTA` vencido | Desafio `EM_ANDAMENTO` cujo Desafiado nunca envia prova fica aberto para sempre, com CP em escrow. Falta regra no documento 08 | `PrazosWorker.cs` |
| V11 | O júri é quem sobra tirando os duelistas, e pode ser vazio | Num grupo de dois, a evidência nasce sem jurados e só pode expirar. Falta regra no documento 08 | `EnviarEvidenciaHandler.CarregarJuri` |

Duas observações de regra, que não são defeito de código, para o time decidir:

* **Apostador vota.** A RN14 exclui do júri só o Desafiante e o Desafiado. O
  Apostador julga a prova de um desafio em que tem CP em jogo.
* **Desafiado pode apostar contra si.** Nada impede o Desafiado de escolher
  `NAO_VAI_CUMPRIR`, mandar uma prova ruim de propósito e ganhar o pote.
