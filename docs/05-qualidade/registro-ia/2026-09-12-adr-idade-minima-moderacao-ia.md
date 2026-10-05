# 2026-09-12 — ADR de idade mínima e moderação de desafios por IA

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-12 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Sonnet 5) |
| **Artefato afetado** | `docs/02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md`, `docs/01-negocio/08-regras-de-negocio.md`, `docs/02-arquitetura/adr/README.md`, `SUMMARY.md` |

## O que foi pedido

O professor orientador, na revisão da Entrega 1, apontou que o app precisa de
um mecanismo de controle contra desafios com risco real (à integridade física
ou à reputação), dado o tom de "zoeira" da proposta. Como PO, defini duas
respostas de produto — idade mínima de 16 anos e moderação de desafios por
IA com 3 níveis configuráveis por grupo (Leve/Moderado/Pesado) — e pedi para
a IA registrar a decisão em ADR, atualizar as regras de negócio e planejar a
divisão do trabalho em PRs menores para o time.

## O que a IA produziu

Rascunho completo do ADR 0015 (contexto, decisão, tabela de alternativas
consideradas, consequências), as três novas regras de negócio (RN26-RN28)
inseridas no documento existente, e a atualização dos dois índices de
navegação (README de ADRs e SUMMARY do GitBook). Também levantou, antes de
escrever, o código-fonte relevante (`Usuario.cs`, `GrupoAmigos.cs`,
`ApostasEndpoints.cs`) para garantir que a decisão fosse compatível com CQRS,
Result Pattern e o padrão de módulos já em vigor.

## O que a IA errou

Na primeira proposta de IA "gratuita tipo o Grok", a IA identificou —
corretamente, e antes de implementar qualquer coisa — que o nome citado
("Grok", da xAI) não tem tier gratuito de API, e confirmou comigo se o
provedor pretendido era na verdade a Groq (com Q), que hospeda modelos
abertos com free tier. Não chegou a ser um erro no artefato entregue, mas
seria um erro caro se a implementação tivesse seguido direto para "Grok" sem
essa checagem — o time só perceberia ao tentar obter uma chave de API.

## Como o time validou

Revisão direta do PO (eu) linha por linha do ADR e das RNs antes do commit;
as três perguntas de escopo (idade mínima, provedor de IA, comportamento de
bloqueio) foram decididas por mim, não assumidas pela IA. Validação de forma
(consistência com os ADRs 0001-0014 e com o modelo de registro de IA) feita
por comparação direta com os arquivos existentes no repositório.

## Decisão final

ADR 0015 aceito como está. RN26, RN27 e RN28 entram no documento de regras de
negócio. Implementação (migrations, domínio, serviço de moderação, frontend,
testes) fica para PRs separadas, descritas nas issues abertas a partir desta
decisão — ver [entrega-2](../../07-entregas/entrega-2-modelagem.md) e
[entrega-3](../../07-entregas/entrega-3-banco-de-dados.md) para onde esse
trabalho se encaixa.
