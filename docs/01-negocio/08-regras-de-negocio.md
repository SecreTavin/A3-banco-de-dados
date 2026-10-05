# 08 - Regras de Negócio (RN)

Cada regra indica onde é garantida. **Constraint** significa que o banco recusa a
violação; **procedure** ou **trigger** significa que a lógica roda no SGBD;
**aplicação** significa que a garantia é do backend.

## Recompensa e valor

* **RN01 —** Tipo de recompensa restrito a `'MONETARIA'`, `'PRENDA_ACAO'`,
  `'ITEM_MATERIAL'`, `'OUTRO'`.
  *Constraint `chk_aposta_tipo`.*

* **RN02 —** O que foi combinado fora do app (valor em dinheiro, prenda, item)
  fica em `descricao_recompensa`, texto livre e opcional. O campo é
  **descritivo**: nenhum cálculo do sistema o utiliza
  ([ADR 0006](../02-arquitetura/adr/0006-cp-como-moeda.md)).
  *Coluna `aposta.descricao_recompensa`.*

* **RN07 —** Toda aposta custa CP, inclusive as de prenda. O valor é fixo por
  participante, igual para todos, definido na criação.
  *Constraint `chk_aposta_valor_cp`.*

## Ciclo de vida da aposta

* **RN03 —** Status restrito a `'ABERTA'`, `'EM_ANDAMENTO'`, `'EM_VOTACAO'`,
  `'FINALIZADA_CUMPRIU'`, `'FINALIZADA_PERDEU'`, `'CANCELADA'`.
  *Constraint `chk_aposta_status`.*

* **RN09 —** Exatamente 1 `DESAFIANTE` e 1 `DESAFIADO` por aposta.
  `APOSTADOR` é livre em quantidade. Um usuário tem um único papel por aposta —
  o `DESAFIADO` já aposta em si mesmo através de `escolha`, então papel duplo
  seria redundante.
  *Índice parcial único `unq_aposta_papel_unico` + `unq_participante_aposta`.*

* **RN21 —** A aposta sai de `ABERTA` para `EM_ANDAMENTO` quando `DESAFIANTE` e
  `DESAFIADO` aceitaram. Aposta que atinge a `data_limite` ainda `ABERTA` é
  cancelada automaticamente — sem isso ela ficaria aberta para sempre.
  *`BackgroundService` + `cancelar_aposta`.*

* **RN12 —** Cancelamento exige motivo e estorna o CP de todos os participantes.
  A partir do início da validação, o motivo precisa ser aprovado por ao menos
  metade dos integrantes (`APOSTADOR` não conta para esse quórum).
  *Constraint `chk_aposta_cancelamento` + procedure `cancelar_aposta`.*

## Evidências

* **RN10 —** No máximo 5 evidências por aposta. Nova evidência só é permitida se
  a anterior foi recusada. A partir de 3 recusadas — ou esgotada a quinta — o
  desafiado perde a aposta. Prova barrada pela triagem de IA (RN29) não vira
  evidência e não conta para esse limite.
  *Constraints `chk_evidencia_ordem` e `unq_evidencia_ordem` + procedure de apuração.*

* **RN11 —** Cada evidência tem prazo de votação de 1 semana, gravado em coluna
  explícita (`data_limite_votacao`) e não derivado — permite prorrogar sem
  alterar código.
  *Constraint `chk_evidencia_votacao`.*

* **RN13 —** Toda evidência tem status: `'EM_VOTACAO'`, `'ACEITA'`, `'RECUSADA'`
  ou `'EXPIRADA'`, escrito pela procedure de apuração.
  *Constraint `chk_evidencia_status`.*

* **RN22 —** A linha em `evidencia` só é criada após o upload do arquivo ser
  confirmado pelo storage. Registrar antes deixaria o júri votando em
  evidência inexistente ([ADR 0009](../02-arquitetura/adr/0009-armazenamento-de-midia-r2.md)).
  *Aplicação.*

## Votação

* **RN04 —** Voto único por usuário em cada evidência, e definitivo.
  *PK `pk_jurado_evidencia (id_evidencia, id_usuario)` + trigger
  `trg_jurado_evidencia_valida`, que recusa alterar um voto já registrado.*

* **RN14 —** Validadores são os membros do grupo **exceto** `DESAFIANTE` e
  `DESAFIADO`. O conjunto é **congelado** no momento do envio da evidência: quem
  entra no grupo depois não vota nem conta para o quórum. Sem esse
  congelamento, o resultado de uma aposta mudaria sozinho
  ([ADR 0008](../02-arquitetura/adr/0008-quorum-congelado.md)).
  *Tabela `jurado_evidencia`: só vota quem tem linha nela (PK), e o trigger
  `trg_jurado_evidencia_valida` recusa incluir no júri o `DESAFIANTE` ou o
  `DESAFIADO`.*

* **RN15 —** Quórum é `floor(n/2) + 1` sobre os validadores congelados. A
  evidência é aceita quando os votos `VALIDO` atingem o quórum, e recusada
  quando os `INVALIDO` o atingem.
  *Procedure `apurar_votacao`.*

* **RN16 —** Empate mantém a votação aberta. Se o prazo expira sem maioria, a
  evidência é **recusada** — o ônus da prova é de quem a enviou. Prazo expirado
  sem nenhum voto resulta em `'EXPIRADA'`.
  *Procedure `apurar_votacao`.*

* **RN19 —** Só se vota em evidência `EM_VOTACAO` e dentro do prazo.
  *Trigger `trg_jurado_evidencia_valida`.*

## Economia de CP

* **RN06 —** Todo membro entra no grupo com 100 CP, lançados no ledger.
  *Default de `saldo_cp` + trigger `trg_membro_credito_inicial`.*

* **RN08 —** Saldo nunca fica negativo.
  *Constraint `chk_membro_saldo`.*

* **RN18 —** O CP é debitado **no aceite** da aposta e fica retido na conta da
  aposta (escrow) até a resolução. Impede apostar o mesmo CP em várias apostas
  simultâneas.
  *Procedure `debitar_escrow`.*

* **RN17 —** Quem votou numa evidência que atingiu quórum recebe 2 CP. O
  pagamento ocorre na apuração, não por voto individual — pagar por clique
  incentivaria votar sem analisar.
  *Procedure `creditar_recompensa_voto`.*

* **RN23 —** O pote é dividido igualmente entre os participantes que acertaram.
  Como CP é inteiro, o resto da divisão vai para o primeiro vencedor, de modo
  que a soma dos prêmios seja exatamente o pote.
  *Procedure `encerrar_aposta`.*

* **RN24 —** O ledger é **append-only**: nunca sofre `UPDATE` nem `DELETE`.
  Estorno é lançamento novo. O saldo materializado de cada membro é sempre a
  soma dos lançamentos dele no grupo.
  *Trigger `trg_transacao_cp_imutavel` + view `vw_reconciliacao_saldo`.*

## Identidade e acesso

* **RN05 —** Autenticação exclusivamente via Google. O sistema não armazena
  senha: a identidade é o e-mail.
  *Constraint `UNIQUE` em `usuario.email`.*

* **RN25 —** Adição e remoção de membro e edição/exclusão do grupo são
  restritas a `ADMIN`; o `ADMIN` adiciona um usuário já cadastrado pelo e-mail.
  O criador do grupo é `ADMIN` por padrão. Qualquer usuário pode sair do grupo
  por conta própria. Ninguém sai (nem é removido) enquanto participa de aposta
  em curso ou integra júri de votação aberta, e o único `ADMIN` não sai
  enquanto houver outros membros. Ao sair, o saldo deixa de circular no grupo:
  um lançamento `SAIDA_GRUPO` zera a conta, preservando o histórico, e quem
  voltar recomeça com 100 CP.
  *Aplicação (papel) + procedure `remover_membro` (pendências e lançamento de saída).*

## Idade mínima e moderação de conteúdo

Exigência levantada pelo professor orientador na revisão da Entrega 1 (RT01,
11/09/2026): o tom de "zoeira" do app não pode se traduzir em desafio com
risco real à integridade física ou à reputação de um usuário. Decisão de
produto e alternativas consideradas em
[ADR 0015](../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md).

* **RN26 —** Idade mínima de 16 anos para usar o app, calculada a partir da
  data de nascimento informada no cadastro. Usuário abaixo disso não é
  criado.
  *Trigger `trg_usuario_idade_minima` + aplicação (`Usuario.Criar`).*

* **RN27 —** Cada grupo tem um nível de filtro de moderação de IA —
  `LEVE`, `MODERADO` ou `PESADO`, padrão `MODERADO` — configurável apenas
  pelo `ADMIN` do grupo, na criação ou depois.
  *Constraint `chk_grupo_nivel_filtro` + aplicação.*

* **RN28 —** Todo desafio é avaliado pela IA de moderação, no nível do grupo,
  antes de ser gravado. Desafio reprovado não é criado; a avaliação (aprovada
  ou não) fica registrada para auditoria. IA indisponível impede a criação —
  nunca há aprovação sem avaliação.
  *Aplicação + tabela `moderacao_desafio` (`chk_moderacao_motivo`, `chk_moderacao_aposta`).*

* **RN29 —** Toda prova passa por triagem de IA antes de ir ao júri. A IA
  recusa só a prova que claramente não comprova o desafio (imagem sem relação,
  ilegível ou imprópria); prova recusada não vira evidência e pode ser
  reenviada. A aprovada vai ao júri com o parecer da IA, que é **consultivo**:
  quem decide é o júri (RN15). Toda verificação fica registrada.
  *Aplicação + tabela `verificacao_evidencia` (`chk_verificacao_evidencia`) —
  [ADR 0017](../02-arquitetura/adr/0017-ia-propria-e-verificacao-de-prova.md).*
