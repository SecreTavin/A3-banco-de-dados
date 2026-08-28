# 29 - Tela: Perfil

## Objetivo
Dados do usuário e histórico pessoal. Confirmado no escopo do MVP.

## Seções principais
- **Dados do usuário:** nome, apelido, email, avatar/foto, data de cadastro
- **Edição de perfil:** nome, apelido, avatar/foto
- **Histórico:** apostas criadas, participações, evidências enviadas

## Dados (origem: `usuario`, `aposta`, `participante_aposta`, `evidencia`)
`nome`, `apelido`, `email`, `data_cadastro`

## Decisões (validado com o time)
- Tela entra no escopo do MVP.
- Avatar/foto é necessário.
- Edição de perfil (nome, apelido, avatar) faz parte desta tela.

## TODOs para validação com o time
- [ ] Schema (`usuario`) não tem coluna de avatar/foto — falta adicionar (ex: `avatar_url`).
