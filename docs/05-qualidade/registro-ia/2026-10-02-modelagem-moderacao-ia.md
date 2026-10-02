# 2026-10-02 — Modelagem de dados da moderação por IA (ADR 0015)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves (documentação) |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `10-der.md`, `11-modelo-logico.md`, `08-regras-de-negocio.md` (RN26, RN28), ADR 0015 |

## O que foi pedido

Refletir na modelagem as mudanças do ADR 0015 (idade mínima e moderação de
desafios por IA) antes da revisão em sala da Entrega 2.

## O que a IA produziu

Coluna `usuario.data_nascimento`, coluna `grupo_amigos.nivel_filtro`, tabela
`apostas.moderacao_desafio` com suas constraints, atualização do DER e da
seção de detalhamento no ADR.

## O que a IA errou

* O ADR 0015 (também escrito com IA) pedia idade mínima por `CHECK`; isso não
  funciona no PostgreSQL porque `CURRENT_DATE` não é imutável. A IA apontou o
  problema e trocou por trigger, mas o ADR original ficava incompleto sem o
  detalhamento — foi preciso acrescentá-lo.
* A IA listou 12-ddl-schema.md e 16-consultas-sql.md como impactados; o time
  decidiu **não** alterá-los, porque o DDL é saída da migration (ADR 0004) e
  descreve o que roda de verdade. Editar agora o faria divergir do banco.
* A IA escreveu "quinze tabelas" no modelo lógico, contando a partir do texto
  do próprio doc ("catorze"). Ao contar os títulos de tabela no arquivo, eram
  15 antes da moderação e 16 depois: o número antigo já estava defasado. O
  time corrigiu para dezesseis.
* O ADR não definia a relação de `moderacao_desafio` com `aposta`. A IA propôs
  FK opcional e cópia do nível de filtro; são escolhas de modelagem, não fatos
  do ADR, e precisam de revisão humana.

## Como o time validou

Conferência de que `data_nascimento`, `nivel_filtro` e `moderacao_desafio` não
existiam em `database/`, `apps/` ou `docs/`; releitura das RN26–RN28 contra as
constraints citadas. **Não** foi executado SQL: o modelo ainda não tem
migration, então as constraints não foram testadas em PostgreSQL.

## Decisão final

Só documentação. A migration, o domínio e a sincronização do DDL ficam para as
issues #10, #11, #12 e #15, que devem validar este modelo ao implementá-lo.
