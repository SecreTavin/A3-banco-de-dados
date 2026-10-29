# 2026-10-02 — Objetivos específicos focados em diversão; parte técnica movida por link

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-02 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docs/00-introducao/05-objetivos.md` |

## O que foi pedido

Tirar a parte técnica dos objetivos específicos, deixá-la onde já estiver
documentada e passar a falar de diversão e do que se pretende atingir.

## O que a IA produziu

* Seis objetivos específicos de uso (divertir, desestressar, decidir com
  justiça, manter a graça viva, brincar com segurança, ser fácil de usar).
* Seção "Objetivos Técnicos" que só aponta para os documentos onde o conteúdo
  técnico já existe (requisitos, banco de dados, integração).

## O que a IA errou

* A IA não apagou os objetivos técnicos antigos sem conferir: verificou que o
  conteúdo está coberto em `07-requisitos.md` (RNF03, RF13) e em
  `15-integracao-sistema-bd.md`. Dois itens têm cobertura só parcial: o
  **ledger append-only** e a **consulta analítica** não têm frase própria nesses
  documentos como objetivo; o time deve decidir se quer mantê-los na seção
  técnica.
* "Manter a graça viva" (ranking e histórico) é interpretação da IA sobre RF08,
  não um objetivo que o time tenha escrito antes.

## Como o time validou

Conferência dos links e das referências RF/RNF contra os arquivos do
repositório.

## Decisão final

Entra com a seção técnica reduzida a links. Alteração só no working tree, sem
commit, a pedido do grupo (apresentação).
