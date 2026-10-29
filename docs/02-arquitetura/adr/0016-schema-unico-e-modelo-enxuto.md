# 0016 - Schema único e modelo de dados enxuto

* **Status:** Aceita
* **Data:** 2026-10-02
* **Decisores:** Rafael Alves

## Contexto

O modelo chegou a 15 tabelas em seis schemas, um por módulo
([0005](0005-schema-por-modulo-postgres.md)). Para um projeto acadêmico cuja
nota vem de modelagem, constraints, transações e consultas, isso escondia o
essencial: as FKs já atravessavam todos os schemas, então a separação só
obrigava a qualificar cada nome sem acrescentar integridade.

## Decisão

Um único schema (`public`) e um modelo de dez tabelas que mantém o núcleo do
domínio: grupos, desafios, evidência com júri congelado, ledger de CP e a
moderação exigida na revisão da Entrega 1 ([0015](0015-idade-minima-e-moderacao-ia.md)).

Saem do modelo convite de grupo, comentários, credenciais, notificações e
inscrições de push. O júri e o voto passam a uma tabela só,
`jurado_evidencia`, de chave `(id_evidencia, id_usuario)`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Manter seis schemas | Fronteira de módulo visível no banco | Nomes qualificados em toda consulta, sem ganho de integridade | O ganho não paga o custo de leitura com dez tabelas |
| Manter as tabelas de suporte | Cobre todos os requisitos de interface | Dilui o foco da modelagem | Todas dependem do núcleo e podem voltar sem alterá-lo |

## Consequências

**Positivas:** modelo explicável de ponta a ponta; júri congelado e voto único
garantidos pela própria chave primária.

**Negativas:** DDL, `schema.sql`, seed, procedures e consultas ainda descrevem o
desenho anterior e precisam ser alinhados numa migration. A integração do app
com notificações, convites e comentários fica sem suporte no banco.

**Impacto na documentação:** [09](../../03-banco-de-dados/modelagem/09-evolucao-modelagem.md),
[10](../../03-banco-de-dados/modelagem/10-der.md),
[11](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[07 - Requisitos](../../01-negocio/07-requisitos.md),
[08 - Regras de Negócio](../../01-negocio/08-regras-de-negocio.md).
