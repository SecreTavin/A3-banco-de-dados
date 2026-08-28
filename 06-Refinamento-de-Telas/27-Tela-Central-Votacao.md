# 27 - Tela: Central de Votação

## Objetivo
Validação por evidência pelos membros do grupo (RF07).

## Seções principais
- **Lista de evidências pendentes** de voto nos meus grupos (evidências já votadas pelo usuário continuam na lista, marcadas como "Já votado")
- **Card de evidência:** mídia, comprovante, contagem de votos válidos/inválidos
- **Ação de votar:** `VALIDO`/`INVALIDO` + justificativa

## Dados (origem: `evidencia`, `voto_evidencia`)
`tipo_midia`, `url_comprovante` / `voto`, `justificativa`, `data_voto` — voto único por usuário/evidência (RN04)

## Decisões (validado com o time)
- O desafiante (`DESAFIANTE`) fica de fora da votação; os demais membros do grupo podem votar.
- Prazo de votação: 1 semana.
- Quórum mínimo para apurar o resultado: metade + 1 dos validadores.
- Evidência já votada pelo usuário não some da lista — aparece marcada como "Já votado".

## TODOs para validação com o time
- [ ] Schema não tem campo/mecanismo para expirar a votação após 1 semana — falta modelar (ex: prazo calculado a partir de `data_envio` da evidência, ou coluna própria).
