# 20 - Conclusão

O Eu Duvido! saiu do papel como um protótipo funcional: grupos de amigos criam
desafios, apostam CP, enviam a prova e decidem o resultado pelo voto do júri. O
sistema roda de ponta a ponta no Docker e está publicado para demonstração em
<https://euduvido.secretavin.workers.dev>
([ADR 0019](../02-arquitetura/adr/0019-demonstracao-publica-cloudflare-tunel.md)).

## Objetivos e resultado

| Objetivo ([05](../00-introducao/05-objetivos.md)) | Como o sistema atende | Onde se comprova |
| --- | --- | --- |
| Acabar com o calote e o esquecimento | O CP de quem aceita fica retido em escrow até o resultado; todo movimento fica no ledger | Cenários E13 e U06; consulta Q5 |
| Decidir com justiça | Júri congelado na chegada da prova, quórum de maioria e voto definitivo | Procedure `apurar_votacao`; cenários E04, E05 e U08 |
| Manter a graça viva | Ranking e histórico por grupo | Telas 28 e 24; consultas Q2 e Q3 |
| Brincar com segurança | Idade mínima de 16 anos garantida por trigger; toda proposta passa pela IA antes de virar desafio | Cenários E06, E12 e I01–I14; consulta Q9 |
| Ser fácil de usar | Site responsivo, sem instalação, testado em tela de celular | Cenário U12; telas 22 a 30 |

O objetivo técnico da disciplina foi o eixo do projeto. As regras que não podem
falhar estão no PostgreSQL, e não só no código:

* **Constraints e triggers:** idade mínima, júri isento, crédito inicial e
  ledger imutável.
* **Apuração e pagamento:** a apuração do quórum e a liquidação do CP acontecem
  numa única procedure, dentro de uma transação. Não existe estado em que a
  prova foi aceita e o CP não foi pago.
* **Views de contabilidade:** duas views denunciam qualquer erro e ficaram vazias
  nos roteiros de ponta a ponta (E18 e U08).
* **Consultas analíticas:** 11 consultas respondem perguntas do produto.

O CI confere schema, seed, consultas e views a cada pull request.

## O que aprendemos

* **Modelar é revisar.** O modelo começou com 8 tabelas, cresceu até 15 em seis
  schemas e terminou com 10 num schema único
  ([09](../03-banco-de-dados/modelagem/09-evolucao-modelagem.md),
  [ADR 0016](../02-arquitetura/adr/0016-schema-unico-e-modelo-enxuto.md)).
  Cada mudança respondeu a uma pergunta concreta, como "quem pode votar se
  alguém sair do grupo no meio da votação?", que levou ao júri congelado.
* **A regra no banco protege a regra no código.** Se a tela ou a API deixarem
  passar algo proibido, o banco recusa a gravação. É mais barato descobrir um
  erro por uma exceção do PostgreSQL do que por um saldo errado na banca.
* **Testar o efeito, não a resposta.** Os roteiros de ponta a ponta conferem no
  banco o que cada passo gravou, e não só o código HTTP. Foi assim que apareceu
  a dependência de dados do cenário U11
  ([17](../05-qualidade/17-testes.md)).
* **IA ajuda, mas precisa de conferência.** Os registros de uso de IA mostram,
  caso a caso, o que a ferramenta errou e como o time validou
  ([18](../05-qualidade/18-registro-ia.md)). Contagens de tabelas, números de
  pesquisa e afirmações sobre a infraestrutura precisaram ser conferidos
  contra o repositório e as fontes. Um exemplo é o
  [ADR 0010](../02-arquitetura/adr/0010-hospedagem-e-deploy.md), que descrevia
  uma hospedagem que nunca existiu.

## O que fica para depois

As limitações e as melhorias estão em
[19 - Limitações e Melhorias Futuras](19-limitacoes-e-melhorias.md). As
principais são:

* o upload direto de foto e vídeo da prova;
* uma hospedagem que não dependa de um computador ligado;
* a votação para cancelar um desafio.

Nenhuma delas exige mudar o núcleo transacional. Elas se apoiam no modelo que já
existe.
