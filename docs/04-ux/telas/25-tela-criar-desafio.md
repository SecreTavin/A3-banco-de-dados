# 25 - Tela: Criar Desafio

## Objetivo
Criação de um novo desafio (RF03, RF04, RF05).

## Seções principais
- **Dados básicos:** título, descrição, grupo, categoria (lista fixa, sem tela própria de gestão)
- **Custo em CP:** `valor_cp` — campo obrigatório, valor fixo por participante (RN07)
- **Recompensa:** tipo (`MONETARIA`/`PRENDA_ACAO`/`ITEM_MATERIAL`/`OUTRO`), descrição do que foi combinado (RN01, RN02)
- **Prazo:** `data_limite` (sem prazo mínimo/máximo)
- **Participantes:** seleção de membros do grupo, papel (`DESAFIANTE`/`DESAFIADO`/`APOSTADOR`) e escolha inicial (`VAI_CUMPRIR`/`NAO_VAI_CUMPRIR`)
- **Moderação:** antes de criar, a IA avalia título e descrição no nível de filtro do grupo; proposta reprovada não vira desafio e mostra o motivo (RN28)

## Dados (origem: `desafio`, `participante_desafio`, `categoria_desafio`, `membro_grupo`)
`titulo`, `descricao`, `valor_cp`, `tipo_recompensa`, `valor_monetario`, `descricao_prenda`, `data_limite` / `papel_desafio`, `escolha` / `nome` (categoria) / `saldo_cp` (para checar se o usuário tem CP suficiente)

## Decisões (validado com o time)
- Participantes por papel: exatamente 1 `DESAFIANTE` e 1 `DESAFIADO` por desafio; `APOSTADOR` é livre em quantidade.
- Desafio não é editável após criado — só pode ser cancelado, com motivo obrigatório.
- `data_limite` não tem prazo mínimo/máximo; a contagem do desafio só começa a valer quando o quórum é atingido.
- Categoria é uma lista fixa/constante — não há tela de gestão de categorias.

## Resolvido na arquitetura
- **Limite de 1 `DESAFIANTE`/1 `DESAFIADO` não garantido no banco (TODO anterior):** garantido agora pelo **índice parcial único** `unq_desafio_papel_unico` sobre `(id_desafio, papel_desafio)` `WHERE papel_desafio IN ('DESAFIANTE','DESAFIADO')` — permite N `APOSTADOR` e no máximo um de cada papel único (RN09).
- **`UNIQUE(id_desafio, id_usuario)` impedindo papel duplo (TODO anterior):** a **regra mudou** em vez do schema. Um usuário tem **um único papel por desafio**: o `DESAFIADO` já aposta em si mesmo através do campo `escolha`, o que torna o papel duplo (`DESAFIADO` + `APOSTADOR`) redundante. Por isso `unq_participante_desafio` foi **mantida** (RN09).
- **Custo em CP obrigatório:** a tela ganhou o campo `valor_cp`, obrigatório e igual para todos os participantes, com `CHECK (valor_cp > 0)` (`chk_desafio_valor_cp`, RN07). Todo desafio custa CP — inclusive os de prenda.
- **`valor_monetario` virou descritivo:** registra apenas o que foi combinado fora do app; nenhum cálculo do sistema lê essa coluna. O CP é a moeda única ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md), RN02).
- **Débito no aceite:** o CP não é debitado na criação. Ao **aceitar** o desafio, o valor é debitado do `saldo_cp` do membro e fica retido na conta do desafio (escrow), até a resolução — o que impede apostar o mesmo CP em vários desafios simultâneos (RN18, procedure `debitar_escrow`, [ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)).

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
