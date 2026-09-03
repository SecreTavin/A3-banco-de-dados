# 2026-09-03 — Reorganização da documentação e decisões de arquitetura

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-03 |
| **Responsável** | Arthur Marzano |
| **Ferramenta** | Claude Code (Opus) |
| **Artefato afetado** | Estrutura de `docs/`, `database/scripts/ddl/`, 14 ADRs, requisitos, regras de negócio, `CLAUDE.md` |

## O que foi pedido

Três tarefas encadeadas: reorganizar toda a documentação numa pasta `docs/`
separada por tipo; explicar o produto e apontar lacunas nas regras; e conduzir
uma sessão de decisão de arquitetura em formato de sabatina, definindo stack,
banco, formato da aplicação e tudo que isso engloba.

## O que a IA produziu

* Reestruturação de 21 documentos em `docs/` com sete seções por tipo,
  preservando o histórico do git através de `git mv` e reescrevendo as
  referências cruzadas.
* Análise do produto cruzando requisitos, regras de negócio, telas e schema, que
  identificou sete lacunas — das quais **cinco não estavam registradas em
  nenhum TODO**: quórum sem conjunto de validadores definido, evidência sem
  status, regra de cancelamento contraditória entre duas telas, notificação sem
  requisito e ausência de mecanismo de transição de estado.
* Condução de 53 decisões de arquitetura em sete rodadas de perguntas.
* 14 ADRs, schema reescrito com seis schemas modulares, procedures de apuração e
  economia, triggers de invariante e views analíticas.

## O que a IA errou

**Recomendação incorreta sobre empate na votação.** A IA recomendou que empate
resultasse em recusa imediata da evidência, classificando a alternativa "mantém
em votação até expirar" como armadilha. O time escolheu a segunda, e estava
certo: a opção recomendada punia quem enviou prova legítima antes de esgotar a
chance de desempate. A regra final (RN16) é a do time.

**Confusão entre momento e destino do escrow.** Ao perguntar quando o CP sai da
carteira, a IA misturou duas decisões independentes — o instante do débito e o
lugar onde o CP fica retido — numa única pergunta com alternativas mal separadas.
O time respondeu de forma coerente com sua intenção, mas a combinação escolhida
teria quebrado a reconciliação do ledger. Foi necessário reabrir a questão numa
rodada seguinte, agora separando as duas dimensões.

**Afirmação sobre EF Core sem verificação.** A IA planejava documentar o
carregamento de arquivos `.sql` em migrations sem confirmar a API. Verificação
posterior contra a documentação da Microsoft mostrou que **`migrationBuilder.SqlFile()`
não existe no EF Core** — é API do EF6. O padrão correto (embedded resource) só
entrou na documentação por causa da checagem.

**Suposição incorreta sobre o time.** A IA assumiu que os cinco nomes do
`seed.sql` eram a equipe. São personas fictícias de teste; a equipe real tem três
pessoas, identificadas pelos autores dos commits.

**Sugestões de infraestrutura sem justificativa de domínio.** Nas primeiras
rodadas a IA aceitou discutir Redis e Kafka como opções em aberto antes de
verificar se havia carga ou desacoplamento que os justificasse. Ambos foram
cortados depois, com o argumento correto registrado em
[tecnologias.md](../../02-arquitetura/tecnologias.md).

## Como o time validou

* Toda decisão de arquitetura foi apresentada com alternativas e trade-offs
  explícitos, e **decidida pelo time**, não pela IA. Em pelo menos duas ocasiões
  a decisão do time contrariou a recomendação.
* Fatos sobre o ecossistema .NET (EF Core, Dapper, SignalR, Web Push,
  Testcontainers) e sobre limites de fornecedores (Aiven, Neon, Supabase) foram
  verificados contra documentação primária, com as URLs registradas em
  [13-visao-geral.md](../../02-arquitetura/13-visao-geral.md).
* Todos os links internos da documentação foram validados por script após a
  reorganização.

**Pendência de validação:** o `schema.sql` e as procedures **não foram
executados** contra um PostgreSQL real nesta sessão — o Docker não estava
disponível na máquina. A validação sintática e semântica do DDL continua
pendente e é pré-requisito para fechar o [documento 12](../../03-banco-de-dados/implementacao/12-ddl-schema.md).

## Decisão final

Documentação reorganizada e decisões registradas em 14 ADRs. O schema entra como
proposta a ser validada contra um banco real antes de virar migration.
