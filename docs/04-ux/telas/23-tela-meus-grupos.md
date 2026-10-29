# 23 - Tela: Meus Grupos

## Objetivo
Gestão de grupos privados de amigos (RF02).

## Seções principais
- **Lista de grupos:** nome, descrição, nº de membros, meu saldo de CP no grupo
- **Criar grupo:** nome, descrição
- **Adicionar membro:** o `ADMIN` adiciona ao grupo um usuário já cadastrado
- **Detalhe do grupo:** lista de membros (com papel `ADMIN`/`MEMBRO` e saldo de CP), desafios do grupo
- **Nível de filtro:** `LEVE`/`MODERADO`/`PESADO`, alterável só pelo `ADMIN` (RN27)

## Dados (origem: `grupo_amigos`, `membro_grupo`)
`nome`, `descricao`, `id_criador`, `nivel_filtro`, `data_criacao` / `papel`, `saldo_cp`, `data_entrada`

## Decisões (validado com o time)
- Remoção de membro: qualquer `ADMIN` pode remover (o criador do grupo já é `ADMIN` por padrão).
- Edição/exclusão do grupo: restrita a `ADMIN`/criador.
- Usuário pode sair do grupo por conta própria.

## Resolvido na arquitetura
- **Saldo de CP na tela:** `grupos.membro_grupo.saldo_cp` é exibido tanto na lista de grupos (meu saldo) quanto na lista de membros. Todo membro entra com 100 CP (RN06) e o saldo nunca fica negativo (RN08); a fonte da verdade é o ledger `transacao_cp` ([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)).

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
