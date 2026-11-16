# 2026-11-16 — Demonstração pública na VM da Oracle

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-16 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | VM da Oracle (checkout, compose, banco restaurado, túnel da Cloudflare), ADR 0020 (novo), ADR 0019, documento 16, índice de ADRs, `SUMMARY.md` |

## O que foi pedido

Subir o sistema numa VM da Oracle que já existia, para o professor testar, com
uma cópia do banco de desenvolvimento. Depois, documentar a publicação.

## Prompt utilizado

> vamos subir na VM que ja existe o focadu o projeto da a3 só para o professor testar, pode clonar o banco de dados mockado para la

> pode rodar os dois comandos, autorizado

> abra um pr atualizando a documentação que isso subiu para prod

## O que a IA produziu

* Clone do repositório na VM e um `docker-compose.override.yml` só da VM: sem
  portas publicadas, `web` em `127.0.0.1:5380`, banco sem *initdb* e
  `restart: unless-stopped`.
* Uma configuração do nginx que repassa `/api/` e `/hubs/` para a API, no mesmo
  modelo de mesma origem do Worker do ADR 0019.
* `pg_dump` do volume de desenvolvimento e `pg_restore` na VM.
* Rota `euduvido.falveshub.com` no túnel nomeado que já existia, com backup do
  arquivo de configuração antes da mudança, e o CNAME correspondente.
* O ADR 0020, a seção nova do documento 16 e a marcação do ADR 0019 como
  substituído.

## O que a IA errou

* **Tentou subir o container de banco local que estava parado** para fazer o
  dump. A porta 5432 do Mac já estava ocupada por outro Postgres e o container
  não subiu. A correção foi rodar um container temporário sobre o mesmo volume,
  sem publicar porta.
* **Tentou alterar o túnel da Cloudflare sem confirmação explícita.** O túnel
  também serve a produção de outro projeto, e reiniciá-lo derruba esse projeto
  por alguns segundos. O modo automático do Claude Code bloqueou a ação; a IA
  parou, explicou o impacto e só aplicou a mudança depois da autorização do
  Rafael.

## Como o time validou

* Depois da restauração, a contagem no banco da VM bateu com a de
  desenvolvimento (10 usuários, 11 desafios, 78 lançamentos de CP), as 4
  migrations do dump bateram com as do código, e `vw_reconciliacao_saldo` e
  `vw_escrow_orfao` voltaram vazias.
* `curl` em `https://euduvido.falveshub.com/` respondeu 200, e
  `POST /api/auth/dev/login` pelo endereço público devolveu token, o que prova o
  repasse do nginx até a API.
* Os outros endereços do mesmo túnel continuaram respondendo 200 depois do
  reinício do `cloudflared`.
* O `ingress validate` do `cloudflared` passou antes do reinício.

## Decisão final

O sistema fica publicado na VM. O override e o nginx da VM não entram no
repositório: o ADR 0020 e o documento 16 descrevem o que eles fazem. A
documentação entra por este PR.
