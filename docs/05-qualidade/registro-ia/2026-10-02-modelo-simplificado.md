# 2026-10-02 — Modelo simplificado (9 tabelas)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `10-der.md`, `11-modelo-logico.md`, `09-evolucao-modelagem.md` |

## O que foi pedido

Refazer a modelagem de forma mais simples, mantendo todos os conceitos, para
facilitar a explicação na revisão em sala da Entrega 2. Migration e app fora
do escopo.

## O que a IA produziu

Modelo com 9 tabelas em um único schema (`public`); a primeira versão tinha 5 schemas e o time pediu schema único em seguida. O histórico passou a contar só a primeira versão (8 tabelas) e o modelo atual, por decisão do time; a versão intermediária de 15 tabelas ficou apenas no histórico de commits. Principal ideia: `jurado_evidencia`
funde `validador_evidencia` e `voto_evidencia` (júri congelado e voto na mesma
linha). Saem `credencial_usuario`, `convite_grupo`, `comentario_aposta`,
`notificacao` e `push_subscription`; `valor_monetario` e `descricao_prenda`
viram `descricao_recompensa`.

## O que a IA errou

* Primeiro propôs só um roteiro de fala e depois uma visão MVP aditiva; o time
  pediu a reescrita do modelo. A visão MVP foi descartada.
* A IA reescreveu apenas os docs 09, 10 e 11. **Ficam inconsistentes com a v3**:
  `12-ddl-schema.md`, `schema.sql`, `seed.sql`, as consultas, as procedures
  (`apurar_votacao` lê `validador_evidencia`/`voto_evidencia`), o trigger de
  voto, as RN 20, 26, 27 e 28 em `08-regras-de-negocio.md`, e os ADRs 0005
  (lista de tabelas), 0011 e 0015. Foi decisão do time deixar para a migration.
* O trigger de prazo de voto (RN19) agora deveria atuar em `UPDATE` de
  `jurado_evidencia`; isso é descrito no doc, mas não foi escrito nem testado.
* O ADR 0005 (schema por módulo) segue como `Aceita`, mas o modelo v3 o contradiz. A regra do projeto manda marcá-lo `Substituída` e criar ADR novo; **não foi feito**, é pendência.
* Nada foi executado contra banco; é só documentação.

## Como o time validou

Conferência das 9 tabelas do DER contra o modelo lógico (mesmos nomes e
relações) e contagem do resumo da evolução. Renderização do Mermaid não
testada.

## Decisão final

Entram os três documentos reescritos. O resto fica como pendência listada
acima, a tratar quando o modelo for para migration.
