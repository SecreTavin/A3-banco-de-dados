# 19 - Limitações e Melhorias Futuras

## Modelado, não implementado

Itens que **existem no modelo de dados** mas cuja interface ficou fora do MVP. A
modelagem é entregável; a tela não é. Registrar assim mantém o ponto de
modelagem sem pagar o custo de implementação.

| Item | Onde está no modelo | Por que ficou de fora |
| --- | --- | --- |
| Login por email e senha | `identidade.credencial_usuario` já aceita `provedor = 'SENHA'` com `segredo_hash` | Google resolve o acesso do público-alvo; a tabela comporta a extensão sem migração estrutural |
| Upload de avatar próprio | `usuario.avatar_url` existe | Usa a foto do Google; upload exigiria fluxo de mídia próprio |

## Fora do escopo por decisão

| Item | Decisão |
| --- | --- |
| Chat por grupo | Substituído por comentários na aposta (`apostas.comentario_aposta`). Chat seria feature grande sem retorno na avaliação |
| Cache distribuído (Redis/Valkey) | Sem carga que justifique. O dataset é um grupo de amigos e a query mais pesada agrega dezenas de linhas |
| Fila de mensagens (Kafka/Redpanda) | Nenhum produtor e consumidor desacoplados no domínio. Os eventos reais são transições de estado que precisam ser atômicas com a escrita |
| Aplicativo nativo iOS/Android | Nenhum ponto da avaliação depende disso; site responsivo atende |
| Tracing distribuído | Cerimônia com um único serviço |
| Ambiente de staging | Três desenvolvedores e revisão por PR; o custo do ambiente extra superava o risco |

## Limitações conhecidas

**Migração aplica em produção sem gate humano.** `main` é produção e as
migrations rodam no deploy. Um merge aprovado altera o banco de produção
imediatamente. Aceito conscientemente pelo tamanho do time, mas é o risco mais
concreto do projeto — especialmente na véspera da apresentação.

**Web Push é frágil no iOS.** A entrega exige que o usuário adicione o site à
tela de início; sem isso, nada chega. A demonstração não deve depender de push.

**Recompensa por voto pode ser explorada.** Votar em evidência que atinge quórum
rende 2 CP, o que incentiva participar. Num grupo grande e mal-intencionado,
alguém poderia votar sem analisar para acumular CP. Mitigado parcialmente por
pagar só na apuração, não por voto individual — mas não eliminado.

**Quórum congelado não acomoda saída de membro.** Se um validador sai do grupo
durante a votação, ele continua no snapshot e o quórum continua contando com
ele. Uma evidência pode travar por falta de um voto que nunca virá, até o prazo
expirar. É o preço de ter resultado estável, e o prazo de uma semana limita o
dano.

**Limites do plano gratuito.** Aiven free oferece 1 CPU, 1 GB de RAM, 1 GB de
disco e 20 conexões sem pooling. Suficiente para a demonstração, insuficiente
para uso real.

## Melhorias futuras

**Curto prazo, se houver tempo:**

* Aprovação de cancelamento por votação dos participantes (a regra existe em
  RN12, mas a votação em si não foi modelada — hoje o cancelamento é do criador)
* Prorrogação de prazo de votação, que a coluna explícita `data_limite_votacao`
  já torna trivial
* Renovação periódica de CP para quem zerar o saldo

**Evolução do produto:**

* Ranking global além do ranking por grupo
* Apostas com valor variável por participante, com rateio proporcional
* Chat por grupo, se a discussão em comentários se mostrar insuficiente
* Histórico de reputação como validador — quem julga bem versus quem só clica

**Evolução técnica:**

* Ambiente de staging, quando o time crescer
* Particionamento de `transacao_cp` por grupo, se o ledger crescer
* Extração de módulos em serviços, que a separação por schema já prepara
