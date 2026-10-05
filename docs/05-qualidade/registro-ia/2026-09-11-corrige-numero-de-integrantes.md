# 2026-09-11 — Corrige número de integrantes (eram 5, não 3)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-11 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | `docs/00-introducao/01-identificacao.md`, `docs/07-entregas/entrega-1-proposta-e-requisitos.md` |

## O que foi pedido

O usuário enviou a Ficha de Inscrição já preenchida (PDF), pedindo revisão
antes do envio ao professor.

## O que a IA produziu

Comparou o PDF preenchido contra o repositório e identificou que a tabela
de integrantes tinha **5 nomes**, não 3: além de Arthur, Octávio e Rafael
(já registrados), o grupo incluiu Mario Lana Veloso Junior e Luís Phillipe
Pedra Souza. Também notou que a ordem na ficha preenchida não estava
alfabética — os dois novos nomes foram só acrescentados no fim (Arthur,
Octávio, Rafael, Mario, Luís) em vez de reordenados (correto: Arthur, Luís,
Mario, Octávio, Rafael) — e sinalizou isso ao usuário antes de editar o
repositório.

## O que a IA errou

**Este registro corrige um erro de uma sessão anterior, não desta.** Em
09/03, a IA tinha concluído que a equipe real era só 3 pessoas — inferindo
isso a partir dos autores do `git log`, e descartando corretamente os "5
nomes" do `seed.sql` como personas fictícias de teste (isso parte estava
certa). Só que a inferência "autores do git = equipe completa" estava
errada: dois integrantes (Mario e Luís) nunca tinham commitado no
repositório, então não apareciam no histórico — mas fazem parte do grupo
real, como a Ficha de Inscrição agora confirma. A IA não tinha como saber
disso sem uma fonte melhor que o `git log`, e não tinha essa fonte até
agora.

## Como o time validou

* A correção veio da própria Ficha de Inscrição preenchida pelo usuário —
  fonte primária, não inferência da IA.
* A ordem alfabética incorreta na ficha preenchida foi sinalizada ao
  usuário antes de qualquer edição no repositório, com a ordem correta
  proposta (Arthur, Luís, Mario, Octávio, Rafael) — a decisão de reenviar
  ou não a ficha corrigida ao professor é do time, não foi tomada pela IA.

## Decisão final

`01-identificacao.md` atualizado para 5 integrantes, em ordem alfabética
correta. `entrega-1-proposta-e-requisitos.md` teve a seção de pendências
manuais limpa (os itens que ela listava já estavam resolvidos desde o PR
#5, apenas não tinham sido removidos do texto).
