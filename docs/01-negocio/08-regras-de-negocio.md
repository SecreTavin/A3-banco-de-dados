# 08 - Regras de Negócio (RN)

Cada regra indica onde é garantida. **Constraint** significa que o banco recusa a
violação; **procedure** ou **trigger** significa que a lógica roda no SGBD;
**aplicação** significa que a garantia é do backend.

## Recompensa e valor

* **RN01 —** Tipo de recompensa restrito a `'MONETARIA'`, `'PRENDA_ACAO'`,
  `'ITEM_MATERIAL'`, `'OUTRO'`.
  *Constraint `chk_aposta_tipo`.*

* **RN02 —** Quando informado, o valor monetário é maior que zero. Este campo é
  **descritivo**: registra o que foi combinado fora do app e nenhum cálculo do
  sistema o utiliza ([ADR 0006](../02-arquitetura/adr/0006-cp-como-moeda.md)).
  *Constraint `chk_aposta_valor`.*

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
  *`BackgroundService` + `apostas.cancelar_aposta`.*

* **RN12 —** Cancelamento exige motivo e estorna o CP de todos os participantes.
  A partir do início da validação, o motivo precisa ser aprovado por ao menos
  metade dos integrantes (`APOSTADOR` não conta para esse quórum).
  *Constraint `chk_aposta_cancelamento` + procedure `apostas.cancelar_aposta`.*

## Evidências

* **RN10 —** No máximo 5 evidências por aposta. Nova evidência só é permitida se
  a anterior foi recusada. A partir de 3 recusadas — ou esgotada a quinta — o
  desafiado perde a aposta.
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

* **RN04 —** Voto único por usuário em cada evidência.
  *Constraint `unq_voto_usuario`.*

* **RN14 —** Validadores são os membros do grupo **exceto** `DESAFIANTE` e
  `DESAFIADO`. O conjunto é **congelado** no momento do envio da evidência: quem
  entra no grupo depois não vota nem conta para o quórum. Sem esse
  congelamento, o resultado de uma aposta mudaria sozinho
  ([ADR 0008](../02-arquitetura/adr/0008-quorum-congelado.md)).
  *Tabela `validador_evidencia` + FK composta em `voto_evidencia`.*

* **RN15 —** Quórum é `floor(n/2) + 1` sobre os validadores congelados. A
  evidência é aceita quando os votos `VALIDO` atingem o quórum, e recusada
  quando os `INVALIDO` o atingem.
  *Procedure `validacao.apurar_votacao`.*

* **RN16 —** Empate mantém a votação aberta. Se o prazo expira sem maioria, a
  evidência é **recusada** — o ônus da prova é de quem a enviou. Prazo expirado
  sem nenhum voto resulta em `'EXPIRADA'`.
  *Procedure `validacao.apurar_votacao`.*

* **RN19 —** Só se vota em evidência `EM_VOTACAO` e dentro do prazo.
  *Trigger `trg_voto_evidencia_valida`.*

## Economia de CP

* **RN06 —** Todo membro entra no grupo com 100 CP, lançados no ledger.
  *Default de `saldo_cp` + trigger `trg_membro_credito_inicial`.*

* **RN08 —** Saldo nunca fica negativo.
  *Constraint `chk_membro_saldo`.*

* **RN18 —** O CP é debitado **no aceite** da aposta e fica retido na conta da
  aposta (escrow) até a resolução. Impede apostar o mesmo CP em várias apostas
  simultâneas.
  *Procedure `economia.debitar_escrow`.*

* **RN17 —** Quem votou numa evidência que atingiu quórum recebe 2 CP. O
  pagamento ocorre na apuração, não por voto individual — pagar por clique
  incentivaria votar sem analisar.
  *Procedure `economia.creditar_recompensa_voto`.*

* **RN23 —** O pote é dividido igualmente entre os participantes que acertaram.
  Como CP é inteiro, o resto da divisão vai para o primeiro vencedor, de modo
  que a soma dos prêmios seja exatamente o pote.
  *Procedure `apostas.encerrar_aposta`.*

* **RN24 —** O ledger é **append-only**: nunca sofre `UPDATE` nem `DELETE`.
  Estorno é lançamento novo. A soma de todos os lançamentos de um grupo é sempre
  `100 × número de membros`.
  *Trigger `trg_transacao_cp_imutavel` + view `vw_reconciliacao_saldo`.*

## Identidade e acesso

* **RN05 —** Autenticação exclusivamente via Google. O sistema não armazena
  senha própria — credenciais ficam em tabela separada, que já comporta login
  por senha no futuro.
  *Constraint `chk_credencial_segredo` + `unq_credencial_provedor`.*

* **RN20 —** Convite de grupo é um código de 6 caracteres alfanuméricos, de uso
  único e com expiração, rastreável até quem convidou. O alfabeto exclui
  caracteres ambíguos (`0`/`O`, `1`/`I`/`L`) porque o código é ditado em voz alta.
  *Tabela `convite_grupo` + constraints `chk_convite_expiracao` e `chk_convite_uso`.*

* **RN25 —** Remoção de membro e edição/exclusão do grupo são restritas a
  `ADMIN`. O criador do grupo é `ADMIN` por padrão. Qualquer usuário pode sair
  do grupo por conta própria.
  *Aplicação.*
