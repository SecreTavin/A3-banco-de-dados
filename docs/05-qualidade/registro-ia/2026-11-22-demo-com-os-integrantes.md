# 2026-11-22 — Demonstração e documentação só com os integrantes

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-22 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | Roteiro da demonstração, documentos 12, 13, 16, 17, 19 e 20, telas 22 a 29 e suas capturas, README, `.env.example`, Q5 de `analytical_queries.sql`, `scripts/telas/` e os slides da banca |

## O que foi pedido

Tirar da apresentação e do GitBook o seed antigo, com usuários falsos, e passar
para um banco povoado só pelos integrantes. Na banca de 27/11, a abertura, a
votação e os demais passos acontecem ao vivo, com cada um na própria conta Google.

## Prompt utilizado

> Claude, foi realizada a entrega 4 com o professor. A data da apresentação foi
> definida para o dia 27/11. Quero que novamente confira o estado atual do projeto
> e me retorne o que é necessário para que tudo esteja pronto para o grande dia. O
> Rafael fechou alguns PRs e terminou de fazer o login, testamos todos juntos e
> está funcionando tranquilamente. Não vai precisar mais de seed pois vamos
> realizar o teste de abertura, votação e etc.. na hora mesmo, com cada um logado
> na sua propria conta do google.

> pode começar pelo roteiro, slides e capturas, vamos também alterar tudo que fala
> sobre a seed antiga com os usuários falsos, para a nova povoada apenas com os
> integrantes do grupo. Precisamos finalizar o gitbook e os slides ainda hoje.

## O que a IA produziu

* Roteiro novo, de 14 minutos, com os papéis de Octávio, Arthur, Mario, Luís e
  Rafael, desafio reserva, backup e plano B.
* `scripts/telas/povoar-integrantes.mjs`: povoa um banco local vazio pela API, com
  os cinco integrantes, e-mails de exemplo e os seis status de desafio.
* `scripts/telas/moderador-ensaio.mjs`: moderador simulado para o ensaio sem chave.
* Capturas 23 a 29 no visual final, sem usuários fictícios.
* Documentos 13 e 16 reescritos sobre a base de ensaio.
* Q5 sem o usuário fixo do seed, para funcionar em qualquer banco povoado.
* Slides de demonstração, povoamento, interface, testes, IA e limitações
  atualizados, e um slide novo com o plano de trabalho.

## O que a IA errou

* **Ordem do aceite.** A primeira versão do povoamento colocava o apostador depois
  do desafiado e do desafiante. A API recusou com HTTP 409, porque o desafio já
  tinha saído de `ABERTA`. O erro iria para a banca: o roteiro agora manda o
  apostador entrar primeiro.
* **Q5 vazia.** A primeira reescrita escolhia a conta com mais lançamentos e pegava
  a conta do desafio, que tem `id_usuario` nulo. A consulta voltou 0 linhas até o
  filtro `id_usuario IS NOT NULL` entrar.

## Como o time validou

* Banco local vazio, povoado pela API: 5 usuários, 7 desafios nos 6 status, 52
  lançamentos e as duas views de contabilidade vazias.
* A sequência exata do roteiro foi executada pela API. Júri: Luís, Octávio e Rafael.
  Saldos finais: Luís 112, Arthur 110, Octávio 102, Rafael 100 e Mario 80. O `UPDATE`
  no ledger foi recusado.
* O backup com `pg_dump` foi restaurado num banco de ensaio, com as contagens iguais.
* As 11 consultas rodaram na base de ensaio e nos dados de teste do CI.
* Os slides alterados foram renderizados em 1920x1080, sem conteúdo sobre o rodapé.
* **Não testado aqui:** o banco real da VM, o popup do Google e a resposta da IA real
  às propostas do roteiro. Esses pontos ficam para o ensaio geral com os celulares.

## Decisão final

O `seed.sql` continua no repositório só para o CI e os testes automáticos, porque
eles dependem de um estado fixo. Registros de IA, ADRs e os casos do documento 17
mantêm os nomes antigos: são histórico do que foi feito e testado. O `ver-sql.py`
não foi alterado e ainda mostra e-mails; o roteiro traz esse cuidado.
