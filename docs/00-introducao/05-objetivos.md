# 05 - Objetivos

## Objetivo Geral
Desenvolver um protótipo funcional de uma **plataforma web de desafios sociais entre amigos** (o **Eu Duvido!**), na qual grupos criam desafios, enviam evidências de cumprimento e decidem o resultado por votação do júri do grupo, com recompensas em créditos virtuais ou prendas. A plataforma é estruturada sobre um Banco de Dados relacional normalizado, povoado e integrado a uma interface de gerenciamento de desafios, desafios e votações.

## Objetivos Específicos

O que se pretende atingir com o uso da plataforma pelos grupos de amigos:

* **Divertir:** transformar brincadeiras e desafios soltos em um momento de
  lazer em grupo, com a graça de desafiar, torcer, provocar e cobrar a prenda.
* **Desestressar:** tirar do caminho o que estraga a brincadeira — esquecimento,
  discussão e calote — para que o desafio relaxe o grupo em vez de gerar
  desgaste.
* **Decidir com justiça:** resolver cada desafio pelo consenso do júri do
  grupo, e não por quem insiste mais alto, para que o resultado seja aceito
  por todos.
* **Manter a graça viva:** dar a cada grupo ranking e histórico de desafios, de
  modo que cumprir e perder virem assunto e motivo para o próximo desafio.
* **Brincar com segurança:** limitar o acesso a maiores de 16 anos e moderar os
  desafios por IA, para que o tom de zoeira não vire risco real a alguém.
* **Ser fácil de usar:** funcionar no navegador do celular, sem instalação,
  para caber na rotina do grupo (RNF01).

## Objetivos Técnicos

O que o projeto A3 precisa demonstrar no banco de dados e na aplicação está
detalhado fora desta seção:

* Requisitos e integridade garantida pelo SGBD: [07 - Requisitos](../01-negocio/07-requisitos.md)
  (RF07, RF08, RF13, RNF02, RNF03).
* Modelagem, constraints e procedures:
  [03 - Banco de Dados](../03-banco-de-dados/README.md).
* Apuração de quórum e liquidação de CP em procedure, e padrão CQRS (Dapper
  para leitura, EF Core para escrita):
  [15 - Integração Sistema e Banco de Dados](../02-arquitetura/15-integracao-sistema-bd.md).
