# 2026-10-31 — Tela inicial: abertura animada com o monge e o nerd

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-31 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/web/src/features/abertura/` (novo), `apps/web/src/App.tsx`, `scripts/testes/roteiro-e2e-ui.mjs` (U13 e passagem pela abertura), `scripts/testes/roteiro-e2e-ia.mjs`, `docs/04-ux/propostas/tela-inicial/`, tela 30, RF17, documento 17 |

## O que foi pedido

Uma tela antes da tela de contas, com uma animação no estilo *ragdoll* em que um
personagem acerta o outro e o golpe dá destaque ao nome do app. O PO queria
aprovar os bonecos e as ideias de interação antes de qualquer código, e ver a
implementação antes de qualquer publicação.

## Prompt utilizado

> Para a tela inicial pensei em uma animação estilo ragdoll com o nome do app em destaque, assim que um personagem acerta o outro no final da animação da uma ênfase ao nome do projeto, na tela deve conter um interaja para continuar e apartir da interação deve ir para a tela de contas.
>
> Especificações da animação:
>
> * Quando criar os bonecos da animação, deve me mandar o sprite para que eu aprove o visual e a interação entre eles.
> * Me retorne ideias de interação entre os bonecos para criarmos a tela
> * A animação deve ser algo atrativo, com interações e foco no usuário e UI/UX
> * Antes de subir qualquer coisa deve me retornar a implementação para avaliação final
>
> tudo isso deve ser documentado também no padrão do projeto.

> Gostei da interação A e B, mas precisamos melhorar mais o nome e a qualidade da animação.
> Melhorias:
>
> * Na interação A quando o personagem for golpear o outro, a câmera deve trocar para a perspectiva de um chute com efeitos de velocidade e de golpe acertado
> * Na interação B quando o personagem arremessar a torta a câmera deve trocar para a perspectiva da torta indo em velocidade e acertando o alvo.
> * vamos colocar o titulo com uma borda dourada para dar mais destaque a ele, juntamente com um brilho na exclamação que surge de tempo em tempo como se fosse uma joia.
> * Para o visual, vamos colocar o desafiador com uma skin de monge do kungfu, onde a exclamação vai estar na sua bandana da testa, faça ele com o cabelo tipico de monge e o bigode fino e longo como os que usam
> * O desafiado vai ter uma skin de estudante nerd, tendo oculos e espinhas no rosto o simbolo dele vai estar no bolso da sua camisa social e ele deve ter uma mochila padrão de nerd.
> * A animação deve ser repetida variando entre a 1 e 2 infinitamente.
> * Independente de estar logado ou não a tela inicial deve ser percorrida.
> * Para continuar qualquer toque ou aperto de tecla conta.

> apenas uma mudança no visual do monge o bigode tem de ser branco, para exalar velhice e sabedoria, após isso podemos começar a modelar a animação.

## O que a IA produziu

* **Um boneco articulado em SVG** com esqueleto paramétrico, em que cada pose é
  um conjunto de ângulos. O mesmo código gerou os sprites que o PO aprovou e
  desenha a tela.
* **Duas rodadas de imagens para aprovação:**
  * primeira rodada: sprites e quatro ideias de interação;
  * segunda rodada: skins de monge e de nerd, storyboard das cenas A e B com os
    cortes de câmera e o título dourado.
* **A tela**, como uma função pura do tempo:
  * o *ragdoll* é uma oscilação amortecida por articulação, sem simulação passo
    a passo;
  * as câmeras atrás do pé e da torta;
  * o "!" de joia com brilho periódico;
  * quadro parado para quem pede menos movimento.
* **A passagem obrigatória pela abertura** em toda carga de página, sem mudar
  rota.
* **O cenário U13** no roteiro de tela. Os roteiros passam a dispensar a abertura
  depois de cada carga de página.

## O que a IA errou

* **Personagem duplicado no quadro final da primeira rodada.** A primeira
  prancha final mostrava o Desafiante virando o "!" do título e, ao mesmo tempo,
  caído no chão. Visto na captura e corrigido antes de enviar ao PO.
* **"!" encostando no "o".** A posição do "!" era calculada a partir de uma
  largura estimada da palavra. Com a fonte do sistema, a joia ficou em cima da
  última letra. A palavra passou a terminar num ponto fixo (`text-anchor="end"`),
  e a joia vem logo depois, qualquer que seja a fonte.
* **Símbolos trocados em relação à primeira versão.** O pedido pôs o "!" na
  bandana do Desafiante; a IA deu o "?" ao Desafiado e avisou o PO da inversão.
* **Gravação fora de ordem.** O relógio controlado do navegador continuava
  correndo em tempo real, e os quadros saíram embaralhados. Corrigido pausando o
  relógio antes de carregar a página.
* **Clarão forte demais.** Nos quadros congelados do acerto e do "splat", o
  clarão lavava a imagem, e o rosto do monge quase sumia. O clarão e o brilho do
  impacto foram reduzidos.
* **Boneco cobrindo o título.** No voo até o "!", o nerd passava por cima das
  letras "do". Ele passou a diminuir durante o voo, como quem vai para o fundo da
  cena.
* **Recarga não prevista nos roteiros.** O U11 recarrega a página e esbarrou na
  abertura. Só apareceu rodando o roteiro; a recarga passou a dispensar a
  abertura também.

## Como o time validou

* O PO aprovou cada etapa por imagem antes da seguinte: sprites, ideias, skins,
  storyboard, título e bigode branco.
* A animação foi gravada quadro a quadro em 1280x800 e 390x844, com o relógio
  controlado, e os quadros foram comparados com o storyboard.
* Roteiro de tela: **13/13**, num banco recém-semeado e com a API sem chave da
  IA. O U13 confere quatro coisas: a cena muda; uma tecla leva a `/login`;
  logado, um clique leva a `/desafios`; com "reduzir movimento", a cena fica
  parada.
* Roteiro de IA simulada: **14/14**.
* Build do frontend sem erro (`tsc -b` e `vite build`).
* Depois dos testes, o banco foi recriado do seed, com a chave da IA, para a
  demonstração.

## Atualização no merge

Ao mesclar com a `main`, que trouxe a Entrega 4 (#43) e o redesign (#50),
`scripts/telas/capturar-telas.mjs` passou a dispensar a abertura e a usar o
formulário novo de criação. As capturas das telas 22–29 foram refeitas com a
interface atual, inclusive a recusa da IA real. Os textos de "Como ficou
implementada" foram revisados contra o código: rótulos, abas, menus e
diálogos.

## Decisão final

Entram a abertura, a passagem obrigatória por ela e os roteiros ajustados. Nada
foi publicado: o PO avalia a tela antes do PR e antes de atualizar o site na
Cloudflare. A falha do U11 com dados acumulados de rodadas anteriores
(`/desafios/nova` rola quando o Tavin tem grupos demais) ficou registrada no
documento 17 e não foi corrigida aqui.
