# 2026-11-20 — Login com Google no visual do redesign

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/web/src/features/autenticacao/views/LoginView.tsx`, `apps/web/src/features/autenticacao/login.module.css`, `SUMMARY.md`, documento 18; merge das PRs #63 e #61 |

## O que foi pedido

A PR #63 (redesign mobile-first) e a PR #61 (login com Google) reescreveram a
mesma tela de login. O pedido foi levar as duas para a `main`: primeiro o
redesign, depois o login com Google no visual novo. Antes disso, era preciso
testar o login com o Client ID que o Rafael criou no Google Cloud.

## Prompt utilizado

> leia o PR aberto pelo Octavio

> descarte a minha implementação e utilize a dele, tem como?

> ah entendi, vamos mergear o redesign e o login do google para a main

> calma, vamos resolver a parte do google cloud, ele me solicitou isso

> pode seguir com o merge do redesign

## O que a IA produziu

* O passo a passo do Google Cloud, adaptado da issue #60. A IA acrescentou a
  origem `https://euduvido.falveshub.com`, da demonstração na VM, que faltava
  na issue.
* O `.env` local recebeu o `GOOGLE_CLIENT_ID` e uma `AUTH_CHAVE` nova, gerada
  com `openssl rand -base64 48`. O `.env` fica fora do Git.
* O merge da `main` na #63. Os conflitos ficaram só no `SUMMARY.md` e no
  documento 18, e a #63 entrou na `main`.
* O merge da `main` na #61. O `LoginView.tsx` manteve toda a lógica do Octávio
  (botão do Google, passo "Complete seu cadastro", volta ao botão quando o
  token de cadastro vence) e ganhou a marca do redesign (logo "?!" e
  subtítulo). O `login.module.css` partiu do redesign: saíram os estilos da
  lista de contas de teste e entraram os do botão do Google e do perfil,
  escritos com os tokens do redesign.

## O que a IA errou

* **Primeiro plano errado.** A IA propôs tirar a tela de login da #63 e
  voltá-la à versão da `main`, sem antes conferir onde o redesign já rodava.
  O Rafael lembrou que a demonstração na VM usa a branch do redesign. Se o
  plano tivesse seguido, o professor veria o login antigo. As alterações
  foram guardadas num stash e não entraram.
* **Ref desatualizada.** A primeira simulação de merge usou uma cópia local
  antiga de `origin/feat/login-google` e não mostrou o conflito real da tela
  de login. Depois de um novo `fetch`, o conflito apareceu.
* **Origens do Google incompletas.** No primeiro teste, o Google respondeu
  `origin_mismatch`. A IA diagnosticou o erro como origem não cadastrada ou
  ainda não propagada, e ele sumiu depois de o Rafael conferir o console e
  esperar a propagação.

## Como o time validou

* **Teste manual com conta Google real**, na branch da #61 em
  `http://localhost:8080`. O Rafael entrou com o Google, completou o cadastro,
  entrou num grupo e criou um desafio. No banco, o usuário saiu com o e-mail do
  Google, o extrato ficou em +100 e −10, e `vw_reconciliacao_saldo` e
  `vw_escrow_orfao` ficaram vazias.
* **API**: `/api/auth/configuracao` devolve o Client ID; um token falso
  recebe 401; o `/api/auth/dev/login` antigo responde 404.
* **Tela de login mesclada**: a IA conferiu que toda classe usada no
  `LoginView.tsx` existe no CSS, que não há regra sem uso e que toda variável
  `var(--…)` está definida nos tokens. O restante da validação está nas seções
  de testes e de evidências da PR #61.
* **CI** verde na #63 antes do merge e na `main` depois dele.

## Decisão final

O redesign entrou na `main` pela #63. A #61 recebeu a `main`, com a tela de
login dela no visual do redesign, e segue para o merge depois dos roteiros
automáticos e de um novo teste manual com o Google.
