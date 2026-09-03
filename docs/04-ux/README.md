# 04 - UX e Refinamento de Telas

Levantamento das telas do app "Eu Duvido!", derivado dos requisitos ([07](../01-negocio/07-requisitos.md)), regras de negócio ([08](../01-negocio/08-regras-de-negocio.md)) e do schema ([12](../03-banco-de-dados/implementacao/12-ddl-schema.md)). Cada arquivo em [telas/](telas/) descreve uma tela: objetivo, seções principais, dados de origem, decisões já validadas com o time, o que foi resolvido na arquitetura e os TODOs que ainda seguem em aberto.

Os TODOs levantados no refinamento **foram resolvidos** pelas decisões de arquitetura e pela modelagem definitiva do banco: cada tela agora tem uma seção "Resolvido na arquitetura" dizendo **como** a questão foi fechada e apontando o [ADR](../02-arquitetura/adr/) ou a regra de negócio correspondente. As telas ficaram alinhadas ao schema por módulo do PostgreSQL ([ADR 0005](../02-arquitetura/adr/0005-schema-por-modulo-postgres.md)) e à adoção do CP como moeda única ([ADR 0006](../02-arquitetura/adr/0006-cp-como-moeda.md)) — por isso os nomes de tabela aparecem qualificados por schema (`identidade.usuario`, `apostas.aposta`, `validacao.evidencia`, ...).

## Telas

* [22 - Autenticação](telas/22-tela-autenticacao.md)
* [23 - Meus Grupos](telas/23-tela-meus-grupos.md)
* [24 - Minhas Apostas](telas/24-tela-minhas-apostas.md)
* [25 - Criar Desafio](telas/25-tela-criar-desafio.md)
* [26 - Detalhe da Aposta](telas/26-tela-detalhe-aposta.md)
* [27 - Central de Votação](telas/27-tela-central-votacao.md)
* [28 - Ranking](telas/28-tela-ranking.md)
* [29 - Perfil](telas/29-tela-perfil.md)
