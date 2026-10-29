# 13 - Povoamento do Banco de Dados (DML)

Massa de demonstração em
[`database/scripts/dml/seed.sql`](../../../database/scripts/dml/seed.sql),
executada automaticamente pelo `docker compose up` logo depois do
[`schema.sql`](12-ddl-schema.md). O banco nunca sobe vazio.

## Volume

| Tabela | Linhas | O que está lá |
| --- | --- | --- |
| `usuario` | 9 | Integrantes fictícios de 16 a 24 anos |
| `grupo_amigos` | 3 | Um grupo em cada nível de filtro: `MODERADO`, `PESADO`, `LEVE` |
| `membro_grupo` | 14 | Usuários em mais de um grupo, com saldo próprio em cada |
| `categoria_desafio` | 4 | Lista fixa: Esportes, Prendas, Games, Acadêmico |
| `desafio` | 10 | Todos os seis status do ciclo de vida |
| `moderacao_desafio` | 16 | 10 aprovadas (uma por desafio) e 6 recusadas |
| `participante_desafio` | 19 | Desafiante, desafiado e apostadores dos dois lados |
| `evidencia` | 6 | Aceitas, recusadas e uma em votação |
| `jurado_evidencia` | 18 | Júri congelado de cada evidência, com e sem voto |
| `transacao_cp` | 72 | Todos os tipos de lançamento em uso, inclusive `SAIDA_GRUPO` |

## O que cada parte demonstra

**O roteiro da banca.** O desafio 1, *"Correr 5km abaixo de 25 minutos"*, está
`EM_VOTACAO` com júri de 3, quórum 2 e um voto favorável. Um voto ao vivo
(Lari, pela Central de Votação) dispara a apuração dentro do banco: a evidência
é aceita, o desafio encerra, o pote é dividido e quem votou recebe 2 CP — tudo
numa transação. O passo a passo está no [README](../../../README.md).

**Os seis status do desafio** (RN03): 3 `ABERTA`, 2 `EM_ANDAMENTO`, 1
`EM_VOTACAO`, 2 `FINALIZADA_CUMPRIU`, 1 `FINALIZADA_PERDEU` e 1 `CANCELADA`.

**Regras em ação, não só declaradas:**

| Situação no seed | Regra |
| --- | --- |
| Desafio 5: júri aprova a prova e `apurar_votacao` encerra, paga e recompensa os votantes | RN15, RN17, RN23 |
| Desafio 6: três provas recusadas seguidas; na terceira, o desafio é encerrado contra o desafiado | RN10 |
| Desafio 7: cancelado com motivo; cada participante recebe o CP de volta | RN12 |
| Brunão é apostador no desafio 5 e ainda assim é jurado — só desafiante e desafiado ficam de fora | RN14 |
| Dieguinho entra no grupo 2 e sai: `CREDITO_INICIAL` de +100 e `SAIDA_GRUPO` de −100 | RN06, RN25 |
| Aninha tem exatamente 16 anos — o limite que o trigger aceita | RN26 |
| Seis propostas recusadas pela IA, com motivo, sem nenhum desafio criado | RN28 |
| A proposta das pimentas foi aprovada no grupo `LEVE` (virou o desafio 8) e recusada no `PESADO` | RN27 |

A distribuição das recusas acompanha o rigor do filtro — 25% no `LEVE`, 33% no
`MODERADO`, 50% no `PESADO` — e é exatamente o que a consulta Q9 do
[16 - Consultas](16-consultas-sql.md) mostra.

## Como foi escrito

**À mão, de propósito.** Um seeder em C# que passasse pelo domínio não
conseguiria criar estados intermediários — um desafio parado em votação com o
escrow aberto — sem simular o fluxo inteiro.

**Nenhum lançamento de CP escrito à mão.** Os 100 CP de entrada vêm do trigger
`trg_membro_credito_inicial`; débitos, prêmios, estornos, recompensas e a saída
de membro vêm das procedures reais (`debitar_escrow`, `apurar_votacao`,
`encerrar_desafio`, `cancelar_desafio`, `remover_membro`). Se o seed fechasse a
contabilidade "na mão", ele não provaria nada sobre as procedures.

**Duas partes.** A primeira monta o estado da demonstração e não muda; a
segunda, acrescentada para a Entrega 3, traz os grupos `PESADO` e `LEVE`, os
históricos e as recusas da moderação. Acrescentar depois, sem reordenar, mantém
os ids da demonstração estáveis.

**Uma exceção controlada.** Os dois votos do histórico mais antigo (desafio 3)
são gravados com o trigger de voto desligado, porque representam uma votação
anterior ao prazo atual; o trigger é religado na linha seguinte. Todos os
outros votos passam pelo trigger normalmente.

## Verificação

Depois do seed, estas duas consultas devem voltar **vazias** — qualquer linha é
bug de contabilidade:

```sql
SELECT * FROM vw_reconciliacao_saldo;
SELECT * FROM vw_escrow_orfao;
```

Verificado em 29/10/2026 num PostgreSQL 16 limpo: as duas vazias, e a consulta
Q7 do 16 confirma, grupo a grupo, que a soma do ledger é igual aos saldos dos
membros mais o CP retido em desafios.
