# 30 - Tela: Abertura

## Objetivo
Apresentar o app com uma animação curta, com o nome "Eu Duvido!" em destaque,
antes da tela de contas (RF17). Desenho, rodadas de aprovação e verificação em
[Tela inicial: abertura animada](../propostas/tela-inicial/README.md).

## Seções principais
- **Título:** "Eu Duvido!" em letras brancas com borda dourada; o "!" é uma joia
  que brilha a cada 3 s
- **Cena:** dois personagens, o monge do kung fu (Desafiante) e o estudante nerd
  (Desafiado). Duas cenas se alternam sem parar:
  - **A:** o nerd duvida e o monge responde com uma voadora, com a câmera atrás do pé;
  - **B:** o monge duvida e o nerd acerta uma torta, com a câmera atrás da torta.
- **Convite:** "Toque para continuar" no celular e "Clique ou aperte qualquer
  tecla" no computador

## Dados (origem: nenhuma)
A tela não lê nem grava nada no banco e não chama a API.

## Decisões (validado com o PO)
- A abertura aparece em **toda carga da página**, com ou sem sessão. Navegar
  dentro do app não volta a ela.
- **Qualquer** toque, clique ou tecla segue, em qualquer momento da animação.
  Ninguém precisa esperar a cena terminar.
- Depois da abertura, quem não está logado vai para a tela de contas
  ([22](22-tela-autenticacao.md)). Quem está logado segue para `/desafios`, e um
  link direto abre a tela pedida.
- Quem ativou "reduzir movimento" no sistema vê o quadro final, parado.

## Resolvido na arquitetura
- **Sem dependência nova:** SVG desenhado por código, a partir de uma função do
  tempo, sem biblioteca de animação nem de física.
- **Fora das regras de CQRS:** a tela não tem Query nem Command; não fala com a API.

## TODOs para validação com o time
Nenhum pendente.
