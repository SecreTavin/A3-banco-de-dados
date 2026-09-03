# 23 - Tela: Meus Grupos

## Objetivo
Gestão de grupos privados de amigos (RF02).

## Seções principais
- **Lista de grupos:** nome, descrição, nº de membros, meu saldo de CP no grupo
- **Criar grupo:** nome, descrição
- **Entrar em grupo:** digitando o código de convite de 6 caracteres
- **Detalhe do grupo:** lista de membros (com papel `ADMIN`/`MEMBRO` e saldo de CP), apostas do grupo
- **Gerar convite:** código com prazo de expiração, visível para quem pode convidar

## Dados (origem: `grupos.grupo_amigos`, `grupos.membro_grupo`, `grupos.convite_grupo`)
`nome`, `descricao`, `id_criador`, `data_criacao` / `papel`, `saldo_cp`, `data_entrada` / `codigo`, `data_expiracao`, `id_usado_por`, `data_uso`

## Decisões (validado com o time)
- Convite: código de 6 caracteres alfanuméricos com expiração.
- Remoção de membro: qualquer `ADMIN` pode remover (o criador do grupo já é `ADMIN` por padrão).
- Edição/exclusão do grupo: restrita a `ADMIN`/criador.
- Usuário pode sair do grupo por conta própria.

## Resolvido na arquitetura
- **Falta de tabela para o convite (TODO anterior):** modelada a tabela `grupos.convite_grupo`, com `codigo CHAR(6) UNIQUE`, `data_expiracao`, e `id_usado_por`/`data_uso` — o convite é de **uso único e rastreável** até quem convidou e quem usou. As constraints `chk_convite_expiracao` (expiração sempre posterior à criação) e `chk_convite_uso` (ou os dois campos de uso preenchidos, ou nenhum) garantem isso no banco (RN20).
- **Alfabeto do código:** exclui caracteres ambíguos (`0`/`O`, `1`/`I`/`L`), porque na prática o código é ditado em voz alta entre amigos.
- **Escopo do convite:** o **link** de convite saiu de escopo — só existe o código, digitado na tela "Entrar em grupo". Isso remove a necessidade de deep link e de página pública de aceite no MVP.
- **Saldo de CP na tela:** `grupos.membro_grupo.saldo_cp` é exibido tanto na lista de grupos (meu saldo) quanto na lista de membros. Todo membro entra com 100 CP (RN06) e o saldo nunca fica negativo (RN08); a fonte da verdade é o ledger `economia.transacao_cp` ([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)).

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
