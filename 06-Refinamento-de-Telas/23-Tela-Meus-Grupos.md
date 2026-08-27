# 23 - Tela: Meus Grupos

## Objetivo
Gestão de grupos privados de amigos (RF02).

## Seções principais
- **Lista de grupos:** nome, descrição, nº de membros
- **Criar grupo:** nome, descrição
- **Detalhe do grupo:** lista de membros (com papel `ADMIN`/`MEMBRO`), apostas do grupo

## Dados (origem: `grupo_amigos`, `membro_grupo`)
`nome`, `descricao`, `id_criador`, `data_criacao` / `papel`, `data_entrada`

## TODOs para validação com o time
- [ ] Mecanismo de convite não descrito nos RF — link de convite? aprovação do admin? busca por apelido/email?
- [ ] Quem pode remover um membro (só `ADMIN`, ou o próprio criador)?
- [ ] Grupo pode ser editado/excluído? Por quem?
- [ ] Usuário pode sair do grupo por conta própria?
