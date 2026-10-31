# 2026-10-31 — Redesign de UI/UX: seis propostas, da prancha ao código

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-31 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/web` (seis telas, componentes comuns), leituras Dapper em `apps/api`, mensagens de erro, `scripts/testes/roteiro-e2e-ui.mjs` e `roteiro-e2e-ia.mjs`, `docs/04-ux/propostas/`, documento 17 |

## O que foi pedido

Melhorar a UI/UX para a apresentação: primeiro imagens das mudanças, sem tocar no
sistema; depois, com todas aprovadas, abrir as issues e a PR do frontend.

## Prompt utilizado

> outro ponto que podemos auxiliar é melhorando a UI/UX dessa aplicação, atualmente acho tudo muito feio e desajeitado, quero que crie algumas imagens de mudanças com foco em UI/UX e usuário e me retorne, para se caso eu gostar, nos abriremos issues de melhorias juntamente a um PR para o front-end. Para que tudo esteja perfeito no dia da apresentação.
>
> Não vamos alterar nada no sistema ainda!

> aprovo todas, pode abrir as issues e a PR

## O que a IA produziu

* **Seis pranchas** desenhadas em HTML com as cores e a fonte do próprio app, a
  partir de capturas das telas reais (desktop e celular). Cada prancha tem a tela
  proposta, os pontos numerados, a explicação de cada um e a tela de hoje.
* **Issues #44 a #49**, uma por proposta, com a imagem e os critérios de aceite.
* **Implementação**, um commit por issue: tela inicial com "Sua vez", detalhe com
  linha do tempo e confronto, votação com confirmação e tela de resultado,
  criação com atalhos e moderação explicada, grupo com filtro explicado e ações
  destrutivas em menus, ranking com pódio e perfil por grupo.
* **Leituras novas na API**, só Dapper, para os dados que as telas precisavam.
* **Roteiros de tela adaptados** aos seletores novos e reexecutados.

## O que a IA errou

* **Prancha com dado inventado.** A prancha 02 dizia "criado por Biel"; no seed,
  quem criou o desafio 1 é o Tavin. Apareceu quando a API passou a devolver o
  criador; a tela mostra o dado real.
* **Exemplo de filtro sem teste.** A prancha 05 punha "correr 5 km" como
  aprovado no nível `PESADO`, mas isso nunca tinha passado pela IA. Antes de ir
  para o código, a proposta foi enviada à IA real nesse nível — e foi aprovada.
* **Linha do tempo sem rótulos.** No desktop a página é uma coluna de altura
  fixa; num desafio aberto o bloco da linha do tempo encolheu e os rótulos
  sumiram. Só apareceu na captura de um segundo desafio; os blocos passaram a não
  encolher.
* **Pódio fora de ordem.** O primeiro lugar saiu à esquerda por causa de uma
  propriedade de ordem que sobrou no componente. Visto na captura e corrigido.
* **Rolagem de página de volta.** As telas novas quebravam a regra de desktop
  sem rolagem da PR #35 (até 425 px a mais). Medido tela a tela em 1440x900; a
  lista do início passou a rolar por dentro e os espaçamentos foram apertados
  até zerar.
* **Roteiros quebrados pela mudança.** O I04 procurava "nao respondeu a tempo" e
  a mensagem ganhou acento; o U01 contava a lista antes de ela carregar. Os dois
  só apareceram rodando os roteiros.
* **Chave da Groq impressa no terminal.** O roteiro da IA imprime o ambiente da
  API ao restaurá-la, e a chave real saiu inteira na saída da sessão. Não foi
  para nenhum arquivo do repositório; o roteiro passou a mascarar a chave.

## Como o time validou

* Cada tela capturada no desktop e no celular, nos temas escuro e claro, e
  comparada com a prancha.
* O voto da demonstração foi feito pela tela nova e os valores mostrados (Tavin
  +30, Theus +30, Lari +2) foram conferidos contra o `transacao_cp`.
* Criação com a IA real: recusa no filtro Pesado com o motivo na tela; proposta
  aprovada criada com a moderação ligada.
* Rolagem medida em 10 rotas a 1440x900: zero em todas.
* Testes: API 147/147; `roteiro-e2e-ui.mjs` 12/12; `roteiro-e2e-ia.mjs` (IA
  simulada) 14/14; `roteiro-e2e.py` 18/18. Build do frontend sem erro.
* Depois dos testes, o banco foi recriado do seed para a demonstração.

## Decisão final

Entram as seis telas, as leituras da API, as mensagens acentuadas, os roteiros
ajustados (com a chave mascarada) e a página do redesign no GitBook. As telas
22–29 continuam descrevendo a especificação; quando a PR da Entrega 4 (#43), que
traz as capturas das telas, for mesclada, as capturas precisam ser refeitas com
`scripts/telas/capturar-telas.mjs`.
