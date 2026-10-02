# 09 - Evolução da Modelagem

O modelo teve três versões. Cada mudança respondeu a uma regra de negócio que
o modelo anterior não representava, a uma anomalia de normalização ou, na v3, à
necessidade de explicar o modelo com menos peças sem perder conceito.

## Resumo

| | v1 (agosto/2026) | v2 (setembro/2026) | v3 (outubro/2026) |
| --- | --- | --- | --- |
| Tabelas | 8 | 15 | 9 |
| Schemas | 1 (`public`) | 6 | 5 |
| Júri | calculado na hora | `validador_evidencia` + `voto_evidencia` | `jurado_evidencia` |
| Economia | nenhuma | `transacao_cp` + `saldo_cp` | igual à v2 |
| Estado da evidência | não existia | `status` + `data_apuracao` | igual à v2 |

## v1 — agosto/2026

Oito tabelas em um único schema: `usuario`, `grupo_amigos`, `membro_grupo`,
`categoria_desafio`, `aposta`, `participante_aposta`, `evidencia` e
`voto_evidencia`. A normalização estava correta e permanece até hoje:

* **1FN** — nenhum atributo multivalorado. Participantes e votos são linhas.
* **2FN** — entidades associativas com chave simples mais `UNIQUE` composta;
  `papel`, `escolha` e `voto` dependem da associação inteira.
* **3FN** — `categoria_desafio` extraída de `aposta`, para que o nome da
  categoria não dependa do desafio.

Três relações N:N resolvidas por entidade associativa: usuário × grupo,
usuário × aposta, jurado × evidência.

O que a v1 não conseguia representar:

| Lacuna | Consequência |
| --- | --- |
| Evidência sem estado | "3 recusadas perde a aposta" não era derivável do banco |
| Júri calculado na apuração | O resultado de uma aposta mudava sozinho |
| Prenda sem valor numérico | Aposta de prenda ficava fora de qualquer ranking |

## v2 — setembro/2026

A v2 fechou as lacunas e acrescentou suporte:

* **`evidencia.status`** — a decisão vira fato gravado pela procedure de
  apuração (RN13), não contagem repetida de votos antigos.
* **`validador_evidencia`** — snapshot do júri no envio da evidência. Corrige o
  bug em que alguém entrar no grupo aumentava o quórum e invertia o resultado
  ([ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md)).
* **`transacao_cp`** — o CP como moeda única, em ledger append-only de
  partidas dobradas ([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md),
  [ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md)). Prenda e
  dinheiro passam a custar a mesma moeda e ficam comparáveis. O ledger responde
  "por quê"; `membro_grupo.saldo_cp` responde "quanto", conferido pela view
  `vw_reconciliacao_saldo`.
* **Índice parcial único** em `participante_aposta`: um `DESAFIANTE` e um
  `DESAFIADO` por aposta, `APOSTADOR` livre (RN09).
* **`TIMESTAMPTZ`** no lugar de `TIMESTAMP`: prazos são comparados contra o
  relógio, e hora sem fuso é ambígua.
* **Seis schemas**, um por módulo, com FKs atravessando
  ([ADR 0005](../../02-arquitetura/adr/0005-schema-por-modulo-postgres.md)).
* Tabelas de suporte: `credencial_usuario`, `convite_grupo`,
  `comentario_aposta`, `notificacao`, `push_subscription`.

## v3 — outubro/2026: simplificação

Objetivo: o mesmo conceito com menos peças. Nenhuma regra de negócio central
foi abandonada.

### (a) Júri e voto viram uma tabela: `jurado_evidencia`

Na v2, `validador_evidencia` (quem pode votar) e `voto_evidencia` (o que
votou) descreviam a mesma pessoa na mesma evidência e precisavam de uma FK
composta para ficar coerentes. Na v3, o júri nasce como linhas com `voto`
nulo e votar é preencher a linha. A PK `(id_evidencia, id_usuario)` entrega
voto único e voto só de jurado, sem FK composta. O conceito de **júri
congelado** permanece intacto.

### (b) Saem as tabelas de acesso e de comunicação

| Tabela removida | Por que sai do modelo |
| --- | --- |
| `credencial_usuario` | O login é externo (Google): a identidade é o e-mail e não há credencial a guardar |
| `convite_grupo` | Mecanismo de entrada, não conceito do domínio de apostas |
| `comentario_aposta` | Recurso de interface, sem regra de integridade própria |
| `notificacao`, `push_subscription` | Comunicação com o usuário, não dado do domínio |

Cada uma dessas tabelas pode voltar quando o sistema precisar, sem alterar o
núcleo — todas apontavam para `usuario`, `grupo_amigos` ou `aposta`, nunca o
contrário.

### (c) Colunas descritivas se fundem

`valor_monetario` e `descricao_prenda` viram `descricao_recompensa`. Ambas só
registravam o que foi combinado fora do app e nenhuma entrava em cálculo
(RN02).

### (d) Cinco schemas

`notificacoes` deixa de existir junto com suas tabelas. Os outros cinco
permanecem.

### Fora da v3

`moderacao_desafio`, `usuario.data_nascimento` e `grupo_amigos.nivel_filtro`
([ADR 0015](../../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md))
ficam fora do modelo simplificado. Continuam planejados, como extensão.

## O que não mudou

As três formas normais valem na v3. `transacao_cp` não tem coluna derivável de
outra, `jurado_evidencia` depende inteiramente da chave composta, e
`categoria_desafio` segue separada. O modelo encolheu em peças, não em
cobertura das regras centrais.

O modelo resultante está em [10 - DER](10-der.md) e
[11 - Modelo Lógico](11-modelo-logico.md).
