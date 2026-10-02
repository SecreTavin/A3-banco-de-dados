# 09 - Evolução da Modelagem

O modelo não nasceu com 15 tabelas. Este documento registra as duas versões que
existiram, o que mudou entre elas e — o que importa — **por que** cada mudança
foi necessária. Toda alteração aqui é consequência de uma regra de negócio que o
modelo anterior não conseguia representar ou de uma anomalia de normalização.

## Resumo

| | v1 (agosto/2026) | v2 (setembro/2026) |
| --- | --- | --- |
| Tabelas | 8 | 15 |
| Schemas | 1 (`public`) | 6, um por módulo |
| Autenticação | `senha_hash` em `usuario` | `credencial_usuario` |
| Estado da evidência | não existia | `status` + `data_apuracao` |
| Júri | membros do grupo, calculado na hora | `validador_evidencia` (snapshot) |
| Economia | nenhuma | `transacao_cp` (ledger) + `saldo_cp` |
| Tipo temporal | `TIMESTAMP` | `TIMESTAMPTZ` |

## v1 — agosto/2026

Oito tabelas em um único schema: `usuario`, `grupo_amigos`, `membro_grupo`,
`categoria_desafio`, `aposta`, `participante_aposta`, `evidencia` e
`voto_evidencia`.

A normalização estava correta e permanece na v2:

* **1FN** — nenhum atributo multivalorado ou composto. Listas que a interface
  mostra juntas (participantes de uma aposta, votos de uma evidência) já eram
  linhas, não campos concatenados.
* **2FN** — nenhuma dependência parcial. As entidades associativas têm chave
  simples (`SERIAL`) mais `UNIQUE` composta, e seus atributos próprios
  (`papel`, `escolha`, `voto`) dependem da associação inteira.
* **3FN** — nenhuma dependência transitiva. `categoria_desafio` foi extraída de
  `aposta` justamente para que o nome e a descrição da categoria não
  dependessem do desafio.

Três relações N:N foram resolvidas por entidade associativa: usuário × grupo
(`membro_grupo`), usuário × aposta (`participante_aposta`) e jurado × evidência
(`voto_evidencia`).

O que a v1 **não** conseguia representar:

| Lacuna | Consequência |
| --- | --- |
| Evidência sem estado | A regra "3 recusadas perde a aposta" não era derivável do banco |
| Júri calculado no momento da apuração | O resultado de uma aposta mudava sozinho |
| Prenda sem valor numérico | Aposta de prenda não entrava em nenhum ranking |
| `senha_hash` em `usuario` | Coluna órfã depois da decisão de login por Google |

## v2 — setembro/2026

### (a) `senha_hash` sai de `usuario`, entra `credencial_usuario`

Com o login exclusivamente por Google decidido
([ADR 0001](../../02-arquitetura/adr/0001-stack-tecnologica.md), RN05),
`senha_hash` viraria uma coluna sempre nula em `usuario` — o caso clássico de
atributo que não descreve a entidade, mas um *meio de acesso* a ela.

A tabela separada resolve duas coisas ao mesmo tempo. Normaliza: o par
`(provedor, id_externo)` descreve a credencial, não o usuário. E comporta
múltiplos provedores sem alterar `usuario` — um dia com senha própria, é uma
linha nova com `provedor = 'SENHA'`, não uma migration em `usuario`. A
constraint `chk_credencial_segredo` mantém a coerência: `GOOGLE` nunca tem
segredo, `SENHA` sempre tem.

### (b) `evidencia` ganha `status`

Na v1, o estado de uma evidência era inferido contando votos toda vez que
alguém perguntava. Isso quebrava a RN10 — "a partir de 3 recusadas o desafiado
perde a aposta" exige saber *quantas foram recusadas*, e isso não era um dado,
era uma reinterpretação de votos antigos sob regras possivelmente novas.

`status` (`EM_VOTACAO`, `ACEITA`, `RECUSADA`, `EXPIRADA`) torna a decisão um
fato gravado, escrito uma única vez pela procedure de apuração junto com
`data_apuracao`. Contar recusadas passa a ser um `COUNT` trivial.

### (c) `validador_evidencia` — nova tabela

O bug mais grave da v1, e o único de **correção**, não de modelagem: o quórum
era `floor(n/2) + 1` sobre os membros do grupo *no instante da apuração*. Alguém
entrando no grupo aumentava `n`, aumentava o quórum, e uma evidência que já
tinha maioria deixava de ter. O resultado de uma aposta mudava sozinho, sem que
ninguém votasse.

A correção é congelar o conjunto de elegíveis no envio da evidência
([ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md), RN14). A tabela
é um snapshot puro — PK composta `(id_evidencia, id_usuario)`, nenhum atributo
próprio. Ela também vira o alvo da FK composta em `voto_evidencia`, então o
banco recusa voto de quem não estava no júri.

### (d) `transacao_cp` e o CP como moeda

Na v1 a aposta tinha `valor_monetario` e nada mais. Aposta de prenda ("lava meu
carro") não tinha valor numérico e portanto não entrava em ranking, em
estatística ou em qualquer comparação entre apostas — metade do produto ficava
fora dos números.

O CP resolve isso: toda aposta custa CP, inclusive as de prenda
([ADR 0006](../../02-arquitetura/adr/0006-cp-como-moeda.md), RN07). Prenda e
dinheiro passam a ser comparáveis porque ambos custam a mesma moeda.

A escolha de modelar o CP como **ledger append-only** em vez de só um campo
`saldo` é deliberada
([ADR 0007](../../02-arquitetura/adr/0007-ledger-append-only.md), RN24). Um
campo de saldo só responde "quanto tenho"; o ledger responde "por quê". Cada
lançamento tem contrapartida — débito do participante contra crédito na conta
da aposta — e a soma dos lançamentos de um grupo é sempre `100 × número de
membros`. `membro_grupo.saldo_cp` continua existindo como saldo materializado,
atualizado na mesma transação e conferido pela view
`economia.vw_reconciliacao_saldo`, que deve estar sempre vazia.

Do ponto de vista acadêmico, esta é a parte do modelo que mais rende: partidas
dobradas, invariante verificável por view e imutabilidade garantida por trigger.

### (e) `valor_monetario` vira descritivo

Com o CP assumindo o papel transacional, `valor_monetario` deixa de alimentar
qualquer cálculo. Ele passa a registrar apenas o que foi combinado fora do app —
documentação da aposta, não insumo do sistema (RN02). Nenhuma query de ranking
ou liquidação lê essa coluna.

### (f) Quatro tabelas novas de suporte

| Tabela | Substitui / resolve |
| --- | --- |
| `grupos.convite_grupo` | Entrada em grupo por código de uso único, rastreável até quem convidou (RN20) |
| `apostas.comentario_aposta` | Substitui o módulo de chat — a conversa acontece na aposta, não fora dela |
| `notificacoes.notificacao` | Notificação persistida: quem perdeu o push vê ao abrir o app |
| `notificacoes.push_subscription` | Inscrições Web Push (VAPID), uma por dispositivo ([ADR 0011](../../02-arquitetura/adr/0011-notificacoes-web-push.md)) |

`notificacao` e `push_subscription` são tabelas distintas de propósito: a
primeira é o conteúdo, a segunda é o transporte. Um usuário sem nenhuma
inscrição continua acumulando notificações.

### (g) Um papel único por aposta

A `UNIQUE (id_aposta, id_usuario)` da v1 permanece: um usuário tem um único
papel por aposta. O `DESAFIADO` já aposta em si mesmo através de `escolha`,
então papel duplo seria redundante.

Faltava a outra metade da RN09 — exatamente um `DESAFIANTE` e um `DESAFIADO`,
com `APOSTADOR` livre em quantidade. Uma `UNIQUE (id_aposta, papel_aposta)`
simples proibiria o segundo apostador. A solução é um **índice parcial único**:

```sql
CREATE UNIQUE INDEX unq_aposta_papel_unico
    ON apostas.participante_aposta (id_aposta, papel_aposta)
    WHERE papel_aposta IN ('DESAFIANTE', 'DESAFIADO');
```

A unicidade vale só onde precisa valer.

### (h) Separação em seis schemas

O monólito é modular ([ADR 0002](../../02-arquitetura/adr/0002-monolito-modular-vertical-slice.md))
e o banco acompanha: `identidade`, `grupos`, `apostas`, `validacao`, `economia`,
`notificacoes` ([ADR 0005](../../02-arquitetura/adr/0005-schema-por-modulo-postgres.md)).

A separação é **lógica**, não física — as FKs atravessam schemas normalmente e a
integridade referencial continua inteira. O ganho é de fronteira: fica visível
no próprio nome qualificado quando um módulo lê a tabela de outro.

### (i) `TIMESTAMP` → `TIMESTAMPTZ`

`TIMESTAMP` sem fuso é ambíguo — o mesmo valor significa horas diferentes
dependendo de quem lê. Como prazos de aposta e de votação são comparados contra
`CURRENT_TIMESTAMP` para decidir se uma evidência expirou, a ambiguidade seria
erro de resultado, não de exibição. Todas as colunas temporais passaram a
`TIMESTAMPTZ`.

## O que não mudou

As três formas normais continuam valendo na v2, e as tabelas novas foram
desenhadas sob as mesmas restrições. `validador_evidencia` sem atributos
próprios, `transacao_cp` sem coluna derivável de outra, `credencial_usuario`
com o segredo dependendo apenas da própria credencial. O modelo cresceu em
cobertura de regras, não em redundância.

O modelo resultante está detalhado em [10 - DER](10-der.md) e
[11 - Modelo Lógico](11-modelo-logico.md).
