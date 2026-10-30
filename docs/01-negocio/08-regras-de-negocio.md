# 08 - Regras de Negócio (RN)

Cada regra indica onde é garantida. **Constraint** significa que o banco recusa a
violação; **procedure** ou **trigger** significa que a lógica roda no SGBD;
**aplicação** significa que a garantia é do backend.

## Recompensa e valor

* **RN01 —** Tipo de recompensa restrito a `'MONETARIA'`, `'PRENDA_ACAO'`,
  `'ITEM_MATERIAL'`, `'OUTRO'`.
  *Constraint `chk_desafio_tipo`.*

* **RN02 —** Quando informado, o valor monetário é maior que zero. Este campo é
  **descritivo**: registra o que foi combinado fora do app e nenhum cálculo do
  sistema o utiliza ([ADR 0006](../02-arquitetura/adr/0006-cp-como-moeda.md)).
  *Constraint `chk_desafio_valor`.*

* **RN07 —** Todo desafio custa CP, inclusive os de prenda. O valor é fixo por
  participante, igual para todos, definido na criação.
  *Constraint `chk_desafio_valor_cp`.*

## Ciclo de vida do desafio

* **RN03 —** Status restrito a `'ABERTA'`, `'EM_ANDAMENTO'`, `'EM_VOTACAO'`,
  `'FINALIZADA_CUMPRIU'`, `'FINALIZADA_PERDEU'`, `'CANCELADA'`.
  *Constraint `chk_desafio_status`.*

* **RN09 —** Exatamente 1 `DESAFIANTE` e 1 `DESAFIADO` por desafio.
  `APOSTADOR` é livre em quantidade. Um usuário tem um único papel por desafio —
  o `DESAFIADO` já aposta em si mesmo através de `escolha`, então papel duplo
  seria redundante.
  *Índice parcial único `unq_desafio_papel_unico` + `unq_participante_desafio`.*

* **RN21 —** O desafio sai de `ABERTA` para `EM_ANDAMENTO` quando `DESAFIANTE` e
  `DESAFIADO` aceitaram. Desafio que atinge a `data_limite` ainda `ABERTA` é
  cancelada automaticamente — sem isso ela ficaria aberta para sempre.
  *`BackgroundService` + `cancelar_desafio`.*

* **RN12 —** Cancelamento exige motivo e estorna o CP de todos os participantes.
  A partir do início da validação, o motivo precisa ser aprovado por ao menos
  metade dos integrantes (`APOSTADOR` não conta para esse quórum).
  *Constraint `chk_desafio_cancelamento` + procedure `cancelar_desafio`.*

## Evidências

* **RN10 —** No máximo 5 evidências por desafio. Nova evidência só é permitida se
  a anterior foi recusada. A partir de 3 recusadas — ou esgotada a quinta — o
  desafiado perde o desafio.
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
  *Aplicação.* **Estado:** depende do upload direto (RF06), ainda não
  implementado; hoje a evidência é criada com a URL informada pelo desafiado.

## Votação

* **RN04 —** Voto único por usuário em cada evidência.
  *Constraint `unq_voto_usuario`.*

* **RN14 —** Validadores são os membros do grupo **exceto** `DESAFIANTE` e
  `DESAFIADO`. O conjunto é **congelado** no momento do envio da evidência: quem
  entra no grupo depois não vota nem conta para o quórum. Sem esse
  congelamento, o resultado de um desafio mudaria sozinho
  ([ADR 0008](../02-arquitetura/adr/0008-quorum-congelado.md)).
  *Tabela `jurado_evidencia`, chave primária `(id_evidencia, id_usuario)`.*

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

* **RN18 —** O CP é debitado **no aceite** do desafio e fica retido na conta do desafio (escrow) até a resolução. Impede apostar o mesmo CP em vários desafios
  simultâneos.
  *Procedure `debitar_escrow`.*

* **RN17 —** Quem votou numa evidência que atingiu quórum recebe 2 CP. O
  pagamento ocorre na apuração, não por voto individual — pagar por clique
  incentivaria votar sem analisar.
  *Procedure `creditar_recompensa_voto`.*

* **RN23 —** O pote é dividido igualmente entre os participantes que acertaram.
  Como CP é inteiro, o resto da divisão vai para o primeiro vencedor, de modo
  que a soma dos prêmios seja exatamente o pote.
  *Procedure `encerrar_desafio`.*

* **RN24 —** O ledger é **append-only**: nunca sofre `UPDATE` nem `DELETE`.
  Estorno é lançamento novo. A soma de todos os lançamentos de um grupo é sempre
  igual à soma dos saldos dos membros mais o CP retido em desafios
  ([ADR 0018](../02-arquitetura/adr/0018-saida-de-membro-e-invariante-do-ledger.md)).
  *Trigger `trg_transacao_cp_imutavel` + view `vw_reconciliacao_saldo`.*

## Identidade e acesso

* **RN05 —** Autenticação exclusivamente via Google. O sistema não armazena
  senha: a identidade é o e-mail.
  *Constraint `UNIQUE` em `usuario.email`.*

* **RN25 —** Remoção de membro e edição/exclusão do grupo são restritas a
  `ADMIN`. O criador do grupo é `ADMIN` por padrão. Qualquer usuário pode sair
  do grupo por conta própria. A saída ou remoção é **recusada** enquanto o
  membro participa de desafio `ABERTA`, `EM_ANDAMENTO` ou `EM_VOTACAO`, ou
  integra júri de evidência `EM_VOTACAO`. Ao sair, o saldo é zerado por um
  lançamento `SAIDA_GRUPO`
  ([ADR 0018](../02-arquitetura/adr/0018-saida-de-membro-e-invariante-do-ledger.md)).
  *Aplicação (papel `ADMIN`) + procedure `remover_membro`.*

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

* **RN28 —** Toda proposta de desafio é avaliada pela IA de moderação, no nível do
  grupo, antes de ser gravada. Proposta de desafio reprovada não vira desafio; a avaliação (aprovada
  ou não) fica registrada para auditoria.
  *Aplicação + tabela `moderacao_desafio` (`chk_moderacao_motivo`, `chk_moderacao_desafio`).*
