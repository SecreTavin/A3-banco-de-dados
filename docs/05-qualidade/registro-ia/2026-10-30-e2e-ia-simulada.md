# 2026-10-30 — E2E da moderação por IA com provedor simulado

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `scripts/testes/ia-falsa.mjs`, `scripts/testes/roteiro-e2e-ia.mjs`, `scripts/testes/compose.ia-falsa.yml`, `docs/05-qualidade/17-testes.md` |

## O que foi pedido

Cobrir o ponto que os roteiros de API e de tela deixaram de fora: criar desafio
com a moderação por IA respondendo. O ambiente de teste não tem a chave da Groq,
então a IA só aparecia falhando.

## O que a IA produziu

* Um provedor de IA **simulado** (`ia-falsa.mjs`, Node sem dependências) que
  cumpre o contrato lido em `ChatIa.cs`: `POST /v1/chat/completions`, `Bearer`,
  resposta no formato de chat com o JSON `{"aprovado", "motivo"}`. O veredito
  vem de marcadores no título (`[RECUSAR]`, `[RISCO]`, `[ERRO]`, `[LENTO]`,
  `[LIXO]`, `[PENSANDO]`) e cada requisição recebida fica registrada.
* Um roteiro de 14 cenários (I01–I14), na API, na tela (Chrome visível) e no
  PostgreSQL: aprovação, recusa auditada, erro 500, timeout, chave rejeitada,
  resposta fora do formato, nível de filtro no prompt, validação antes da IA,
  não membro, neutralização das marcas do prompt e contabilidade final.
* Um override do compose que aponta só a API para o simulado e um fluxo que a
  restaura ao padrão no fim.
* O nível 5c no documento 17, com a ressalva de alcance.

## O que a IA errou

* **Quatro reprovações falsas na primeira rodada.** O roteiro comparava a coluna
  booleana com `t`/`f`, mas o `psql` devolve `true`/`false` quando o booleano é
  concatenado com `||`. As quatro linhas do banco estavam certas (I01, I02, I06,
  I11); o erro era do script. Só apareceu ao rodar, e a investigação foi ler a
  linha devolvida pelo banco antes de mexer no código do app.
* **Premissa imprecisa sobre o "sem IA".** Os documentos anteriores descrevem o
  cenário sem chave como "IA não configurada". Na prática a API aponta para a
  Groq por padrão e chama sem `Authorization`; o que o usuário vê é o **HTTP 401
  da Groq** (e, sem rede, falha de conexão), ambos virando 503. O ramo "IA não
  configurada" (`Ia:BaseUrl` vazio) existe no código, mas nenhum roteiro o
  exercita.
* **O que este teste não prova.** O provedor é simulado: valida a integração com
  o contrato, não o julgamento do modelo da Groq. O modo com chave real
  (`EUDUVIDO_IA_REAL=1`, cenários R01 e R02) foi escrito mas **não foi
  executado**, porque não há chave neste ambiente; esse código não tem
  evidência de funcionamento.
* **Sem teste de mutação.** Não se verificou, quebrando o app de propósito, que
  cada cenário reprovaria. A evidência de que as asserções avaliam algo são as
  quatro reprovações da primeira rodada.

## Como o time validou

* Duas rodadas completas com 14 de 14 aprovados (uma com o navegador visível,
  outra sem janela), depois da correção do script.
* Depois de cada rodada, a API foi recriada sem o override e confirmada em
  `docker exec euduvido-api-1 env | grep Ia__` (BaseUrl da Groq, chave vazia).
* No banco, ao final: níveis de filtro dos grupos restaurados (1 `MODERADO`,
  2 `PESADO`, 3 `LEVE`, 4 `MODERADO`), `vw_reconciliacao_saldo` e
  `vw_escrow_orfao` vazias.
* Confirmado lendo o código que não existe envio de arquivo de evidência
  (nenhum `multipart`, `IFormFile`, `FormData` ou `input type="file"`) e que
  `ModeradorDesafio` é o único uso de `IChatIa`: não há IA de prova.

## Decisão final

Entram o provedor simulado, o roteiro, o override do compose e o nível 5c. O
julgamento do modelo real e o envio de arquivo de evidência ficam fora e
declarados como não cobertos.
