# 2026-11-07 — Especificação do login com Google (issue #60 e ADR 0020)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-07 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | Issue #60, ADR 0020, índice dos ADRs, PR em rascunho da branch `feat/login-google` |

## O que foi pedido

O PO notou que o login com Google, prometido no RF01 e na RN05, não existia.
Ele escolheu a opção "só Google" e pediu uma issue e uma PR que deixassem o
desenvolvimento claro para o dev, com a condição de não atrapalhar o seed.

Nenhum código foi escrito: o PO não quer mais código da IA neste projeto.

## Prompt utilizado

> Então agora partindo para a etapa final, o que me preocupa é o login com o google Auth, que ainda não foi desenvolvido.

> vamos abrir a issue e tudo necessário para que o dev consiga implementar o nosso login, vamos partir com a opção A, mas ele tem que garantir que tudo está perfeitamente funcional antes de subir pra main para não atrapalhar nosso seed atual. Dentro das issues e PR aberto para o dev, vamos escrever tudo necessário para um bom desenvolvimento do dev. Vamos deixar bem explicado toda a issue e PR de como deve ser.

## O que a IA produziu

* **Diagnóstico**, conferido no código:
  * não há endpoint nem tela do Google;
  * `Auth:Provider=Google` só desliga os endpoints `dev`, então ninguém
    consegue entrar;
  * a documentação dizia que trocar o modo era só configuração;
  * a chave de assinatura dos JWT está fixa no `docker-compose.yml`.
* **Issue #60**, com as seções que o dev precisa:
  * o que não mexer;
  * a configuração no Google Cloud, a cargo do PO;
  * fluxo e contrato dos três endpoints, com cada código de erro;
  * tarefas do front;
  * variáveis e segurança da chave;
  * vínculo de contas do seed para a demonstração;
  * mudanças em cada roteiro de teste;
  * documentos a atualizar;
  * critérios de aceite como gate para a `main`;
  * passos do PO depois do merge e plano de volta.
* **ADR 0020**, com a decisão e as alternativas.

## O que a IA errou

* **A primeira recomendação contrariava a regra do PO.** Antes da decisão, a IA
  recomendou manter o login de desenvolvimento junto com o Google (opção C). O
  PO escolheu a A. A especificação foi escrita para a A e resolve o conflito com
  o seed de outra forma: vínculo de contas na hora de rodar e sessão assinada
  nos testes.
* **Quase passou um risco de segurança.** A chave de assinatura fixa no
  repositório só ficou evidente ao detalhar os testes, que assinam o próprio
  JWT. Com o Google, essa chave pública permitiria forjar sessões no site. A
  issue passou a exigir a chave no `.env` e a trava no `publicar.sh`.

## Como o time validou

* **Endpoints, chaves de `localStorage` e roteiros afetados:** conferidos por
  busca no repositório (`dev/login`, `dev/usuarios`, `dev/cadastro`,
  `euduvido.token`).
* **Recusa do `tokenCadastro` como sessão:** a validação de audience do
  `JwtBearer` foi lida no `Program.cs`.
* **Banco:** o índice único em `usuario.email` foi conferido no banco. A
  trigger de idade só dispara com mudança de `data_nascimento` ou
  `data_cadastro`, o que mantém o vínculo de e-mail fora dela.
* **Orientações do Google** (origens `http://localhost` com e sem porta,
  `Cross-Origin-Opener-Policy` e verificação): conferidas na documentação
  oficial, com os links citados na issue.

## Decisão final

Entram a issue #60, o ADR 0020 e a PR em rascunho. A implementação fica com o
dev, e o merge depende dos critérios de aceite e da validação do PO.
