# Summary

* [Eu Duvido!](README.md)
* [Documentação](docs/README.md)

## Acompanhamento

* [07 - Entregas](docs/07-entregas/README.md)
  * [Entrega 1 - Proposta e Requisitos](docs/07-entregas/entrega-1-proposta-e-requisitos.md)
  * [Entrega 2 - Modelagem](docs/07-entregas/entrega-2-modelagem.md)
  * [Entrega 3 - Banco de Dados](docs/07-entregas/entrega-3-banco-de-dados.md)
  * [Entrega 4 - Sistema Funcional](docs/07-entregas/entrega-4-sistema-funcional.md)
  * [Banca Final](docs/07-entregas/banca-final.md)

## Contexto

* [00 - Introdução](docs/00-introducao/README.md)
  * [01 - Identificação](docs/00-introducao/01-identificacao.md)
  * [02 - Introdução Geral](docs/00-introducao/02-introducao.md)
  * [03 - Problema e Contexto](docs/00-introducao/03-problema-e-contexto.md)
  * [04 - Justificativa](docs/00-introducao/04-justificativa.md)
  * [05 - Objetivos](docs/00-introducao/05-objetivos.md)
  * [06 - Público-Alvo](docs/00-introducao/06-publico-alvo.md)
  * [07 - Plano de Trabalho](docs/00-introducao/07-plano-de-trabalho.md)

## Negócio

* [01 - Negócio](docs/01-negocio/README.md)
  * [07 - Requisitos do Sistema](docs/01-negocio/07-requisitos.md)
  * [08 - Regras de Negócio](docs/01-negocio/08-regras-de-negocio.md)

## Técnico

* [02 - Arquitetura](docs/02-arquitetura/README.md)
  * [13 - Visão Geral da Arquitetura](docs/02-arquitetura/13-visao-geral.md)
  * [14 - Desenvolvimento do Sistema](docs/02-arquitetura/14-desenvolvimento-sistema.md)
  * [15 - Integração Sistema e Banco de Dados](docs/02-arquitetura/15-integracao-sistema-bd.md)
  * [16 - Execução Local e Ambiente](docs/02-arquitetura/16-execucao-local.md)
  * [Tecnologias e Stack](docs/02-arquitetura/tecnologias.md)
  * [ADRs](docs/02-arquitetura/adr/README.md)
    * [Template de ADR](docs/02-arquitetura/adr/0000-template.md)
    * [0001 - Stack tecnológica](docs/02-arquitetura/adr/0001-stack-tecnologica.md)
    * [0002 - Monólito modular com vertical slice](docs/02-arquitetura/adr/0002-monolito-modular-vertical-slice.md)
    * [0003 - CQRS com Dapper e EF Core](docs/02-arquitetura/adr/0003-cqrs-dapper-ef.md)
    * [0004 - schema.sql gerado por migration](docs/02-arquitetura/adr/0004-schema-sql-gerado-por-migration.md)
    * [0005 - Um schema PostgreSQL por módulo](docs/02-arquitetura/adr/0005-schema-por-modulo-postgres.md)
    * [0006 - CP como moeda única](docs/02-arquitetura/adr/0006-cp-como-moeda.md)
    * [0007 - Ledger append-only](docs/02-arquitetura/adr/0007-ledger-append-only.md)
    * [0008 - Quórum congelado por evidência](docs/02-arquitetura/adr/0008-quorum-congelado.md)
    * [0009 - Mídia no Cloudflare R2](docs/02-arquitetura/adr/0009-armazenamento-de-midia-r2.md)
    * [0010 - Hospedagem e deploy](docs/02-arquitetura/adr/0010-hospedagem-e-deploy.md)
    * [0011 - Notificações e Web Push](docs/02-arquitetura/adr/0011-notificacoes-web-push.md)
    * [0012 - Contrato via OpenAPI](docs/02-arquitetura/adr/0012-contrato-openapi.md)
    * [0013 - Observabilidade](docs/02-arquitetura/adr/0013-observabilidade.md)
    * [0014 - Estratégia de testes](docs/02-arquitetura/adr/0014-estrategia-de-testes.md)
* [03 - Banco de Dados](docs/03-banco-de-dados/README.md)
  * [Modelagem](docs/03-banco-de-dados/modelagem/README.md)
    * [09 - Evolução da Modelagem](docs/03-banco-de-dados/modelagem/09-evolucao-modelagem.md)
    * [10 - Diagrama Entidade-Relacionamento (DER)](docs/03-banco-de-dados/modelagem/10-der.md)
    * [11 - Modelo Lógico](docs/03-banco-de-dados/modelagem/11-modelo-logico.md)
  * [Implementação](docs/03-banco-de-dados/implementacao/README.md)
    * [12 - Implementação do Banco de Dados (DDL)](docs/03-banco-de-dados/implementacao/12-ddl-schema.md)
    * [13 - Povoamento (DML)](docs/03-banco-de-dados/implementacao/13-povoamento-dml.md)
    * [16 - Consultas SQL Estratégicas](docs/03-banco-de-dados/implementacao/16-consultas-sql.md)
* [05 - Qualidade](docs/05-qualidade/README.md)
  * [17 - Casos de Teste e Validação](docs/05-qualidade/17-testes.md)
  * [18 - Registro de Programação Assistida por IA](docs/05-qualidade/18-registro-ia.md)
    * [Modelo de registro](docs/05-qualidade/registro-ia/0000-modelo.md)
    * [2026-09-03 - Arquitetura e reorganização](docs/05-qualidade/registro-ia/2026-09-03-arquitetura-e-reorganizacao.md)
    * [2026-09-03 - Implementação da API e do banco](docs/05-qualidade/registro-ia/2026-09-03-implementacao-api-e-banco.md)
    * [2026-09-03 - Frontend React e as telas](docs/05-qualidade/registro-ia/2026-09-03-frontend-react-telas.md)

## Produto

* [04 - UX e Refinamento de Telas](docs/04-ux/README.md)
  * [22 - Tela: Autenticação](docs/04-ux/telas/22-tela-autenticacao.md)
  * [23 - Tela: Meus Grupos](docs/04-ux/telas/23-tela-meus-grupos.md)
  * [24 - Tela: Minhas Apostas](docs/04-ux/telas/24-tela-minhas-apostas.md)
  * [25 - Tela: Criar Desafio](docs/04-ux/telas/25-tela-criar-desafio.md)
  * [26 - Tela: Detalhe da Aposta](docs/04-ux/telas/26-tela-detalhe-aposta.md)
  * [27 - Tela: Central de Votação](docs/04-ux/telas/27-tela-central-votacao.md)
  * [28 - Tela: Ranking](docs/04-ux/telas/28-tela-ranking.md)
  * [29 - Tela: Perfil](docs/04-ux/telas/29-tela-perfil.md)

## Encerramento

* [06 - Encerramento](docs/06-encerramento/README.md)
  * [19 - Limitações e Melhorias Futuras](docs/06-encerramento/19-limitacoes-e-melhorias.md)
  * [20 - Conclusão](docs/06-encerramento/20-conclusao.md)
  * [21 - Referências](docs/06-encerramento/21-referencias.md)
