# 06 - Público-Alvo e Usuários

## Para quem é

O **Eu Duvido!** é direcionado a **estudantes e seus grupos de amigos**, a
partir de 16 anos, que já fazem desafios informais entre si por
lazer, para se divertir e descontrair. O público é o grupo, não o indivíduo
isolado: o produto só faz sentido quando há amigos para desafiar, torcer e
julgar.

O perfil de estudante importa porque é nesse meio que a brincadeira já
acontece: turmas, grupos de colegas e amigos de faculdade ou escola, que
convivem todo dia, se provocam e vivem a rotina de aulas, provas e prazos —
justamente o estresse que o lazer em grupo ajuda a aliviar. São pessoas
acostumadas a usar o celular para tudo, sem querer instalar nada, e que se
conhecem o bastante para o júri do grupo funcionar: quem vota sabe quem
desafiou e conhece o contexto da brincadeira.

A idade mínima de 16 anos é regra do sistema, validada no cadastro (RF16,
[ADR 0015](../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md)). Toda proposta de
desafio passa por moderação por IA no nível de filtro definido pelo grupo, para
que o tom de brincadeira não vire desafio com risco real a alguém.

## Papéis de uso

Dentro de cada grupo, a mesma pessoa pode assumir papéis diferentes conforme
o desafio.

| Papel | Quem é | O que faz no app |
| --- | --- | --- |
| Criador de desafios (desafiante) | Quem lança o desafio | Define o desafio, o valor em CP e o prazo |
| Participante desafiado | Quem aceita cumprir o desafio | Envia a evidência de que cumpriu |
| Jurado/votante | Os demais amigos do grupo | Votam se a evidência vale, e o resultado vem do consenso |
