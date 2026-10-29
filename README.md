# Eu Duvido! - Plataforma de Desafios Sociais Entre Amigos

Projeto A3 da Unidade Curricular de **Banco de Dados** (Grupo Ânima Educação /
Centro Universitário UNA).

* **Professor Orientador:** Prof. Mário Sérgio Caldas Teixeira
* **Semestre Letivo:** 2026/2
* **Documentação:** GitBook (Docs-as-Code via GitHub)

## Como rodar

Requisito único: Docker.

```bash
docker compose up
```

Sobe PostgreSQL, MinIO, API e frontend. Quando os quatro estiverem de pé:

| Serviço | Endereço |
| --- | --- |
| Aplicação | <http://localhost:8080> |
| API (Swagger) | <http://localhost:5080/swagger> |
| MinIO (console) | <http://localhost:9001> |
| PostgreSQL | `localhost:5432` — `euduvido` / `euduvido` |

O banco já sobe povoado. O login é por seleção de usuário — sem senha, sem
Google — porque `Auth:Provider` está em `Dev`. Os cinco usuários disponíveis são
**Tavin**, **Biel**, **Theus**, **Lari** e **Lipe**.

### Roteiro de demonstração

O seed deixa o sistema no estado exato para isto:

1. Entre como **Lari** e vá para a Central de Votação.
2. A evidência do desafio *"Correr 5km abaixo de 25 minutos"* está aguardando um
   voto — o quórum é 2 e já há 1 voto favorável.
3. Vote `VÁLIDO`.
4. A apuração roda dentro do banco, numa transação: a evidência vira `ACEITA`, o desafio vira `FINALIZADA_CUMPRIU`, o pote de CP é transferido aos vencedores e
   quem votou recebe 2 CP.
5. Abra a mesma tela em outro navegador antes de votar — a contagem se move ao
   vivo por SignalR.

Para conferir que a contabilidade fechou:

```bash
docker exec euduvido-db-1 psql -U euduvido -d euduvido \
  -c "SELECT * FROM vw_reconciliacao_saldo;" \
  -c "SELECT * FROM vw_escrow_orfao;"
```

As duas views devem vir **vazias**. Qualquer linha é bug de contabilidade.

### Moderação de desafios por IA

Toda proposta de desafio passa por um modelo de linguagem antes de virar desafio,
no nível de filtro do grupo
([ADR 0015](docs/02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md)). O
provedor é a **Groq**. A chave fica fora do repositório: copie `.env.example`
para `.env` (ignorado pelo git) e preencha `IA_API_KEY` — o `docker compose` lê
o arquivo sozinho.

| Variável (`docker compose`) | Configuração da API | Padrão |
| --- | --- | --- |
| `IA_API_KEY` | `Ia__ApiKey` | vazio — a chave da Groq |
| `IA_BASE_URL` | `Ia__BaseUrl` | `https://api.groq.com/openai/v1` |
| `IA_MODELO` | `Ia__Modelo` | `openai/gpt-oss-120b` |

O ADR 0015 cita modelos Llama, mas a Groq aposentou o `llama-3.3-70b-versatile`
em 16/08/2026 e já não oferece Llama no plano gratuito. O padrão passou a ser o
`openai/gpt-oss-120b`, também de pesos abertos e indicado pela própria Groq como
substituto. Trocar de modelo é só mudar `IA_MODELO`.

Sem a chave a API sobe normalmente, mas criar desafio responde **503** — nada é
aprovado sem avaliação. O roteiro de demonstração acima não depende da IA.

## Desenvolvimento local

```bash
docker compose up -d db storage        # só a infraestrutura
cd apps/api/EuDuvido.Api && dotnet run # API em http://localhost:5100
cd apps/web && npm install && npm run dev
```

A API aplica as migrations na subida. O front procura a API em `VITE_API_URL`
(veja `apps/web/.env.example`); sem a variável, usa `http://localhost:5100`.

## Estrutura

```text
apps/
  api/                   API .NET 10 - monólito modular, vertical slice
    EuDuvido.Api/
      Modules/           Identidade, Grupos, Desafios, Validacao, Economia, Ranking
      Shared/            Auth, Database, Ia, Results, Realtime
    EuDuvido.Api.Tests/  Testes de constraint, domínio e integração
  web/                   React + TypeScript + Vite
database/scripts/
  ddl/schema.sql         GERADO pelas migrations - não editar à mão
  ddl/functions/         Procedures, triggers e views (escritos à mão)
  dml/seed.sql           Massa de demonstração
  queries/               Consultas analíticas
scripts/entregas/        Automação da documentação de entrega (ver abaixo)
docs/                    Documentação por tipo - ver docs/README.md
```

## Arquitetura em três linhas

A apuração de quórum e a liquidação de CP acontecem **dentro do PostgreSQL**,
numa única transação — não existe estado em que a evidência foi aceita mas o CP
não foi transferido. O SignalR apenas notifica que a transação commitou. As 53
decisões de arquitetura estão registradas em
[14 ADRs](docs/02-arquitetura/adr/README.md).

Índice completo da documentação em [docs/README.md](docs/README.md).

## Entregas do Projeto A3

O edital define 4 entregas parciais mais a banca final (seção 20 do
documento do professor). O status de cada uma — o que já está pronto, o que
falta, e os documentos que comprovam cada item — é acompanhado em
[docs/07-entregas/](docs/07-entregas/README.md) e **gerado automaticamente**,
não mantido à mão.

```bash
node scripts/entregas/gerar-entregas.mjs
```

Esse comando lê [`scripts/entregas/manifest.json`](scripts/entregas/manifest.json)
(a lista, por entrega, de quais documentos/scripts/pastas de código precisam
existir), confere o estado real do repositório e reescreve as tabelas de
status dentro de `docs/07-entregas/*.md`. Como boa parte da modelagem, do
banco e do sistema já foi implementada antes da data de revisão em sala, as
entregas futuras já aparecem parcialmente ✅ — é o "deixar em construção com
conteúdo pronto".

### Como fechar uma entrega

1. Resolver as pendências listadas no documento da entrega em
   `docs/07-entregas/`.
2. Rodar `node scripts/entregas/gerar-entregas.mjs` e conferir 100% na
   checklist.
3. Commitar, abrir PR, mesclar na `main`.
4. Criar e enviar a tag da entrega:

   ```bash
   git tag entrega-1          # ou entrega-2, entrega-3, entrega-4, banca-final
   git push origin entrega-1
   ```

5. **Rodar o gerador de novo** — só agora, com a tag já existindo, ele
   calcula "Entregue" pra essa entrega. O commit do passo 3 não tinha
   como prever isso: a tag não existia ainda quando ele foi feito.
   Commitar o resultado, abrir PR, mesclar.
6. Mover a tag pro commit do passo 5 e reenviar:

   ```bash
   git tag -f entrega-1
   git push --force origin entrega-1
   ```

Só depois do passo 6 o workflow [`entregas.yml`](.github/workflows/entregas.yml)
publica a Release: o `--check` do job `checklist` compara o commit da tag
contra o que o gerador produziria, e só passa quando os dois batem — pular o
passo 5 faz a tag ficar "presa" com o job `release` sempre `skipped`. Depois
disso, o histórico de releases do repositório vira, sozinho, o registro de
todas as entregas feitas.
