# 25 - Tela: Criar Desafio

## Objetivo
Criação de uma nova aposta/desafio (RF03, RF04, RF05).

## Seções principais
- **Dados básicos:** título, descrição, grupo, categoria
- **Recompensa:** tipo (`MONETARIA`/`PRENDA_ACAO`/`ITEM_MATERIAL`/`OUTRO`), campo condicional — valor monetário (> 0) ou descrição da prenda (RN01, RN02)
- **Prazo:** `data_limite`
- **Participantes:** convite de membros do grupo, papel (`DESAFIANTE`/`DESAFIADO`/`APOSTADOR`) e escolha inicial (`VAI_CUMPRIR`/`NAO_VAI_CUMPRIR`)

## Dados (origem: `aposta`, `participante_aposta`)
`titulo`, `descricao`, `tipo_recompensa`, `valor_monetario`, `descricao_prenda`, `data_limite` / `papel_aposta`, `escolha`

## TODOs para validação com o time
- [ ] Quantos participantes por papel são permitidos (ex: só 1 `DESAFIANTE` e 1 `DESAFIADO`, N `APOSTADOR`)? Não há regra definida.
- [ ] Aposta pode ser editada após criada, ou só cancelada?
- [ ] Prazo mínimo/máximo para `data_limite`?
- [ ] Categoria é obrigatória — precisa de tela própria de gestão de categorias, ou é lista fixa?
