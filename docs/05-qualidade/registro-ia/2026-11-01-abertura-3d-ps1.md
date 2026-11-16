# 2026-11-01 — Abertura em 3D estilo PS1, com plateia de colégio

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-01 (documentação e reexecução dos testes em 2026-11-07) |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/web/src/features/abertura/` (5 arquivos alterados; `motor3d.ts`, `pintor.ts` e `plateia.ts` novos), `docs/04-ux/propostas/tela-inicial/` (rodada 4 e `06-quadros-3d.jpg`), tela 30, documento 17 |

## O que foi pedido

Melhorar a animação da abertura e trocar o visual para o 3D retrô do PlayStation
1, num corredor de universidade com armários e uma plateia de alunos. Cenas,
tempos e cortes de câmera continuam os mesmos. O PO autorizou mexer apenas na
tela inicial.

## Prompt utilizado

> Quero que pegue a tela de inicio do projeto com os bonecos ragdoll e dê uma melhora nos aspectos de animação atual.
>
> Após isso quero que me retorne uma prévia de como faria melhorias.

> Durante o seu processo de modelo no canvas, a demonstração e o que já existe hoje, está faltando algo, que é a troca de perspectiva durante os golpes. modele em cima do que realmente existe no projeto

> Quero trocar a animação para esse estilo como no em anexo, o restante vai continuar igual (animações/movimentos).

> Eu quero apenas o visual 3D retro do PS1 "Transforme a animação em 3D também", o cenário não vai ser esse quero esse e sim uma universidade com armários escolares de fundo.

> O rosto ficou estranho no momento da troca de câmeras, quero que modele e coloque mais alunos em volta, todos estão focados nos dois personagens principais, como se fosse uma briga de ensino médio.
>
> Crie novos alunos tendo entre eles masculino e feminino com padrão de roupa escolar estadunidense de filmes dos anos 90

> Gostei do modelo apresentado, agora quero que implemente todas essas mudanças na aplicação, como eu sou o PO, quero que realize isso desde que não mexa em nenhuma outra parte do projeto, apenas a tela inicial.

> a resolução e qps estão horríveis.

> quero o filtro pois é o que da a cara de ps1 a tela, podemos usar ele um pouco mais leve para não estourar muito a resolução.

> O rosto dos personagens continuam bem estranhos e alguns até bugados.

> Os rostos ainda seguem errados.

## O que a IA produziu

* **Uma prévia interativa antes de qualquer código.** Comparava a animação atual
  com a proposta, lado a lado, com câmera lenta, linha do tempo e um gráfico do
  "estalo" das articulações: 35° na versão atual e 8° na proposta.
* **Um motor 3D próprio e pequeno (`motor3d.ts`).** Tem câmera em perspectiva e
  caixas com luz chapada por face, desenhadas do fundo para a frente. Os
  vértices ficam presos a uma grade, como no PS1. Não entrou nenhuma
  dependência.
* **Os personagens em caixas.** O esqueleto e as poses são os mesmos de antes.
  Rosto e roupa são textura na frente da cabeça e do tronco. Os personagens
  ficam em três quartos, virados para a câmera.
* **A plateia (`plateia.ts`).** São dez alunos, cinco rapazes e cinco moças, com
  roupa de colégio americano dos anos 90, e todos reagem aos golpes.
* **O movimento revisado.** O ragdoll soma impulsos em vez de recomeçar a cada
  golpe. Entraram antecipação, pausa no acerto, *squash and stretch* e tremida
  suave.
* **O pixel de PS1 (`pintor.ts`).** A cena é desenhada num canvas de resolução
  baixa e ampliada sem suavizar, a 60 quadros por segundo.

## O que a IA errou

* **Prévia sem a troca de câmera.** A primeira prévia deixou de fora a câmera
  atrás do pé e atrás da torta, que já existiam no projeto. O PO apontou, e a
  prévia foi refeita sobre o roteiro real.
* **Imagem de referência copiada demais.** O PO mandou a referência só pelo
  estilo. A IA trouxe também o cenário dela: estrada no deserto, pentagrama de
  fogo e brasas. O PO corrigiu para "apenas o visual 3D retro do PS1", num
  corredor de universidade.
* **Filtro de pixel pesado.** Na primeira implementação, o filtro pixelava a
  tela inteira a cada quadro. A animação caiu para 34 quadros por segundo e
  borrou em telas grandes ("a resolução e qps estão horríveis").
* **Correção que tirou o que o PO queria.** Para recuperar a fluidez, a IA tirou
  o filtro. O PO rejeitou, porque o pixel é o que dá a cara de PS1. A solução
  final desenha a cena pequena num canvas e amplia sem suavizar. Antes dela, a
  IA mediu variantes do filtro mais leve, que ficaram entre 32 e 40 quadros, e a
  conversão de SVG em imagem, que levava 24 ms por quadro.
* **Rostos errados por três rodadas.** A causa de fundo só apareceu na terceira:
  o rosto estava colado na face da caixa virada para a câmera, enquanto o corpo
  andava de perfil, então a cabeça parecia girada 90°. Antes disso, a IA tratou
  sintomas:
  * mudou o ângulo da câmera nos closes;
  * recentralizou os traços, que tinham sido desenhados para o perfil 2D;
  * tirou as mechas de cabelo da frente do rosto, onde cobriam a cara de três
    alunas;
  * refez o bigode do monge, que parecia uma argola no nariz.
* **Defeitos achados nos testes.**
  * O pintor ignorava círculos sem `cx`/`cy`. A reserva em SVG entrou como
    devia, e o defeito foi corrigido.
  * Cartazes e relógio ficavam cortados no topo em telas mais baixas. Agora só
    aparecem quando cabem.
* **Registro adiado.** O commit subiu sem este registro, a pedido do PO ("o
  registro fica para depois"). Ele foi escrito antes do PR.

## Como o time validou

* O PO aprovou a prévia antes da implementação e revisou a tela no navegador,
  com prints, a cada rodada.
* **Fluidez:** 60 quadros por segundo em 1000x572 e 1440x900 retina,
  2560x1440 e no celular 390x844, contando os quadros pintados no canvas. Antes
  eram 34 em 1440x900.
* **Erros:** nenhum quadro com `NaN` no ciclo inteiro, em três tamanhos de tela.
* **Build:** sem erro (`tsc -b` e `vite build`).
* **Roteiros (07/11/2026),** sem recriar o banco e com a API sem chave da IA:
  * roteiro de tela: **12/13**. O U13, que confere a abertura, passou. O U11
    reprovou pelos 45 px de rolagem em `/desafios/nova`, causados pelos dados
    acumulados e já registrados no documento 17;
  * roteiro de IA simulada: **14/14**.
* **Quadros da documentação:** gravados com o relógio do navegador controlado,
  em 1280x800.

## Decisão final

Entram a abertura em 3D, a plateia e o pixel de PS1, só na pasta da abertura. As
regras da tela não mudam: quando aparece, como seguir e o quadro parado com
"reduzir movimento". O `<svg>` antigo fica escondido no DOM como reserva e para o
U13. O site na Cloudflare só recebe a versão nova depois do merge.
