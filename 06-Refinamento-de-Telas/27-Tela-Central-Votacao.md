# 27 - Tela: Central de Votação

## Objetivo
Validação por evidência pelos membros do grupo (RF07).

## Seções principais
- **Lista de evidências pendentes** de voto nos meus grupos
- **Card de evidência:** mídia, comprovante, contagem de votos válidos/inválidos
- **Ação de votar:** `VALIDO`/`INVALIDO` + justificativa

## Dados (origem: `evidencia`, `voto_evidencia`)
`tipo_midia`, `url_comprovante` / `voto`, `justificativa`, `data_voto` — voto único por usuário/evidência (RN04)

## TODOs para validação com o time
- [ ] Quem pode votar: todos os membros do grupo, ou o próprio desafiante/desafiado ficam de fora? RN04 só garante unicidade, não exclui autovoto.
- [ ] Existe prazo para a votação encerrar, ou fica aberta indefinidamente?
- [ ] Quórum mínimo de votos para apurar o resultado (liga com o gap da tela [26](26-Tela-Detalhe-Aposta.md))?
- [ ] Evidências já votadas pelo usuário devem sumir da lista ou aparecer como "já votado"?
