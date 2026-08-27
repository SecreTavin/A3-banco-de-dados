# 08 - Regras de Negócio (RN)

* **RN01:** Tipo de recompensa restrito a: `'MONETARIA'`, `'PRENDA_ACAO'`, `'ITEM_MATERIAL'`, `'OUTRO'` (`CHECK`).
* **RN02:** Se monetária, valor maior que zero (`CHECK (valor_monetario > 0)`).
* **RN03:** Ciclo de vida: `'ABERTA'`, `'EM_ANDAMENTO'`, `'EM_VOTACAO'`, `'FINALIZADA_CUMPRIU'`, `'FINALIZADA_PERDEU'`, `'CANCELADA'`.
* **RN04:** Voto único por usuário em cada evidência (`UNIQUE`).
