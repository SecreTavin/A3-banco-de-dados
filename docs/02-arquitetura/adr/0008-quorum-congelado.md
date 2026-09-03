# 0008 - Conjunto de validadores congelado por evidencia

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O refinamento da tela 27 (Central de Votacao) fixou a regra de apuracao:
**quorum = metade + 1 dos validadores**. A regra nao dizia de *quem* — nem quem
e validador, nem em que momento esse conjunto e determinado.

Deixar o conjunto flutuando com a composicao do grupo produz um bug de correcao
no nucleo do produto:

> Grupo com 5 membros, evidencia enviada, 2 fora da votacao (desafiante e
> desafiado). Validadores = 3, quorum = 2. Dois votam `VALIDO`: a evidencia tem
> maioria. Nesse instante um sexto membro entra no grupo pelo convite.
> Validadores passam a 4, quorum passa a 3. **A evidencia que ja tinha maioria
> deixa de ter.** O resultado da aposta muda sozinho, sem ninguem votar e sem
> ninguem fazer nada.

O inverso e igualmente ruim: alguem sair do grupo faz o quorum cair e aprova
retroativamente uma evidencia que estava em minoria. Em ambos os casos o
resultado de uma aposta ja votada depende de um evento externo a ela.

A tela 27 tambem exige que a votacao mostre "voces ja votaram 2 de 3" — um
denominador que muda no meio da votacao e uma UI que mente.

## Decisao

**O conjunto de validadores e congelado por evidencia, em uma tabela.**

`validacao.validador_evidencia` grava um **snapshot dos elegiveis a votar** no
momento em que a evidencia e enviada — a transicao da aposta para `EM_VOTACAO`.
A escrita do snapshot acontece na **mesma transacao** que insere a evidencia.

* **Quem entra no snapshot:** todos os membros do grupo **exceto o DESAFIANTE e
  o DESAFIADO**. Nao se julga a propria aposta.
* **Quorum:** `floor(n/2) + 1`, com `n = COUNT(*)` das linhas do snapshot
  daquela evidencia. Um numero fixo desde o segundo zero da votacao.
* **So vota quem esta no snapshot.** `voto_evidencia` tem FK **composta** para a
  tabela:

```sql
CONSTRAINT fk_voto_validador FOREIGN KEY (id_evidencia, id_usuario)
    REFERENCES validacao.validador_evidencia(id_evidencia, id_usuario)
```

Um voto de quem entrou no grupo depois nao e rejeitado por `IF` na aplicacao —
**e impossivel de inserir**. Quem sai do grupo depois continua no snapshot e
mantem o voto que ja deu, o que e correto: ele era membro quando a evidencia foi
enviada.

* **Empate:** mantem em votacao. Empate nao e maioria.
* **Prazo:** se a janela de 1 semana expira sem maioria, a evidencia e
  **RECUSADA**. O onus da prova e de quem enviou a evidencia — quem alega que
  cumpriu precisa convencer o juri, e a ausencia de convencimento nao vale como
  cumprimento.

A tabela usa **PK composta** `(id_evidencia, id_usuario)`: a linha *e* a
associacao, nao precisa de `SERIAL` artificial — e essa PK e exatamente o alvo
da FK composta acima.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Conjunto flutuante com apuracao monotonica (fecha na primeira vez que atinge quorum, irreversivel) | Zero tabela nova; o resultado nao desfaz | Depende de a trigger de apuracao rodar em **todo** voto e nunca falhar; e depois nao ha como auditar quem era elegivel no momento da apuracao | Funciona, mas o correto vira consequencia de o codigo ter rodado na hora certa — nao de uma restricao do modelo |
| Conjunto flutuante puro (contar membros do grupo na hora da leitura) | Mais simples de escrever | Resultado ja apurado pode desfazer; UI com denominador instavel | Descartado — e o bug que motivou o ADR |
| Congelar so o **numero** de validadores na evidencia (coluna `qtd_validadores`) | Uma coluna, sem tabela | Congela o quorum mas nao **quem** vota; quem entrou depois ainda consegue votar | Metade da correcao pela metade do custo, e sem o ganho de modelagem |
| Todos os membros votam, inclusive desafiante e desafiado | Nao precisa filtrar | Parte interessada julga a si mesma | Regra de produto, nao negociavel |
| Empate aprova a evidencia | Resolve a votacao mais rapido | Inverte o onus da prova | Quem alega cumprimento precisa de maioria, nao de ausencia de rejeicao |

## Consequencias

**Positivas:** o resultado de uma evidencia depende **apenas** dos votos daquela
evidencia — entradas e saidas do grupo nao alteram nada ja em votacao. O quorum
e um `COUNT` sobre linhas fixas, calculavel em qualquer momento, inclusive meses
depois para explicar por que uma aposta terminou daquele jeito. A elegibilidade
e garantida por FK: nao ha checagem na aplicacao que possa ser esquecida em um
endpoint.

Ha tambem ganho direto de **modelagem**, que e o que a disciplina avalia: a
tabela e uma **entidade associativa** a mais no DER, com PK composta e alvo de
FK composta — e o quorum, que seria uma regra em codigo, vira uma contagem
trivial em SQL.

**Negativas:** uma tabela e N linhas por evidencia que existiriam apenas
implicitamente. O snapshot pode ficar desatualizado em relacao ao grupo, e isso
e intencional, mas exige explicar: um membro removido do grupo continua
aparecendo como validador daquela evidencia. E se o grupo tiver apenas
desafiante e desafiado, o snapshot sai vazio — caso que a apuracao precisa
tratar explicitamente (nao ha juri, a aposta nao pode ser validada por voto).

**Impacto na documentacao:** [08-regras-de-negocio.md](../../01-negocio/08-regras-de-negocio.md)
(RN04 voto unico, RN11 prazo de votacao, RN13 apuracao, RN14 elegibilidade),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md) (nova entidade associativa),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[27-tela-central-votacao.md](../../04-ux/telas/27-tela-central-votacao.md)
(define o denominador do contador de votos),
[26-tela-detalhe-aposta.md](../../04-ux/telas/26-tela-detalhe-aposta.md).
