# 2026-10-30 — Redesign desktop: sem rolagem de página, textos maiores, menos margem lateral

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `apps/web/src/estilos/global.css`, `apps/web/src/shared/ui/*` (topo, avatar, seção, alerta, ícone), CSS e views de desafios, votação, grupos, ranking, perfil e login; `docs/04-ux/` |

## O que foi pedido

Implementar no front o redesign desktop aprovado no Figma ("Eu Duvido! — Redesign
das telas", página "Redesign (desktop 1440x900)"): nenhuma rolagem vertical da
página no desktop, texto de corpo a partir de 18px, títulos de 36–40px, largura útil
de ~1360px em vez de 940px, mantendo a identidade visual. Celular e tablet não
podem regredir.

## O que a IA produziu

* Camada desktop (`min-width: 1100px`) em cima do CSS existente, sem tocar nos
  hooks `useXQuery`/`useXCommand` nem em regra de domínio: topo, navegação e
  usuário numa linha só; grade de 3 colunas em desafios; detalhe do desafio com
  quatro cartões; criar desafio em duas colunas com painel de moderação;
  votação em duas colunas; grupos e detalhe do grupo em duas colunas; ranking em
  tabela; perfil com resumo e extrato lado a lado; login com a marca à esquerda.
* Variante para telas baixas (`max-height: 820px`, notebook 1366x768) que reduz
  espaçamento, não o tamanho do texto.
* Roteiro de medição em Chrome headless (3 tamanhos desktop x 2 temas x 9 rotas)
  e comparação pixel a pixel de celular/tablet contra a branch anterior.

## O que a IA errou

* **Os tokens do desktop não pegavam.** O primeiro build mostrou o conteúdo
  ainda em 940px: `:root { --largura-maxima: 1360px }` perde para
  `:root[data-tema='escuro']` (especificidade maior). Só apareceu na captura de
  tela; a correção foi usar `:root[data-tema]` no bloco desktop.
* **Mexeu no celular sem querer, três vezes**, e só a comparação de pixels
  contra a branch anterior revelou:
  1. aumentou a fonte da nota de moderação (13,5 para 14px) no formulário de novo desafio;
  2. envolveu o selo de status e o CP do card em `<span>` sem neutralizá-los no
     celular, o que deslocou o alinhamento em poucos pixels;
  3. moveu o formulário "Adicionar por e-mail" para fora da seção "Membros", o que
     trocava a ordem dos blocos no celular. Foi desfeito: a ordem original
     voltou e o desktop passou a usar `display: contents` na seção.
* **Cobertura de dados.** A primeira versão estourava a altura com 7 desafios (4px
  a 1440x900) e o login com 10 usuários (a grade 3x3 do desenho só comporta 9).
  Ajustes: limite de linhas dos textos do card, cartão de "Novo desafio" que só
  entra se couber na última linha e cartões de usuário horizontais acima de 9.
* **Seletor para um papel inexistente.** Usou `[role='alert']` no login, mas o
  componente `Alerta` não tinha `role`; foi adicionado `role="alert"`.
* **Votação só foi vista com dados simulados.** O banco local não tem mais
  evidência pendente (o roteiro e2e anterior votou nela); o layout foi
  conferido interceptando `/api/validacao/pendentes` no navegador, sem alterar o banco.

## Como o time validou

* **Desktop:** `medir3.mjs` em 1366x768, 1440x900 e 1920x1080, nos dois temas, nas
  9 rotas: 54 de 54 sem conteúdo perdido, sem overflow horizontal, sem texto abaixo
  de AA (4,5:1) e sem rolagem interna, com os dados atuais do banco.
* **Celular e tablet** (360x640, 390x844, 768x1024, 1024x768, nos dois temas): 64 de 72
  capturas idênticas pixel a pixel à branch `fix/ux-responsividade`; as 8 que
  diferem mudam 5–6 pixels (texto do card de grupo).
* `tsc -b` e `npm run build` passam.
* Conferência visual contra os frames do Figma (login, desafios, detalhe, perfil,
  ranking, grupos) em 1440x900 e 1366x768.

## Decisão final

Entra o redesign desktop. Desvios assumidos em relação ao Figma:

* O texto do app foi mantido onde o dado não existe na API ("prazo encerrado" e "faltam
  N dias", sem "encerrado em 30/10" nem "em N dias"); subtítulos do Ranking e do
  detalhe do desafio seguem os atuais.
* "Criei · N" e "Participo · N" são contadores sem clique (no desenho parecem
  filtros, mas o app não tem esse filtro).
* Título e recompensa dos cards são cortados em 1–2 linhas (o texto completo fica no
  `title` e no detalhe).
* Votação com 2 ou mais pendências, extrato ou ranking com mais linhas do que cabem
  e grupo com muitos membros rolam **dentro** do card, não na página.
* O "Sair do grupo" (ausente no desenho) ficou como botão sob o convite.

Pendente de validação do time: iOS Safari real (`100dvh`), projetor e o fluxo de votação com
evidência real. O redesign de celular é um trabalho separado.
