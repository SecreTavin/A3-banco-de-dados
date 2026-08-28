# 25 - Tela: Criar Desafio

## Objetivo
Criação de uma nova aposta/desafio (RF03, RF04, RF05).

## Seções principais
- **Dados básicos:** título, descrição, grupo, categoria (lista fixa, sem tela própria de gestão)
- **Recompensa:** tipo (`MONETARIA`/`PRENDA_ACAO`/`ITEM_MATERIAL`/`OUTRO`), campo condicional — valor monetário (> 0) ou descrição da prenda (RN01, RN02)
- **Prazo:** `data_limite` (sem prazo mínimo/máximo)
- **Participantes:** convite de membros do grupo, papel (`DESAFIANTE`/`DESAFIADO`/`APOSTADOR`) e escolha inicial (`VAI_CUMPRIR`/`NAO_VAI_CUMPRIR`)

## Dados (origem: `aposta`, `participante_aposta`)
`titulo`, `descricao`, `tipo_recompensa`, `valor_monetario`, `descricao_prenda`, `data_limite` / `papel_aposta`, `escolha`

## Decisões (validado com o time)
- Participantes por papel: exatamente 1 `DESAFIANTE` e 1 `DESAFIADO` por aposta; `APOSTADOR` é livre em quantidade. O `DESAFIADO` também pode assumir o papel de `APOSTADOR`.
- Aposta não é editável após criada — só pode ser cancelada, com motivo obrigatório.
- `data_limite` não tem prazo mínimo/máximo; a contagem da aposta só começa a valer quando o quórum é atingido.
- Categoria é uma lista fixa/constante — não há tela de gestão de categorias.

## TODOs para validação com o time
- [ ] Schema não garante no banco o limite de 1 `DESAFIANTE`/1 `DESAFIADO` por aposta — falta constraint/validação.
- [ ] `UNIQUE(id_aposta, id_usuario)` em `participante_aposta` impede o mesmo usuário ter 2 papéis (`DESAFIADO` + `APOSTADOR`) na mesma aposta — schema precisa ser revisto para permitir isso.
