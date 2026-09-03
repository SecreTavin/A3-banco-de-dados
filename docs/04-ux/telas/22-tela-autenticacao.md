# 22 - Tela: Autenticação

## Objetivo
Cadastro e login de usuários via Google (RF01).

## Seções principais
- **Login:** OAuth com Google — sem senha própria no app
- **Cadastro:** nome, email e foto vêm do Google; usuário só define o `apelido` no primeiro acesso

## Dados (origem: `identidade.usuario`, `identidade.credencial_usuario`)
`nome`, `email` (UNIQUE), `apelido`, `avatar_url`, `data_cadastro` / `provedor`, `id_externo`, `data_vinculo`

## Decisões (validado com o time)
- Login é exclusivamente via Google — recuperação de senha e regras de validação de senha saem de escopo (não existe senha própria no sistema).
- `apelido` não precisa ser UNIQUE (pode repetir entre usuários); a distinção entre contas passa a ser feita pelo `email`/id do Google, não pelo apelido.

## Resolvido na arquitetura
- **`senha_hash` obrigatório no schema (TODO anterior):** a coluna foi **removida** de `identidade.usuario`. As credenciais passaram para a tabela separada `identidade.credencial_usuario`, com `provedor = 'GOOGLE'` e `id_externo` guardando o claim `sub` do OIDC do Google (identificador estável, não o email). A constraint `chk_credencial_segredo` garante no banco que uma credencial `GOOGLE` **nunca** tem `segredo_hash`, e `unq_credencial_provedor` impede duas contas amarradas ao mesmo id externo. A tabela já comporta login por senha no futuro sem mexer em `usuario` (RN05, ver [08 - Regras de Negócio](../../01-negocio/08-regras-de-negocio.md) e [12 - DDL/Schema](../../03-banco-de-dados/implementacao/12-ddl-schema.md)).
- **Avatar:** `identidade.usuario.avatar_url` existe e é preenchido com a foto do Google no primeiro login — a tela de cadastro não pede foto ao usuário.

## TODOs para validação com o time
Nenhum pendente — ver **Resolvido na arquitetura**.
