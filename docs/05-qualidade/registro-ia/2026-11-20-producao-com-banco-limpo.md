# 2026-11-20 — Produção com o banco limpo

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/demo/recriar-banco.sh` (opção `--vazio`), `database/scripts/dml/categorias.sql`, tela de novo desafio (`CriarDesafioView.tsx`), documento 16; na VM, `nginx.vm.conf` (não versionado) |

## O que foi pedido

Antes de os integrantes popularem a produção com contas reais, garantir que o
sistema funciona sem o seed e publicar os PRs #72 e #73 na VM, com o banco
limpo.

## Prompt utilizado

> ah sim, mas no caso a gente limpou o banco em prod certo? Agora serão dados reais, quanto a isso, tudo funciona?

> Se vc me garantir que tudo funciona eu irei te pedir para gerar um roteiro para cada integrante do grupo fazer algumas ações para popular o app

> pode seguir com os passos em prod

> quando vc terminar e se tiver que arrumar alguma coisa arrume, gere um pdf para cada integrante do projeto realizar ações dentro dele.

## O que a IA produziu

* Um teste do fluxo inteiro numa API separada, contra um banco recém-criado
  sem o seed: cadastro de quatro pessoas, grupo, convite por e-mail, desafio
  com a moderação real da Groq, aceite, foto, votação até `FINALIZADA_CUMPRIU`,
  prêmio, ranking, perfil e remoção de membro. Mais capturas das telas vazias
  de quem acabou de chegar, no celular e no computador.
* Três correções do que o teste e a publicação acharam:

| Problema | Correção |
| --- | --- |
| Num banco sem o seed, a tabela de categorias fica vazia e nenhum desafio pode ser criado (`CategoriaInexistente`) | `categorias.sql` com as quatro categorias e `recriar-banco.sh --vazio`, que aplica o schema e só elas |
| Quem não tem grupo abria "Novo desafio" e via o campo "Em qual grupo?" vazio, sem explicação | Estado vazio "Primeiro, um grupo", com o botão para os grupos |
| Na VM, `/api/midia/<nome>.jpg` respondia 404 do nginx: a regra por regex dos estáticos (`.jpg`, `.png`) vencia o prefixo `location /api/` | `location ^~ /api/` e `^~ /hubs/` no `nginx.vm.conf`, e a armadilha anotada no documento 16 |

* Na VM:
  * backup do banco (`~/backup-euduvido-20261120-1658-antes-limpeza.dump`);
  * `git pull` e `docker compose up -d --build`;
  * banco recriado só com o schema e as categorias.

## O que a IA errou

* **Afirmou que a produção estava pronta sem ter testado sem o seed.** Todos os
  roteiros rodavam sobre o seed, que esconde a falta das categorias. Só o teste
  num banco vazio mostrou o problema.
* **Listou um ajuste de nginx que não era preciso e não viu o que era.** A IA
  pediu `client_max_body_size`, que a VM já tinha (20m), e não leu o resto do
  arquivo, onde estava a regra dos estáticos que quebrava a foto. O erro
  apareceu no teste da URL pública, que respondeu `text/html` em vez de 401.
* **Recarregou o nginx e achou que tinha aplicado.** O `sed -i` cria um arquivo
  novo, e o contêiner monta o antigo; o `nginx -s reload` leu a versão velha. A
  IA notou porque o 404 continuou com uma URL nova, e o `restart` do contêiner
  resolveu.
* **Votou com quem não podia.** No teste, a IA mandou a criadora do desafio
  votar. A API respondeu 403 (`NaoEhValidador`), que é a regra certa: parte do
  desafio não julga.

## Como o time validou

* Fluxo completo na API isolada: todas as etapas com o código esperado. As
  views de contabilidade (`vw_reconciliacao_saldo` e `vw_escrow_orfao`)
  ficaram vazias.
* Telas de quem acabou de chegar, em 390x844 e 1440x900: sem erro de página e
  sem resposta 4xx/5xx inesperada da API.
* `recriar-banco.sh --vazio --sim` no Docker local deixou 0 usuários e 4
  categorias. Depois, o modo normal voltou o seed, e a conferência da
  demonstração passou. Opção desconhecida termina com código 1.
* Na URL pública, depois do deploy:
  * site 200;
  * Client ID do Google publicado;
  * `/api/categorias` sem login, 401;
  * upload de 9 MB sem login, 401 (o nginx não barra);
  * `/api/midia/<nome>.jpg` sem login, 401;
  * bucket `evidencias` privado.
* `npm run build` do front sem erro.
* O envio real de foto pela URL pública fica para o primeiro login com o
  Google: uma sessão assinada na VM foi bloqueada pela permissão do ambiente.

## Decisão final

A produção começa vazia, com contas reais. Para recriar, faça backup antes e
use `recriar-banco.sh --vazio`, nunca o modo com o seed.
