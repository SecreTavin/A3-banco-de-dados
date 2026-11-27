# 0024 - Validador do Google simulado para os testes de ponta a ponta

* **Status:** Aceita
* **Data:** 2026-11-27
* **Decisores:** Rafael Alves, ao cobrir todos os cenários do
  [roteiro completo de testes](../../05-qualidade/roteiro-e2e.md); sujeita à
  revisão do PR
* **Complementa:** [ADR 0021](0021-login-exclusivo-google.md)

## Contexto

O login é só pelo Google ([ADR 0021](0021-login-exclusivo-google.md)). A API
valida o ID token com `GoogleJsonWebSignature`, que confere a assinatura pelas
chaves públicas do Google. Ninguém além do Google assina esse token, e o popup
não se automatiza.

Por isso, cinco cenários do roteiro completo ficavam sem teste automático:
e-mail não verificado (A05), conta existente (A06), conta nova (A07),
formulário de primeiro login (F05) e cadastro de menor de 16 anos pela tela
(F06). Os roteiros contornavam o login assinando a sessão direto, o que pula
justamente o código de entrada.

A moderação por IA tem o mesmo problema e já tem a solução: `Ia__BaseUrl`
aponta para um provedor simulado nos testes (nível 5c do
[documento 17](../../05-qualidade/17-testes.md)).

## Decisão

**A API ganha um segundo validador, `ValidadorGoogleSimulado`, que só entra
quando `Auth:GoogleSimuladoChave` está configurada.** Sem ela, que é o padrão e
o caso da produção, vale o `ValidadorGoogle` real, como antes.

O validador simulado aceita um JWT no formato do Google (`email`,
`email_verified`, `name`, `picture`) que tenha:

* assinatura HS256 com a chave configurada;
* emissor `euduvido-google-simulado`, nunca `https://accounts.google.com`;
* audiência igual ao `Auth:GoogleClientId`, como no real;
* validade em dia.

O resto do fluxo não muda: o handler, o token de cadastro e a tela são os de
produção.

| Onde | O quê |
| --- | --- |
| `Shared/Auth/ValidadorGoogleSimulado.cs` | O validador |
| `Program.cs` | Escolhe o validador pela chave; recusa chave com menos de 32 caracteres; registra um aviso no log ao subir |
| `docker-compose.yml` | `Auth__GoogleSimuladoChave: "${GOOGLE_SIMULADO_CHAVE:-}"`, vazio por padrão |
| Roteiros completos | Recriam a API com a chave, assinam o token e, na tela, trocam o script do Google por um botão que o devolve |

## Consequências

* **Positivas:**
  * os cinco cenários de login rodam a cada execução do roteiro completo, com o
    handler de entrada real;
  * o padrão é o mesmo da IA simulada, já conhecido do time.
* **Negativas:**
  * existe um caminho de login que não passa pelo Google. Quem tiver a chave
    entra como qualquer e-mail.
* **Mitigações:**
  * a variável é vazia por padrão no compose e não aparece no `.env.example`;
  * o log de inicialização avisa em destaque quando o modo simulado está
    ligado;
  * o emissor próprio impede que um token simulado se passe por um do Google;
  * a chave mínima de 32 caracteres evita uma chave trivial.
* **Regra:** **`GOOGLE_SIMULADO_CHAVE` nunca é configurada na VM nem na reserva
  do Cloudflare.** Quem revisar o deploy confere isso junto com a `AUTH_CHAVE`.
