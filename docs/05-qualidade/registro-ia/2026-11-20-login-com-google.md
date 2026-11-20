# 2026-11-20 — Login com Google (issue #60)

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | API (módulo Identidade, `TokenService`, `ValidadorGoogle`, ranking e júri com `idUsuario`), front (tela 22, `AuthContext`, ranking, pódio, perfil, júri), `docker-compose.yml`, `.env.example`, `publicar.sh`, `scripts/demo/vincular-contas.sh`, roteiros de teste e de capturas, testes da API, documentos 16, 17 e 22, ADRs 0020 e 0021, roteiro da demonstração, `README.md` |

## O que foi pedido

O Rafael não conseguiria entregar a issue #60. O PO pediu que a IA a
implementasse, na opção A: só Google, sem login de desenvolvimento.

## Prompt utilizado

> vamos organizar o projeto e ter que realizar as tasks que ainda estão abertas para o dev "ele não vai conseguir entregar devido a outros problemas". [...] Realizar as issues do dev "login com o google"

Escolha do PO, respondida a uma pergunta da IA sobre como demonstrar com cinco
personagens sem o login de desenvolvimento:

> A, cada um no seu celular.

## O que a IA produziu

* **API:**
  * três endpoints (`/api/auth/configuracao`, `/api/auth/google`,
    `/api/auth/cadastro`) no lugar dos três de desenvolvimento;
  * validação do ID token no servidor com `Google.Apis.Auth`;
  * token de cadastro de 15 minutos, com audiência própria;
  * leitura por Dapper e escrita por EF Core;
  * e-mail repetido tratado também na corrida pelo índice único.
* **Front:**
  * botão oficial do Google, carregado só na tela de login;
  * passo "Complete seu cadastro";
  * ranking, pódio, posição no perfil e júri identificando o usuário por id,
    porque o apelido pode repetir.
* **Segurança:**
  * a chave das sessões passa para o `.env`;
  * o `publicar.sh` recusa a chave padrão, que está no repositório público.
* **Demonstração:** `vincular-contas.sh`, que liga contas Google reais aos
  personagens do seed numa transação, sem mudar o `seed.sql`. O
  `recriar-banco.sh` o chama, e o `conferir-demo.sh` confere os vínculos.
* **Testes:**
  * 15 testes novos na API: tokens e login contra PostgreSQL real, com um
    Google falso;
  * os três roteiros de ponta a ponta passam a assinar a sessão com a chave de
    teste;
  * cenário U14 novo, que confere a tela de login.

## O que a IA errou

* **Primeira versão do roteiro da demonstração impraticável.** A opção A tira o
  login de demonstração, e o roteiro usava cinco personagens no mesmo
  navegador. Trocar de conta Google ao vivo, com senha e verificação em duas
  etapas, travaria a banca. A IA só percebeu ao planejar a implementação e
  levou a questão ao PO, que escolheu um celular por integrante.
* **Risco de segurança percebido tarde.** A chave que assina as sessões estava
  escrita no `docker-compose.yml`. Com login de verdade, quem lê o repositório
  poderia forjar uma sessão no site público. Isso só ficou evidente ao fazer os
  roteiros de teste assinarem o próprio JWT. Agora a chave vem do `.env`, e o
  `publicar.sh` se recusa a publicar com a padrão.
* **Testes de tela presos ao texto antigo.** O U13 esperava a lista "Entrar
  como", que deixou de existir. Corrigido para o rodapé da tela nova.

## Como o time validou

Num ambiente de ensaio criado do zero a partir da branch, com a API sem chave
da IA nem Client ID:

* `dotnet test`: **162 de 162**, incluindo os 15 novos (cadastro com 12 anos
  recusado sem gravar, apelido repetido aceito, e-mail repetido com 409, token
  de cadastro que não abre endpoint protegido);
* roteiro da API: **18 de 18**;
* roteiro de tela: **14 de 14**, com o U14;
* roteiro de IA simulada: **14 de 14**;
* `vincular-contas.sh`: três contas vinculadas e conferidas. Apelido
  inexistente, e-mail já usado e par malformado abortam sem gravar nada;
* com um Client ID fictício, o botão oficial do Google aparece na tela, no
  desktop e no celular. A captura da tela 22 foi refeita assim.

**Falta, e só o PO pode fazer:** o teste com o popup real do Google. Ele exige
o projeto no Google Cloud e o Client ID verdadeiro.

## Decisão final

A implementação fica na PR #61, pronta para revisão. Ela só vai para a `main`
depois do teste do PO com uma conta Google real, como a issue #60 exige.
