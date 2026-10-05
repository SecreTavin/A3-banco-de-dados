# 04 - Justificativa

Resolver esse problema importa porque apostas informais sem registro geram
discussão, calote e desgaste de amizade — o oposto do que a brincadeira
deveria causar. Centralizar aposta, evidência e votação num só lugar reduz
esquecimento, formaliza o que foi combinado e garante um critério de
julgamento justo (consenso do grupo, não quem grita mais alto), além de dar
a todos um histórico consultável de quem cumpriu o quê.

Um Banco de Dados relacional é o que viabiliza essa solução de verdade, e
não só a interface: garante integridade referencial entre aposta,
participante e evidência, controla a apuração de votos e a liquidação de
crédito como transação atômica (nunca existe voto aceito sem crédito
movimentado), e permite relatórios de ranking e consenso de evidências que
seriam inviáveis com dados espalhados em conversas.
