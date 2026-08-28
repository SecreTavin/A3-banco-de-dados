# 23 - Tela: Meus Grupos

## Objetivo
Gestão de grupos privados de amigos (RF02).

## Seções principais
- **Lista de grupos:** nome, descrição, nº de membros
- **Criar grupo:** nome, descrição
- **Entrar em grupo:** via link de convite
- **Detalhe do grupo:** lista de membros (com papel `ADMIN`/`MEMBRO`), apostas do grupo

## Dados (origem: `grupo_amigos`, `membro_grupo`)
`nome`, `descricao`, `id_criador`, `data_criacao` / `papel`, `data_entrada`

## Decisões (validado com o time)
- Convite: link com expiração, contendo um código de 6 caracteres alfanuméricos (letras e números).
- Remoção de membro: qualquer `ADMIN` pode remover (o criador do grupo já é `ADMIN` por padrão).
- Edição/exclusão do grupo: restrita a `ADMIN`/criador.
- Usuário pode sair do grupo por conta própria.

## TODOs para validação com o time
- [ ] Schema não tem tabela/coluna para o link/código de convite — falta modelar (ex: tabela `convite_grupo` com código, expiração e grupo).
