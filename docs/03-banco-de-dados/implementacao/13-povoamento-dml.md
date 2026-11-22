# 13 - Povoamento do Banco de Dados (DML)

O banco da demonstração é povoado pelos **cinco integrantes do grupo**, com as
próprias contas Google, usando o sistema. Não há pessoas fictícias na produção.
Cada linha passa pelo mesmo caminho de um uso real: API, regras de domínio,
triggers e procedures.

## Como o banco é povoado

| Etapa | O que grava | Quem faz |
| --- | --- | --- |
| Estrutura | `schema.sql`, com tabelas, constraints, procedures, triggers e views | Script de criação |
| Categorias | As 4 categorias de [`categorias.sql`](../../../database/scripts/dml/categorias.sql), que não têm tela de gestão | Script de criação |
| Cadastro | `usuario`, a partir do login com Google | Cada integrante |
| Grupos | `grupo_amigos` e `membro_grupo`; a trigger lança os 100 CP de entrada | Admin do grupo |
| Desafios | `moderacao_desafio` e `desafio`, depois da avaliação da IA | Integrantes |
| Aceites | `participante_desafio` e o escrow em `transacao_cp` | Integrantes |
| Provas e votos | `evidencia`, `jurado_evidencia`, prêmios e recompensas | Integrantes |

O volume da produção cresce com o uso. Na banca, ele é consultado ao vivo
([roteiro, passo 10](../../06-encerramento/roteiro-da-demonstracao.md)):

```sql
SELECT (SELECT count(*) FROM usuario)      AS usuarios,
       (SELECT count(*) FROM grupo_amigos) AS grupos,
       (SELECT count(*) FROM desafio)      AS desafios,
       (SELECT count(*) FROM evidencia)    AS provas,
       (SELECT count(*) FROM transacao_cp) AS lancamentos;
```

## Base de ensaio

Para as capturas do GitBook e os resultados do
[documento 16](16-consultas-sql.md), a mesma sequência foi executada num banco
local vazio por
[`scripts/telas/povoar-integrantes.mjs`](../../../scripts/telas/povoar-integrantes.mjs),
em 22/11/2026.

Ela usa os nomes dos integrantes, com **e-mails de exemplo**, a mesma data de
nascimento fictícia para todos e um **moderador simulado**. Os desafios, votos e
saldos são de ensaio, não um histórico real. O script recusa rodar fora do
`localhost` ou num banco que já tenha usuários.

| Tabela | Linhas | O que está lá |
| --- | --- | --- |
| `usuario` | 5 | Os cinco integrantes |
| `grupo_amigos` | 3 | Um grupo em cada nível de filtro: `MODERADO`, `PESADO`, `LEVE` |
| `membro_grupo` | 13 | Integrantes em mais de um grupo, com saldo próprio em cada |
| `categoria_desafio` | 4 | Lista fixa: Esportes, Prendas, Games, Acadêmico |
| `desafio` | 7 | Todos os seis status do ciclo de vida |
| `moderacao_desafio` | 10 | 7 aprovadas (uma por desafio) e 3 recusadas |
| `participante_desafio` | 11 | Desafiante, desafiado e apostadores |
| `evidencia` | 5 | Com foto: aceita, recusadas e uma em votação |
| `jurado_evidencia` | 15 | Júri congelado de cada evidência, com e sem voto |
| `transacao_cp` | 52 | Crédito, escrow, prêmio, estorno, recompensa e saída de grupo |

**Os seis status do desafio** (RN03): 2 `ABERTA`, 1 `EM_ANDAMENTO`, 1
`EM_VOTACAO`, 1 `FINALIZADA_CUMPRIU`, 1 `FINALIZADA_PERDEU` e 1 `CANCELADA`.

**Regras em ação, não só declaradas:**

| Situação na base de ensaio | Regra |
| --- | --- |
| *Entregar o DER*: o júri aprova a prova, e `apurar_votacao` encerra, paga e recompensa quem votou | RN15, RN17, RN23 |
| *Correr 5 km*: júri de 3, quórum 2 e um voto dado; o próximo voto fecha a apuração | RN14, RN15 |
| *50 flexões*: três provas recusadas seguidas; na terceira, o desafio é encerrado contra o desafiado | RN10 |
| *Cantar na cantina*: cancelado com motivo; quem tinha entrado recebe o CP de volta | RN12 |
| Mario é apostador na corrida e ainda assim é jurado; só desafiante e desafiado ficam de fora | RN14 |
| Octávio entra em *Pelada de Sexta* e é removido: `CREDITO_INICIAL` de +100 e `SAIDA_GRUPO` de −100 | RN06, RN25 |
| Três propostas recusadas pela moderação, com motivo, sem nenhum desafio criado | RN28 |

**Nenhum lançamento de CP é escrito à mão.** Os 100 CP de entrada vêm do trigger
`trg_credito_inicial`; débitos, prêmios, estornos, recompensas e a saída de
membro vêm das procedures reais (`debitar_escrow`, `apurar_votacao`,
`encerrar_desafio`, `cancelar_desafio`, `remover_membro`).

## Verificação

Depois de povoar, e a qualquer momento na produção, estas duas consultas devem
voltar **vazias**. Qualquer linha é bug de contabilidade:

```sql
SELECT * FROM vw_reconciliacao_saldo;
SELECT * FROM vw_escrow_orfao;
```

Verificado em 22/11/2026 na base de ensaio: as duas vazias, e a consulta Q7 do
[documento 16](16-consultas-sql.md) confirma, grupo a grupo, que a soma do ledger
é igual aos saldos dos membros mais o CP retido em desafios.

## Dados de teste automatizado

[`database/scripts/dml/seed.sql`](../../../database/scripts/dml/seed.sql) continua
no repositório **só para os testes**. O CI e os roteiros de ponta a ponta precisam
de um estado fixo e conhecido, com usuários fictícios. Esse arquivo **não é
aplicado na produção** desde 20/11/2026 e não faz parte da demonstração.

O `docker compose up` local ainda o aplica na primeira subida, para os testes
funcionarem sem preparação. Para começar um banco local sem ele:

```bash
scripts/demo/recriar-banco.sh --vazio
```
