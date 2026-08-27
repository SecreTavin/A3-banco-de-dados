# 29 - Tela: Perfil

## Objetivo
Dados do usuário e histórico pessoal. Não é um RF explícito — implícita pela existência da tabela `usuario` e pela necessidade de navegação.

## Seções principais
- **Dados do usuário:** nome, apelido, email, data de cadastro
- **Histórico:** apostas criadas, participações, evidências enviadas

## Dados (origem: `usuario`, `aposta`, `participante_aposta`, `evidencia`)
`nome`, `apelido`, `email`, `data_cadastro`

## TODOs para validação com o time
- [ ] Confirmar se esta tela entra no escopo do MVP (não está nos RF01-RF08).
- [ ] Schema não tem campo de foto/avatar — precisa? Se sim, falta coluna.
- [ ] Edição de dados do perfil (nome, apelido, senha) faz parte desta tela?
