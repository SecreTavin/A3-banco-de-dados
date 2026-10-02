# 2026-10-02 — Modelo simplificado (10 tabelas, schema único)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `09`, `10`, `11` (modelagem); `07-requisitos.md`, `08-regras-de-negocio.md`, `05-objetivos.md`; telas 22 a 29; ADR 0005, 0011, 0016 e índice |

## O que foi pedido

Simplificar a modelagem mantendo os conceitos, em schema único, com o histórico
contando só a primeira versão e o modelo atual; limpar dos documentos o que
ficou fora.

## O que a IA produziu

Modelo de 10 tabelas em `public`. `jurado_evidencia` funde júri congelado e
voto. Saem convite, comentários, credenciais, notificações e push. Requisitos
(RF09, RF11, RF15), regra RN20 e trechos das telas foram removidos; o ADR 0016
registra a decisão e marca 0005 e 0011 como `Substituída`.

## O que a IA errou

* Na primeira versão do modelo, a IA tirou `data_nascimento`, `nivel_filtro` e
  `moderacao_desafio` como "extensão". As RN26 a RN28 vêm de exigência do
  professor (RT01) e o PR #17 as havia modelado de propósito. A IA só percebeu
  ao ir limpar as RNs; os três elementos foram restaurados.
* A IA também havia removido `avatar_url` sem necessidade; restaurado.
* Houve três propostas antes da reescrita pedida (roteiro, visão MVP aditiva,
  modelo reduzido); as duas primeiras foram descartadas.
* **Ficam inconsistentes com o modelo**, por decisão do time de deixar para a
  migration: `12-ddl-schema.md`, `schema.sql`, `seed.sql`, as consultas, as
  procedures (`apurar_votacao` lê `validador_evidencia` e `voto_evidencia`), o
  trigger de voto (agora deveria atuar em `UPDATE` de `jurado_evidencia`) e o
  caso de teste T16 (convite) em `17-testes.md`.
* O ADR 0016 foi escrito pela IA com o nome do decisor inferido do contexto de
  quem conduziu a sessão; revisar.
* Nada foi executado contra banco; é só documentação. Mermaid não renderizado.

## Como o time validou

Conferência das 10 tabelas do DER contra o modelo lógico, busca por
`RF09|RF11|RF15|RN20|convite` nos documentos de negócio (sem ocorrências
restantes fora do DDL e dos testes) e leitura das telas editadas.

## Decisão final

Entram os documentos acima. Pendências: alinhar DDL, procedures, seed, consultas
e testes ao modelo.
