# 0021 - Login exclusivo com Google e fim do login de desenvolvimento

* **Status:** Aceita (implementada em 20/11/2026)
* **Data:** 2026-11-07
* **Decisores:** Octávio Augusto Arruda dos Prazeres (Product Owner)

## Contexto

O RF01 e a RN05 pedem autenticação exclusivamente via Google desde a Entrega 1,
mas ela nunca foi implementada. O único acesso é o login de desenvolvimento:
`POST /api/auth/dev/login` recebe um apelido do seed e devolve um JWT, sem
senha.

* **Trocar o modo não liga o Google.** Com `Auth:Provider=Google`, os endpoints
  `dev` param de responder e não existe outro jeito de entrar. A documentação
  ([16](../16-execucao-local.md), tela 22) dizia que trocar de modo era só
  configuração.
* **No site público ([0019](0019-demonstracao-publica-cloudflare-tunel.md)),
  qualquer pessoa entra como qualquer usuário.**
* **A chave que assina os JWT está escrita no `docker-compose.yml`, num
  repositório público.** Com o login aberto, isso não fazia diferença. Com
  um login de verdade, permitiria forjar sessões.

O banco já suporta o Google: a identidade é `usuario.email`, com índice único,
e a foto cabe em `usuario.avatar_url`.

## Decisão

**O acesso passa a ser só pelo Google, e o login de desenvolvimento sai do
app.**

* O front usa o botão do Google Identity Services. A API valida o ID token do
  Google (assinatura, `aud`, `iss`, `exp` e `email_verified`) e emite o
  próprio JWT, como hoje.
* E-mail novo passa por um segundo passo, que pede apelido e data de
  nascimento. A idade mínima de 16 anos continua garantida pelo domínio e pela
  trigger `trg_valida_idade_minima`.
* **Nenhuma mudança no banco:** nem migration nem alteração no seed.
* **Demonstração:** o roteiro da banca usa usuários do seed, que têm e-mails
  fictícios. Um script vincula, na hora de rodar, contas Google reais do time a
  esses usuários (`UPDATE usuario SET email`). Os e-mails ficam só no `.env`
  de quem demonstra.
* **Testes automáticos:** o popup do Google não pode ser automatizado, então os
  roteiros criam a sessão assinando o JWT com a chave do ambiente de teste.
* **Chave de assinatura no `.env`:** ela sai do valor fixo no repositório; o
  valor de desenvolvimento continua só como padrão local e de CI. O script de
  publicação se recusa a publicar com o valor padrão.

Contrato da API, tarefas e critérios de aceite estão na issue #60.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Manter só o login de desenvolvimento e declarar o RF01 não implementado | Nenhum risco técnico | O primeiro requisito fica não atendido; o site público continua aberto | O PO quer o RF01 entregue |
| Google mais login de desenvolvimento ligado para a demonstração | A demonstração com o seed fica trivial | A RN05 ("exclusivamente") deixa de valer; o site continua com uma porta aberta | O PO escolheu o acesso só pelo Google |
| Login por e-mail e senha | Não depende do Google | Exige tabela de credenciais, hash, recuperação de senha; contraria a RN05 | Saiu do escopo no [0016](0016-schema-unico-e-modelo-enxuto.md) |
| Fluxo OAuth com redirect e *client secret* no servidor | Não depende de popup | Exige guardar segredo e tratar callback | O ID token pelo botão do Google basta para identificar a pessoa |

## Consequências

**Positivas:**

* O RF01 e a RN05 passam a ser verdade.
* O site público deixa de aceitar qualquer pessoa como qualquer usuário.
* O banco não muda, então o risco perto da banca fica no código, e voltar
  atrás é reverter um merge.

**Negativas:**

* O sistema passa a depender do Google para qualquer login, inclusive na
  banca. O projeto no Google Cloud precisa estar publicado (*In production*);
  se ficar em *Testing*, só testadores cadastrados entram.
* A demonstração exige rodar o vínculo de contas depois de cada banco novo, e
  cada papel do roteiro precisa de uma conta Google diferente.
* O popup real do Google não entra nos testes automáticos; ele é testado à mão
  antes do merge.

**Impacto na documentação:**

* tela 22, documento 16, `README.md`, documento 17 e `tecnologias.md`;
* nota de atualização no [0019](0019-demonstracao-publica-cloudflare-tunel.md);
* este ADR, quando a implementação for concluída.

## Implementação (20/11/2026)

O Rafael não conseguiu assumir a issue #60, e o PO autorizou a implementação por
IA, com registro em [2026-11-20-login-com-google](../../05-qualidade/registro-ia/2026-11-20-login-com-google.md).

**Decisão sobre a demonstração:** cada integrante entra no próprio celular,
com a própria conta Google ligada a um personagem do seed (`DEMO_CONTAS`).
Trocar de conta Google no projetor, com senha e verificação em duas etapas, foi
descartado por ser lento e arriscado ao vivo.

**Como ficou:**

* **API:** `GET /api/auth/configuracao`, `POST /api/auth/google` e
  `POST /api/auth/cadastro`, com a validação do ID token pela biblioteca
  `Google.Apis.Auth`.
* **Front:** botão oficial do Google e o passo "Complete seu cadastro".
* **Configuração:** chave de sessão no `.env` (`AUTH_CHAVE`), e o
  `publicar.sh` recusa a chave padrão.
* **Demonstração:** `scripts/demo/vincular-contas.sh`.
* **Usuário identificado por id** no ranking, no pódio, no perfil e no júri,
  porque o apelido pode repetir.

