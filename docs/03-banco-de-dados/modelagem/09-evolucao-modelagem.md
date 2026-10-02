# 09 - Evolução da Modelagem

O modelo começou com 8 tabelas e chegou a 9. Cada mudança respondeu a uma regra
de negócio que o primeiro desenho não conseguia representar.

## Resumo

| | Primeira versão | Modelo atual |
| --- | --- | --- |
| Tabelas | 8 | 9 |
| Schemas | 1 (`public`) | 1 (`public`) |
| Júri | calculado na hora | `jurado_evidencia` (congelado) |
| Economia | nenhuma | `transacao_cp` (ledger) |
| Estado da evidência | não existia | `status` + `data_apuracao` |
| Tipo temporal | `TIMESTAMP` | `TIMESTAMPTZ` |

## Primeira versão

Oito tabelas: `usuario`, `grupo_amigos`, `membro_grupo`, `categoria_desafio`,
`aposta`, `participante_aposta`, `evidencia` e `voto_evidencia`. A normalização
estava correta e permanece até hoje:

* **1FN** — nenhum atributo multivalorado. Participantes e votos são linhas.
* **2FN** — entidades associativas com chave simples mais `UNIQUE` composta;
  `papel`, `escolha` e `voto` dependem da associação inteira.
* **3FN** — `categoria_desafio` extraída de `aposta`, para que o nome da
  categoria não dependa do desafio.

Três relações N:N resolvidas por entidade associativa: usuário × grupo,
usuário × aposta, jurado × evidência.

O que ela não conseguia representar:

| Lacuna | Consequência |
| --- | --- |
| Evidência sem estado | "3 recusadas perde a aposta" não era derivável do banco |
| Júri calculado na apuração | O resultado de uma aposta mudava sozinho |
| Prenda sem valor numérico | Aposta de prenda ficava fora de qualquer ranking |
| `senha_hash` em `usuario` | Coluna sempre nula, já que o login é pelo Google |

## O que mudou e por quê

### (a) Júri congelado: `jurado_evidencia`

O quórum era `floor(n/2) + 1` sobre os membros do grupo **no instante da
apuração**. Alguém entrando no grupo aumentava o quórum e uma evidência que já
tinha maioria deixava de ter. O resultado mudava sem ninguém votar.

A correção é gravar o júri no envio da evidência
([ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md)). Uma linha por
integrante elegível, com `voto` nulo; votar é preencher a linha. A PK
`(id_evidencia, id_usuario)` garante voto único e voto só de quem está no júri,
sem FK composta.

### (b) `evidencia.status`

O estado era inferido contando votos a cada consulta. Agora `status`
(`EM_VOTACAO`, `ACEITA`, `RECUSADA`, `EXPIRADA`) é um fato gravado uma única vez
pela procedure de apuração, junto com `data_apuracao`. Contar recusadas vira um
`COUNT` simples (RN10).

### (c) CP como moeda e ledger: `transacao_cp`

Aposta de prenda não tinha valor numérico. Com o CP, toda aposta custa a mesma
moeda e fica comparável ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)).

O CP é um **ledger append-only** de partidas dobradas, não só um campo de saldo
([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)). O saldo
responde "quanto tenho"; o ledger responde "por quê". `membro_grupo.saldo_cp`
continua como saldo materializado, conferido pela view
`vw_reconciliacao_saldo`, que deve estar sempre vazia. Um trigger impede
`UPDATE` e `DELETE`; estorno é lançamento novo.

### (d) Um `DESAFIANTE` e um `DESAFIADO` por aposta

Um índice parcial único em `participante_aposta` limita esses dois papéis a um
cada, sem restringir a quantidade de `APOSTADOR` (RN09):

```sql
CREATE UNIQUE INDEX unq_aposta_papel_unico
    ON participante_aposta (id_aposta, papel_aposta)
    WHERE papel_aposta IN ('DESAFIANTE', 'DESAFIADO');
```

### (e) Ajustes menores

* `senha_hash` sai: o login é externo e a identidade é o e-mail (RN05).
* `valor_monetario` e `descricao_prenda` viram `descricao_recompensa`: ambas só
  registravam o que foi combinado fora do app e nenhuma entrava em cálculo
  (RN02).
* `TIMESTAMP` vira `TIMESTAMPTZ`: prazos são comparados contra o relógio, e hora
  sem fuso é ambígua.

## O que não mudou

As três formas normais valem no modelo atual. `transacao_cp` não tem coluna
derivável de outra, `jurado_evidencia` depende inteiramente da chave composta, e
`categoria_desafio` segue separada.

O modelo está em [10 - DER](10-der.md) e [11 - Modelo Lógico](11-modelo-logico.md).
