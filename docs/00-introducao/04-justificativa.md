# 04 - Justificativa

Desafios entre amigos existem por **lazer**: são um jeito leve de se divertir
em grupo, descontrair da rotina e aliviar o estresse do dia a dia. O valor
da brincadeira está no clima — a graça de desafiar, torcer, provocar e
cobrar a prenda. O **Eu Duvido!** se apoia nisso: o objetivo é preservar a
diversão, não transformar o desafio em obrigação burocrática.

Resolver esse problema importa porque desafios informais sem registro geram
discussão, calote e desgaste de amizade — o oposto do que a brincadeira
deveria causar. Quando ninguém lembra o que foi combinado, o momento de lazer
vira motivo de estresse. Centralizar desafio, evidência e votação num só lugar reduz
esquecimento, formaliza o que foi combinado e garante um critério de
julgamento justo (consenso do grupo, não quem grita mais alto), além de dar
a todos um histórico consultável de quem cumpriu o quê.

Um Banco de Dados relacional é o que viabiliza essa solução de verdade, e
não só a interface: garante integridade referencial entre desafio,
participante e evidência, controla a apuração de votos e a liquidação de
crédito como transação atômica (nunca existe voto aceito sem crédito
movimentado), e permite relatórios de ranking e consenso de evidências que
seriam inviáveis com dados espalhados em conversas.
