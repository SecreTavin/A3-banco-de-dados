# 22 - Tela: Autenticação

## Objetivo
Cadastro e login de usuários via Google (RF01).

## Seções principais
- **Login:** OAuth com Google — sem senha própria no app
- **Cadastro:** nome e email vêm do Google; usuário só define o `apelido` no primeiro acesso

## Dados (origem: `usuario`)
`nome`, `email` (UNIQUE), `apelido`, `data_cadastro`

## Decisões (validado com o time)
- Login é exclusivamente via Google — recuperação de senha e regras de validação de senha saem de escopo (não existe senha própria no sistema).
- `apelido` não precisa ser UNIQUE (pode repetir entre usuários); a distinção entre contas passa a ser feita pelo `email`/id do Google, não pelo apelido.

## TODOs para validação com o time
- [ ] Schema (`usuario`) ainda tem `senha_hash` obrigatório — atualizar para o fluxo Google (remover coluna ou guardar id do provedor no lugar).
