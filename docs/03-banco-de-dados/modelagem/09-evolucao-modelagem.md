# 09 - Evolução da Modelagem

O modelo começou com 8 tabelas e chegou a 10. Cada mudança respondeu a uma regra
de negócio que o primeiro desenho não conseguia representar.

## Resumo

| | Primeira versão | Modelo atual |
| --- | --- | --- |
| Tabelas | 8 | 10 |
| Schemas | 1 (`public`) | 1 (`public`) |
| Júri | calculado na hora | `jurado_evidencia` (congelado) |
| Economia | nenhuma | `transacao_cp` (ledger) |
| Estado da evidência | não existia | `status` + `data_apuracao` |
| Tipo temporal | `TIMESTAMP` | `TIMESTAMPTZ` |
| Moderação | nenhuma | `moderacao_desafio` + idade mínima |

## Primeira versão

Oito tabelas: `usuario`, `grupo_amigos`, `membro_grupo`, `categoria_desafio`,
`desafio`, `participante_desafio`, `evidencia` e `voto_evidencia`. A normalização
estava correta e permanece até hoje:

* **1FN** — nenhum atributo multivalorado. Participantes e votos são linhas.
* **2FN** — entidades associativas com chave simples mais `UNIQUE` composta;
  `papel`, `escolha` e `voto` dependem da associação inteira.
* **3FN** — `categoria_desafio` extraída de `desafio`, para que o nome da
  categoria não dependa do desafio.

Três relações N:N resolvidas por entidade associativa: usuário × grupo,
usuário × desafio, jurado × evidência.

O que ela não conseguia representar:

| Lacuna | Consequência |
| --- | --- |
| Evidência sem estado | "3 recusadas perde o desafio" não era derivável do banco |
| Júri calculado na apuração | O resultado de um desafio mudava sozinho |
| Prenda sem valor numérico | Desafio de prenda ficava fora de qualquer ranking |
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

Desafio de prenda não tinha valor numérico. Com o CP, todo desafio custa a mesma
moeda e fica comparável ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md)).

O CP é um **ledger append-only** de partidas dobradas, não só um campo de saldo
([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)). O saldo
responde "quanto tenho"; o ledger responde "por quê". `membro_grupo.saldo_cp`
continua como saldo materializado, conferido pela view
`vw_reconciliacao_saldo`, que deve estar sempre vazia. Um trigger impede
`UPDATE` e `DELETE`; estorno é lançamento novo.

### (d) Um `DESAFIANTE` e um `DESAFIADO` por desafio

Um índice parcial único em `participante_desafio` limita esses dois papéis a um
cada, sem restringir a quantidade de `APOSTADOR` (RN09):

```sql
CREATE UNIQUE INDEX unq_desafio_papel_unico
    ON participante_desafio (id_desafio, papel_desafio)
    WHERE papel_desafio IN ('DESAFIANTE', 'DESAFIADO');
```

### (e) Idade mínima e moderação por IA

Exigência do professor orientador na revisão da Entrega 1 (RT01): o tom de
"zoeira" não pode virar desafio com risco real a alguém
([ADR 0015](../../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md)).
Entram `usuario.data_nascimento` (idade mínima de 16 anos, por trigger),
`grupo_amigos.nivel_filtro` e a tabela `moderacao_desafio`, com FK opcional
para `desafio`: proposta reprovada nunca vira desafio, mas a avaliação fica
registrada (RN26 a RN28).

### (f) Ajustes menores

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
