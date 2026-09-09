# Automação de entregas

Gera as tabelas de status/checklist em [`docs/07-entregas/`](../../docs/07-entregas/)
a partir do estado real do repositório. Sem dependências além do Node que já
é usado por `apps/web`.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `manifest.json` | Fonte da verdade: para cada entrega, título, data de revisão, tag git e a lista de artefatos exigidos (documento, script SQL ou pasta de código). |
| `gerar-entregas.mjs` | Lê o manifest, confere cada artefato no disco e nas tags git, e reescreve só o trecho entre `<!-- entregas:...:start/end -->` de cada `docs/07-entregas/*.md`. |

## Uso

```bash
node scripts/entregas/gerar-entregas.mjs            # atualiza os documentos
node scripts/entregas/gerar-entregas.mjs --check     # só verifica (usado no CI)
node scripts/entregas/gerar-entregas.mjs --print-file entrega-1   # imprime o
  # caminho do documento associado à tag (usado pelo workflow de release)
```

## Como um item vira ✅

* Se `caminho` aponta para um **arquivo**: precisa existir; se o item tiver
  `minLinhas`, o arquivo precisa ter pelo menos essa quantidade de linhas
  (heurística simples para pegar arquivo que ainda é só um título); se tiver
  `requerConteudo`, todas as substrings precisam aparecer no texto.
* Se `caminho` aponta para uma **pasta**: precisa ter pelo menos 1 arquivo
  (ou o número definido em `minArquivos`).

## Como uma entrega muda de status

`planejada` (0 itens prontos) → `em-construção` (alguns prontos) →
`pronta para entrega` (todos prontos) → `entregue` (a tag git da entrega,
ex. `entrega-1`, existe no repositório — ver
[README principal](../../README.md#como-fechar-uma-entrega)).

## Adicionando um item novo

Editar `manifest.json`, adicionar o objeto em `itens` da entrega certa, rodar
o gerador. Não é preciso mexer no script para isso — só para mudar a forma
como um item é avaliado.
