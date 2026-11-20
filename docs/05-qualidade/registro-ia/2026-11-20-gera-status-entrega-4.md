# 2026-11-20 — Regenera o status da Entrega 4

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `docs/07-entregas/README.md`, `docs/07-entregas/entrega-4-sistema-funcional.md`, documento 16 (cache do `index.html` na VM) |

## O que foi pedido

Fechar a Entrega 4 (Sistema Funcional) no dia da revisão em sala, com o
sistema já em uso pelos integrantes na VM.

## Prompt utilizado

> o pessoal ja ta usando o app pode rodar o script da entrega de hoje

## O que a IA produziu

* `dotnet test`: 170 de 170.
* `gerar-entregas.mjs` sem a tag: Entrega 4 "Pronta para entrega (10/10)".
* A tag `entrega-4` no commit `4f2a22c` da `main`. Depois dela, a saída do
  gerador passou a "Entregue (10/10)", e essa é a única mudança nas tabelas.
  Nenhuma linha foi escrita à mão.
* No documento 16, uma linha sobre o cache do `index.html`. No mesmo dia,
  celulares rodaram o front antigo do cache e chamaram a rota do login de
  desenvolvimento, que já tinha saído (404). A correção (`Cache-Control:
  no-cache`) foi aplicada no `nginx.vm.conf` da VM, que não é versionado.

## O que a IA errou

* **Ordem da tag.** Desta vez a ordem do README foi seguida: tag, gerar e
  commitar, mesclar, mover a tag. O erro da Entrega 3 (tabelas geradas antes da
  tag) não se repetiu.
* **Cache não previsto no deploy.** Ao publicar o login com Google e limpar o
  banco, a IA conferiu as rotas da API, mas não o cabeçalho do `index.html`.
  O problema só apareceu nos logs do nginx, depois que um integrante relatou
  "404 falha na requisição no login".

## Como o time validou

* `gerar-entregas.mjs --check` passa com a tag presente.
* Depois do merge, a tag é movida para o commit do merge, e o workflow
  `entregas.yml` deve publicar a release da Entrega 4.
* Na URL pública, `/`, `/login` e `/desafios/1` respondem com
  `Cache-Control: no-cache`. Os arquivos de `assets/` continuam `immutable`.

## Decisão final

Entram as tabelas regeneradas e a tag `entrega-4` sobre o commit de merge
deste PR.
