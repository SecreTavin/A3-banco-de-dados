# 22 - Tela: Autenticação

## Objetivo
Cadastro e login de usuários (RF01).

## Seções principais
- **Login:** email, senha
- **Cadastro:** nome, email, apelido, senha

## Dados (origem: `usuario`)
`nome`, `email` (UNIQUE), `apelido`, `senha_hash`, `data_cadastro`

## TODOs para validação com o time
- [ ] Recuperação de senha não está nos RF — entra no escopo do MVP?
- [ ] `apelido` não é UNIQUE no schema — pode repetir entre usuários? Se não, falta constraint.
- [ ] Regras de validação de senha (tamanho mínimo, formato)?
- [ ] Login social (Google etc.) está fora de escopo — confirmar.
