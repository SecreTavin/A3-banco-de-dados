# 19 - Limitações e Melhorias Futuras

## Modelado, não implementado

Itens que **existem no modelo de dados** mas cuja interface ficou fora do MVP. A
modelagem é entregável; a tela não é. Registrar assim mantém o ponto de
modelagem sem pagar o custo de implementação.

| Item | Onde está no modelo | Por que ficou de fora |
| --- | --- | --- |
| Upload de avatar próprio | `usuario.avatar_url` existe | Usa a foto do Google; upload exigiria fluxo de mídia próprio |
| Upload direto de foto e vídeo da evidência (RF06, RN22) | `evidencia.url_comprovante`, `tipo_midia` (`FOTO`, `VIDEO`, `LINK`, `TEXTO`), bucket `evidencias` no MinIO e o desenho de URL assinada do [ADR 0009](../02-arquitetura/adr/0009-armazenamento-de-midia-r2.md) | A prioridade foi o núcleo transacional (júri congelado, quórum, liquidação de CP e ledger). Hoje o desafiado informa a URL do comprovante, e a mídia fica hospedada fora do sistema. O bucket sobe no `docker compose`, mas a API não grava nele |
| Edição de nome e apelido no perfil ([tela 29](../04-ux/telas/29-tela-perfil.md)) | `usuario.nome`, `usuario.apelido` (com `UNIQUE`) | A tela mostra os dados, mas não há endpoint de alteração |
| Maiores desafios e % de aprovação no ranking ([tela 28](../04-ux/telas/28-tela-ranking.md)) | Consultas Q2 e Q3 do [16 - Consultas SQL](../03-banco-de-dados/implementacao/16-consultas-sql.md) | A tela ficou na classificação por jogador; o resto existe em SQL |
| Desafios no detalhe do grupo ([tela 23](../04-ux/telas/23-tela-meus-grupos.md)) | `desafio.id_grupo` | Os desafios aparecem em *Meus desafios*, com o grupo no cartão |
| Escolher participantes ao criar o desafio ([tela 25](../04-ux/telas/25-tela-criar-desafio.md)) | `participante_desafio` | Cada membro entra pelo detalhe do desafio, com débito em escrow no aceite |

## Fora do escopo por decisão

| Item | Decisão |
| --- | --- |
| Convite por código, comentários, notificações e Web Push | Saíram do modelo na simplificação de 02/10 ([ADR 0016](../02-arquitetura/adr/0016-schema-unico-e-modelo-enxuto.md)). Todos dependem do núcleo e podem voltar sem alterá-lo |
| Login por e-mail e senha | Só Google; a tabela de credenciais saiu junto ([ADR 0016](../02-arquitetura/adr/0016-schema-unico-e-modelo-enxuto.md)) |
| Chat por grupo | Feature grande sem retorno na avaliação |
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

**Recompensa por voto pode ser explorada.** Votar em evidência que atinge quórum
rende 2 CP, o que incentiva participar. Num grupo grande e mal-intencionado,
alguém poderia votar sem analisar para acumular CP. Mitigado parcialmente por
pagar só na apuração, não por voto individual — mas não eliminado.

**Saída de membro bloqueada durante desafio ou votação.** Para o júri congelado
não travar à espera de um voto que nunca viria, quem participa de desafio em
andamento ou integra júri aberto não pode sair do grupo
([ADR 0018](../02-arquitetura/adr/0018-saida-de-membro-e-invariante-do-ledger.md)).
O custo é que alguém pode ficar preso ao grupo até o fim de um desafio — no
máximo o prazo do desafio mais uma semana de votação.

**O veredito da IA é do modelo, não do código.** O prompt de cada nível de
filtro descreve a régua, mas quem decide é o modelo. Em 31/10/2026, *comer 3
pimentas malaguetas* passou no nível `PESADO`, apesar de o prompt mandar recusar
qualquer risco físico ([17 - Testes](../05-qualidade/17-testes.md)). O sistema
garante o que está ao seu alcance — nada vira desafio sem avaliação, toda
avaliação fica gravada —, mas não o acerto de cada julgamento.

**Acabamento visual.** Na lista de desafios, os selos de prazo e de votação se
sobrepõem quando aparecem juntos ([tela 24](../04-ux/telas/24-tela-meus-desafios.md)),
e as mensagens de erro da API são escritas sem acento ("moderacao", "nao").
Nenhum dos dois afeta dado ou regra.

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
* Desafios com valor variável por participante, com rateio proporcional
* Convite por código, comentários no desafio e notificações (ADR 0016)
* Histórico de reputação como validador — quem julga bem versus quem só clica

**Evolução técnica:**

* Ambiente de staging, quando o time crescer
* Particionamento de `transacao_cp` por grupo, se o ledger crescer
* Extração de módulos em serviços, que a separação por schema já prepara
