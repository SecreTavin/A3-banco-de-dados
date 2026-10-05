# 2026-09-09 — Fecha pendências da Entrega 1

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-09 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | `docs/00-introducao/01-identificacao.md`, `docs/00-introducao/05-objetivos.md` |

## O que foi pedido

Fechar as duas pendências que travavam a Entrega 1 no checklist automático
(7/9): identificação do grupo e objetivos específicos.

## O que a IA produziu

* **Objetivos específicos** ([05-objetivos.md](../../00-introducao/05-objetivos.md)):
  seis objetivos redigidos a partir dos RFs/RNFs já documentados em
  [07-requisitos.md](../../01-negocio/07-requisitos.md), amarrando cada um a
  um requisito existente — sem inventar escopo novo.
* **Identificação do grupo** ([01-identificacao.md](../../00-introducao/01-identificacao.md)):
  a IA **não preencheu RA nem e-mail por conta própria** — são dados
  pessoais que não existem em nenhum lugar do repositório. Cruzou os
  autores do `git log` para propor os 3 nomes (confirmando o que o registro
  de 03/09 já apontava: a equipe é 3 pessoas, os "5 nomes" do `seed.sql` são
  persona de teste), e pediu ao usuário RA e e-mail de cada um antes de
  editar qualquer coisa.

## O que a IA errou

Nenhum erro identificado nesta alteração. O ponto de risco óbvio — assumir
ou inventar RA/e-mail dos integrantes pra "destravar" o checklist mais
rápido — foi evitado ao tratar esse dado como algo que só o usuário pode
fornecer.

## Como o time validou

* `node scripts/entregas/gerar-entregas.mjs` confirmou 9/9 depois da edição.
* Ao receber os dados de identificação, a IA identificou e **sinalizou ao
  usuário, sem alterar nada**, duas inconsistências para confirmação humana:
  o RA de um integrante tem 8 dígitos contra 9 dos outros dois, e dois dos
  três e-mails são pessoais (Gmail) enquanto um é institucional
  (`@ulife.com.br`) — a Ficha de Inscrição pode exigir padronização.
  **Essas duas checagens ficam pendentes de confirmação do time antes do
  envio da Ficha.**
* Os seis objetivos específicos precisam de leitura humana antes do fechamento
  — cada um foi ancorado num RF/RNF existente, mas a redação final é
  responsabilidade do grupo.

## Decisão final

Entrega 1 sai de 7/9 para 9/9. Os dois itens fora do escopo do script
(RA/e-mail inconsistentes e o envio da Ficha de Inscrição) continuam
pendências reais, só que agora sinalizadas explicitamente em vez de
escondidas atrás do checklist verde.
