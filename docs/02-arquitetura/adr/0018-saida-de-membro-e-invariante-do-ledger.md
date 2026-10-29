# 0018 - Saída de membro zera o saldo no ledger

* **Status:** Aceita
* **Data:** 2026-10-29
* **Decisores:** Octávio Arruda (Product Owner)

## Contexto

A tela 23 e a RN25 permitem remover um membro e deixar alguém sair do grupo,
mas não diziam o que acontece com o CP de quem sai. Apagar a linha de
`membro_grupo` sem mexer no ledger deixaria o saldo da pessoa contado em
`transacao_cp` e sem dono. Se ela voltasse ao grupo, ganharia 100 CP novos por
cima do histórico antigo, e a `vw_reconciliacao_saldo` acusaria divergência.

Na mesma revisão apareceram dois enunciados da invariante do ledger que não
fecham. A RN24 dizia "a soma de todos os lançamentos de um grupo é sempre
`100 × número de membros`" — falso desde a recompensa de voto (RN17), que cria
CP: no seed, o grupo *Calouros de SI* tem 5 membros e soma 516. O
[ADR 0007](0007-ledger-append-only.md) já ressalvava as recompensas, mas a
fórmula dele (`100 × membros + recompensas`) deixa de valer quando alguém sai
com saldo diferente de 100.

## Decisão

**1. A saída lança `SAIDA_GRUPO`**, um valor negativo igual ao saldo de quem
sai, antes de remover o membro. O histórico fica no ledger (que é append-only)
e a conta termina em zero. Executado pela procedure `remover_membro`.

**2. A saída é recusada** enquanto o membro participa de desafio `ABERTA`,
`EM_ANDAMENTO` ou `EM_VOTACAO`, ou integra júri de evidência `EM_VOTACAO`. A
liquidação pagaria CP a quem já não é membro, e o júri congelado travaria
esperando um voto que não viria.

**3. A invariante do ledger passa a ser:**

> soma de todos os lançamentos do grupo = soma dos saldos dos membros + CP retido em desafios

Vale em qualquer instante, com saída, recompensa, estorno e prêmio. É o que a
consulta Q7 do [16 - Consultas](../../03-banco-de-dados/implementacao/16-consultas-sql.md)
verifica grupo a grupo.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Remover o membro sem lançamento | Simples | Saldo órfão no ledger; reconciliação falha quando a pessoa volta | Quebra a contabilidade |
| Proibir saída e remoção | Elimina o problema | Corta funcionalidade da tela 23 e da RN25 | Perde produto para evitar uma linha de ledger |
| Transferir o saldo de quem sai para os demais | CP continua circulando | Regra arbitrária de divisão; quem sai "paga" os outros | Sem demanda de produto |
| Manter `100 × membros + recompensas` | Nenhum texto muda | Falso assim que alguém sai com saldo diferente de 100 | Documento que mente não serve de especificação |

## Consequências

**Positivas:** a reconciliação continua vazia com qualquer combinação de
entradas e saídas; a limitação "quórum congelado não acomoda saída de membro"
deixa de existir, porque quem está num júri aberto não pode sair.

**Negativas:** um membro pode ficar impedido de sair até o fim de um desafio ou
votação. O CP de quem sai deixa de existir no grupo — não volta para ninguém.

**Impacto na documentação:**
[08 - Regras](../../01-negocio/08-regras-de-negocio.md) (RN24, RN25),
[11 - Modelo Lógico](../../03-banco-de-dados/modelagem/11-modelo-logico.md)
(`chk_transacao_tipo`),
[19 - Limitações](../../06-encerramento/19-limitacoes-e-melhorias.md),
[17 - Testes](../../05-qualidade/17-testes.md) (I03).
