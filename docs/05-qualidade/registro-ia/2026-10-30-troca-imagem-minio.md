# 2026-10-30 — Troca da imagem do MinIO e subida do compose do zero

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `docker-compose.yml`, `docs/02-arquitetura/16-execucao-local.md` |

## O que foi pedido

Na véspera da apresentação, `docker compose up` falhava nesta máquina porque as
imagens `minio/minio` e `minio/mc` não eram puxadas do Docker Hub. Pedido:
explicar o problema, trocar a imagem com o menor impacto possível e provar que o
sistema completo sobe.

## O que a IA produziu

* Troca das duas imagens por `bitnamilegacy/minio:2025.7.23` (mesmo MinIO, versão
  fixa, já com o cliente `mc`) e ajuste do volume e do healthcheck.
* Laço de tentativas no `storage-init`.
* `DB_PORT` para o banco, porque a porta 5432 do host estava ocupada por outro
  Postgres local.
* Atualização do documento 16.

## O que a IA errou

* **Afirmou que haveria teste de upload de evidência.** Antes de mexer, a IA
  prometeu testar o upload. Ao ler o código, viu que a API não usa o MinIO: o
  endpoint de evidência recebe só uma URL (`UrlComprovante`) e nenhum `.cs` lê a
  seção `Storage`. A promessa foi retirada e o documento 16, que sugeria o
  contrário, ganhou uma nota de estado atual.
* **Healthcheck que passava cedo demais.** O `storage-init` falhou na primeira
  subida (`connection refused`): a imagem Bitnami sobe o MinIO para configurar,
  derruba e sobe de novo, e o healthcheck passou na primeira instância. Só
  apareceu ao rodar; o laço de tentativas corrigiu.
* **Causa do `pull access denied` não verificada.** A IA suspeitou que o MinIO
  tenha parado de publicar a imagem gratuita no Docker Hub, mas não confirmou; o
  documento registra apenas o que foi observado.

## Como o time validou

* `docker compose down -v` seguido de `docker compose up -d --build`: todos os
  serviços saudáveis, `storage-init` com saída 0 e bucket `evidencias` criado
  com leitura pública (`mc ls local`).
* Roteiro e2e (`scripts/testes/roteiro-e2e.py`) no stack completo, num banco
  recém-criado: 18 de 18 aprovados.
* O console web na porta 9001 não respondeu nessa versão; foi registrado no
  documento 16, pois nada depende dele.

## Decisão final

Entra a troca de imagem, o retry do init e o `DB_PORT`. O upload de arquivo para
o bucket continua fora do escopo e está descrito como evolução.
