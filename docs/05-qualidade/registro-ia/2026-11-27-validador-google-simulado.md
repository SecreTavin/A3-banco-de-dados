# 2026-11-27 — Validador do Google simulado e os cinco cenários de login

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-27 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `apps/api/EuDuvido.Api/Shared/Auth/ValidadorGoogleSimulado.cs` (novo), `Shared/Auth/TokenService.cs` (`AuthOptions`), `Program.cs`, `docker-compose.yml`, `EuDuvido.Api.Tests/Unidade/ValidadorGoogleSimuladoTests.cs` (novo), `scripts/testes/roteiro-e2e-completo.py`, `scripts/testes/roteiro-e2e-ui-completo.mjs`, ADR 0024 (novo), `docs/05-qualidade/roteiro-e2e.md`, `docs/05-qualidade/17-testes.md` |

## O que foi pedido

Fechar os cinco cenários do roteiro completo que ainda não tinham teste
automático, todos de login com o Google (A05 a A07, F05, F06). A meta "cobrir
todos os cenários de testes e2e" foi definida pelo responsável, e um hook de
parada recusou o encerramento enquanto esses cinco faltavam.

## Prompt utilizado

> Goal set: cobrir todos os cenários de testes e2e

## O que a IA produziu

* `ValidadorGoogleSimulado`: valida um JWT no formato do Google, com emissor
  próprio, a audiência do Client ID e uma chave de teste. O `Program.cs` só o
  registra quando `Auth:GoogleSimuladoChave` está configurada; sem ela, vale o
  validador real. O compose expõe a variável vazia por padrão.
* 7 testes de unidade do validador: token válido, e-mail não verificado, outra
  chave, outro Client ID, emissor do Google, token vencido, sem e-mail.
* **A05 a A07 no roteiro da API**, na fase que já recria a API com o Client ID.
  O A06 usa a sessão devolvida numa chamada real. O A07 conclui o cadastro com
  o token de cadastro devolvido.
* **F05 e F06 no roteiro de tela.** O `addInitScript` do Playwright define
  `window.google` antes de o React carregar, e o `google.ts` usa o objeto que
  já existe. O botão falso devolve o token assinado, e o resto é o código real.
* ADR 0024, que registra a decisão e a regra de nunca configurar a chave na
  VM.

## O que a IA errou

* **Afirmação falsa no fechamento anterior.** A mensagem anterior dizia que
  "todos os 201 cenários têm caso de teste", mas cinco estavam marcados como
  não cobertos. O hook apontou a contradição.
* **Mudar código sem decisão.** A IA tinha deixado os cinco para decisão do
  responsável, por mexerem na autenticação. Com a meta definida por ele, fez a
  mudança com a menor superfície possível: desligada por padrão, emissor
  próprio, aviso no log, ADR e revisão no PR.
* **Imagem desatualizada.** A pilha de teste rodava uma imagem da API anterior
  ao validador. Ela foi reconstruída (`up --build`) antes da execução, senão a
  variável nova seria ignorada.

## Como o time validou

* `dotnet test --filter Tests.Unidade`: **129 de 129**, com os 7 novos;
* roteiro da API completo, em pilha própria reconstruída: **85 de 92**. A05,
  A06 e A07 passaram, e os 7 reprovados são os defeitos já confirmados;
* roteiro de tela completo, com o navegador visível: **24 de 26**. F05 criou a
  conta pelo formulário e entrou com sessão. F06 mostrou a mensagem da RN26 sem
  gravar. Os 2 reprovados são o hub sem login (H01, H02);
* depois dos roteiros, `/api/auth/configuracao` voltou a responder
  `googleClientId` vazio: a API foi restaurada ao padrão.

## Decisão final

Os 201 cenários do roteiro completo foram executados: 191 aprovados e 10
reprovados, todos defeitos do sistema. O validador simulado entra para revisão
no PR, com o ADR 0024. Falta testar o popup do Google de verdade, que continua
manual antes do merge.
