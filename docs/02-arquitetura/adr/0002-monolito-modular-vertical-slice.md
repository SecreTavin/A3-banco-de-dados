# 0002 - Monolito modular com vertical slice por feature

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

A stack ja estava definida em [0001](0001-stack-tecnologica.md), mas nao a forma
de organizar o codigo dentro de `apps/api`. O sistema tem uma regra de negocio
que nao e trivial: o desafio passa por uma maquina de estados, a validacao do
resultado depende de quorum entre participantes e a economia de moedas so pode
ser movimentada quando essa validacao fecha. Colocar isso tudo em um `Service`
por entidade produz classes de mil linhas que ninguem consegue defender na banca.

Restricoes reais:

* **Tres desenvolvedores trabalhando em paralelo.** Se duas pessoas mexem em
  features diferentes, os arquivos tocados nao podem ser os mesmos.
* **Uso intensivo de IA.** Codigo em que uma feature inteira cabe numa pasta e
  drasticamente mais facil de gerar e revisar do que codigo espalhado por quatro
  diretorios por convencao.
* **A disciplina e Banco de Dados.** A arquitetura precisa manter a fronteira
  com o banco explicita e demonstravel (documento 15), sem consumir tempo que
  deveria ir para modelagem e consultas.

## Decisao

Monolito modular, um unico deploy, dividido em **seis modulos de dominio**:

| Modulo | Responsabilidade |
| --- | --- |
| Identidade | Usuario, credencial, sessao |
| Grupos | Grupo, membro, convite |
| Desafios | Desafio, palpite, ciclo de vida do desafio |
| Validacao | Maquina de estados do resultado, votacao, quorum |
| Economia | Saldo, extrato, transacao de moedas |
| Ranking | Leitura consolidada de pontuacao (read-only) |

Dentro de cada modulo, **vertical slice**: cada feature e uma pasta que contem o
`Command` ou `Query`, o `Handler`, o `Validator` e o `Endpoint` juntos. Nada de
`Controllers/`, `Services/` e `Repositories/` como pastas de primeiro nivel.

**Arquitetura hexagonal** na fronteira: o dominio depende de interfaces, a
infraestrutura (banco, provedor de identidade, push) implementa. O modulo nao
conhece o Postgres, conhece a porta.

**DDD com dominio rico:** as invariantes moram na entidade, nao no handler. Um desafio nao aceita palpite depois de fechado porque o proprio desafio recusa, nao
porque algum `if` no servico lembrou de checar.

**Result Pattern em vez de excecao para regra de negocio.** Falha de regra e
valor de retorno (`Result<T>`), nao `throw`. Excecao fica reservada para falha de
infraestrutura — banco fora, timeout, bug. Validacao de formato de entrada nao
chega ao handler: e barrada pelo `Validator` antes.

O modulo **Validacao e separado de Desafios de proposito**. E onde vivem a maquina
de estados e a regra de quorum — a parte mais complexa do sistema. Isolada, ela
tem teste proprio e pode ser explicada para a banca sem arrastar junto o CRUD de
desafio. **Ranking e read-only**: so tem `Query`, nenhum `Command`.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Camadas tradicionais (Controller/Service/Repository) | Familiar, muito material | Uma feature vira quatro arquivos em quatro pastas; conflito de merge constante com tres devs | Espalha o que deveria ser coeso e nao ajuda em nada a avaliacao |
| Microservicos | Escala independente, fronteira dura | Seis deploys, mensageria, transacao distribuida, observabilidade | Absurdo para tres pessoas e um projeto de materia; custo de infra sem nenhum ganho na nota |
| Monolito sem modulos | Comeca mais rapido | Vira bola de lama; a fronteira do dominio nao aparece em lugar nenhum | Perde o mapeamento direto entre modulo e schema do banco (ver [0005](0005-schema-por-modulo-postgres.md)) |
| Excecao para regra de negocio | Menos codigo no caminho feliz | Fluxo de negocio escondido em `catch`; custo de stack trace em caso esperado | Regra de negocio violada e resultado previsto, nao acidente |

## Consequencias

**Positivas:** cada feature cabe numa pasta — facil de gerar com IA, facil de
revisar, quase sem conflito de merge entre os tres devs. Os modulos sao
fronteiras reais: se algum dia fizer sentido extrair um servico, o corte ja
existe. A separacao Validacao/Desafios deixa a parte complexa testavel isoladamente.

**Negativas:** ha duplicacao entre slices — dois handlers parecidos nao viram um
metodo compartilhado por padrao, e isso e intencional. Exige disciplina para nao
recriar `Services/` por reflexo. O Result Pattern e mais verboso que `throw` e
obriga a tratar o retorno em cada chamada.

**Impacto na documentacao:** [13-visao-geral.md](../13-visao-geral.md),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md).
