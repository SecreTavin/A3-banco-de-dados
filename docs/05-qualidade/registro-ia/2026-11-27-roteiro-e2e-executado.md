# 2026-11-27 — Todos os cenários do roteiro completo com caso de teste

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/testes/roteiro-e2e-completo.py` (novo), `scripts/testes/roteiro-e2e-ui-completo.mjs` (novo), `docs/05-qualidade/roteiro-e2e.md`, `docs/05-qualidade/17-testes.md`, `docs/05-qualidade/18-registro-ia.md`, `SUMMARY.md` |

## O que foi pedido

Cobrir todos os cenários do roteiro completo de testes de ponta a ponta. A meta
foi definida pelo responsável e cobrada por um hook de parada, que só aceita
encerrar o trabalho quando não sobra cenário descoberto.

## Prompt utilizado

> Goal set: cobrir todos os cenários de testes e2e

## O que a IA produziu

* **Dois scripts novos.** Cada caso leva o ID do cenário no roteiro (A10,
  D19, F12, H03…), para o roteiro apontar 1:1 para o teste.
* **Mundo isolado por cenário**, montado por SQL: usuários com e-mail único,
  grupo novo e desafio com moderação aprovada. As ações passam pela API ou
  pela tela, e o efeito é conferido no PostgreSQL.
* **Prazos** testados movendo as datas para o passado e reiniciando a API, já
  que o `PrazosWorker` roda ao subir. P06 reinicia de novo e confere que nada
  muda.
* **Concorrência** com duas requisições liberadas juntas por uma barreira,
  cinco vezes por cenário.
* **Configuração**: a API é recriada sem IA e com Client ID do Google (D10,
  A03) e depois restaurada. **Banco fora**: o contêiner para e volta (S05).
* **Tempo real**: um cliente mínimo do protocolo JSON do SignalR sobre
  WebSocket, porque o pacote `@microsoft/signalr` não está instalado fora do
  contêiner do frontend.

## O que a IA errou

* **S01.** A primeira versão mandou JSON ao `POST /api/midia` sem token e
  recebeu 415. O roteamento do ASP.NET escolhe o endpoint pelo `Content-Type`
  antes de checar o login. O caso passou a mandar multipart, e então deu 401.
* **S05.** O primeiro limite de espera (30 s) estourou antes da resposta. O
  `/health` responde 503 só depois de 121 s. O limite subiu para 180 s, e o
  caso agora mede a demora e reprova acima de 30 s, porque a demora é o
  defeito.
* **C02 e C03 com uma tentativa** passaram na primeira rodada e dariam a
  falsa conclusão de que o risco não existia. Com cinco tentativas, o C02
  devolveu 500 na quinta.
* **Atualização do roteiro.** O script de marcação achou o D25 duas vezes,
  porque o ID também aparece na tabela de riscos. A troca passou a valer só
  para as tabelas de cenários. O `assert` impediu uma gravação errada.
* **V18.** O cenário "quinta evidência não aceita com menos de 3 recusas" é
  inalcançável: toda prova não aceita conta como recusa, e a terceira encerra
  o desafio. O cenário saiu do roteiro (de 202 para 201) e virou nota.

## Como o time validou

Pilha própria (`COMPOSE_PROJECT_NAME=euduvido-e2e`) com banco recém-criado e
navegador visível:

* API completo: **82 de 92**. Os 7 reprovados são defeitos confirmados, e 3
  casos dependem do Google;
* tela e tempo real completo: **22 de 26**. Os 2 reprovados (hub sem login e
  canal de outro grupo) são defeitos, e 2 casos dependem do Google;
* no total, 196 de 201 cenários executados e 186 aprovados.

Cada reprovação traz no detalhe o valor observado: o pote preso, o HTTP 500, o
evento recebido pelo usuário de fora, os 121 s do `/health`.

## Decisão final

Os scripts entram no repositório, e o roteiro registra o resultado de cada
cenário. Ficam abertos para o time:

* **Defeitos de código:** V27, D32, H01, H02, C02, D25 e S05;
* **Regras que faltam no documento 08:** P05 e V11;
* **Layout:** o U11;
* **Validador do Google:** um validador simulado no ambiente de teste
  permitiria automatizar A05 a A07, F05 e F06.

A IA não corrigiu nenhum defeito: a meta era cobrir com testes, e cada correção
muda regra ou código de produção.
