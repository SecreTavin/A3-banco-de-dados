# 2026-11-07 — ADR 0010 com a hospedagem que existe de fato

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-07 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | ADR 0010 (status e quadro "Situação em 07/11/2026"), índice dos ADRs, ADR 0019 (atualização), `tecnologias.md` (linhas de hospedagem e CI), documento 19 (limitação de hospedagem) |

## O que foi pedido

Corrigir o ADR 0010, que ainda dizia que o projeto usava Vercel, Render e Aiven,
com o que é verdade hoje.

## Prompt utilizado

> Vamos consertar a ADR 0010 com as informações atuais e veridicas do projeto

## O que a IA produziu

* **O ADR 0010 continua com o texto original** e passou a `Substituída` pelo
  0019, como manda a regra do índice: "decisão superada é marcada como
  `Substituída`", em vez de reescrita.
* **Um quadro "previsto × existe de fato"** no topo do 0010, item por item, cada
  um conferido no repositório:
  * contas nunca criadas, Worker e túnel no lugar;
  * banco sem backup, refeito pelo seed;
  * MinIO no lugar do R2, sem upload direto;
  * migrations no `MigrateAsync()` da API;
  * CI com schema, seed, consultas e views;
  * `main` sem proteção de branch;
  * `Maximum Pool Size=15` no `docker-compose.yml`.
* **As linhas de hospedagem e de CI do `tecnologias.md`**, com o ADR que vale
  hoje.
* **O documento 19:** a limitação "plano gratuito do Aiven" virou "hospedagem de
  demonstração", porque o Aiven nunca foi usado.

## O que a IA errou

* **Quase reescreveu o ADR.** A primeira ideia era editar a decisão do 0010 para
  descrever a Cloudflare. Isso violaria a regra do projeto de nunca reescrever
  ADR. A correção virou status e quadro de situação, sem mexer no texto
  original.
* **Afirmação sobre a mídia sem conferir.** O primeiro rascunho dizia "MinIO,
  compatível com S3", como se a API usasse o MinIO. Na busca no código, a API não
  tem cliente de armazenamento: grava só a URL da evidência. O quadro foi
  corrigido.

## Como o time validou

Cada linha do quadro foi conferida contra o repositório ou o GitHub:

| Afirmação | Onde foi conferida |
| --- | --- |
| Contas de hospedagem nunca criadas | Nenhum `vercel.json`, `render.yaml` ou workflow de deploy no repositório |
| Migrations ao subir | `Program.cs` chama `MigrateAsync()` |
| CI | Passos do `ci.yml` |
| Sem proteção de branch | `gh api …/branches/main/protection` respondeu "Branch not protected" |
| Pool | `docker-compose.yml` |
| Sem cliente de armazenamento | Busca por `AmazonS3`, `Minio` e `IStorage` em `apps/api` não achou nada |

O gerador de entregas foi rodado com `--check` sem erro.

## Decisão final

Entram o status `Substituída`, o quadro de situação e as linhas corrigidas.

Ficaram de fora, para decisão do PO, outras linhas do `tecnologias.md` que
também não batem com o código:

* "Grafana Cloud" e "Google OAuth" aparecem como "Em uso";
* o schema por módulo já foi substituído pelo 0016;
* não há teste que falhe quando uma Query toca o EF;
* não há cliente gerado a partir do OpenAPI.

Também ficaram as menções ao Aiven como justificativa do pool nos documentos 13,
15 e 16 e no ADR 0013.
