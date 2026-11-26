# 0023 - Cloudflare do Mac do PO como reserva da VM

* **Status:** Aceita
* **Data:** 2026-11-26
* **Decisores:** time do projeto, depois da [PR #80](https://github.com/SecreTavin/A3-banco-de-dados/pull/80) (Arthur Araujo Marzano); registrada por Octávio Augusto Arruda dos Prazeres (Product Owner)
* **Complementa:** [ADR 0020](0020-demonstracao-publica-na-vm-oracle.md)

## Contexto

O [ADR 0020](0020-demonstracao-publica-na-vm-oracle.md) passou o site para a VM
da Oracle, em https://euduvido.falveshub.com. Ele previa que o endereço antigo,
`euduvido.secretavin.workers.dev`, redirecionasse para o novo. O redirecionamento
nunca foi feito: o Worker antigo continuou no ar com uma versão velha do
frontend, e a API dele respondia HTTP 530.

A VM é um ponto único de falha. Se ela cair no dia da banca, o plano B do roteiro
era subir o sistema no Docker de um computador, mas os celulares não entram pelo
`localhost`: o login com Google só aceita HTTPS fora dele.

A [PR #80](https://github.com/SecreTavin/A3-banco-de-dados/pull/80) corrigiu o
`scripts/cloudflare/publicar.sh` ([#58](https://github.com/SecreTavin/A3-banco-de-dados/issues/58)):
ele não reaproveita mais um túnel expirado.

## Decisão

**A VM continua sendo o endereço principal. O `secretavin.workers.dev` não
redireciona: ele é a reserva, ativada pelo `publicar.sh` no Mac do PO se a VM
falhar.** Com a reserva, o site volta a ter HTTPS público, e os celulares
continuam entrando com o Google.

| | Principal | Reserva |
| --- | --- | --- |
| Endereço | https://euduvido.falveshub.com | https://euduvido.secretavin.workers.dev |
| Onde roda | VM da Oracle, sempre ligada | Docker do Mac do PO, com túnel rápido do `cloudflared` |
| Como sobe | `git pull && docker compose up -d --build` na VM | `scripts/cloudflare/publicar.sh` no Mac |
| Dados | Banco da VM | Backup da VM restaurado no Mac |

## Para a reserva funcionar

Nada disso fica no repositório, porque são segredos ou configurações de contas:

1. **`.env` do Mac** com `GOOGLE_CLIENT_ID`, `AUTH_CHAVE` (nova, não a padrão) e
   `IA_API_KEY`. Sem a chave de sessão própria, o `publicar.sh` se recusa a
   publicar.
2. **Google Cloud:** `https://euduvido.secretavin.workers.dev` nas origens
   autorizadas do Client ID. Sem isso, o botão do Google falha nesse endereço.
3. **Dados:** o backup da VM (`pg_dump`) restaurado no banco do Mac, com os
   comandos do plano B do
   [roteiro da demonstração](../../06-encerramento/roteiro-da-demonstracao.md).
   Sem isso, a reserva abre com os dados de teste do Docker local.
4. **Ensaio:** rodar o `publicar.sh` de verdade antes de precisar dele. A #80 foi
   testada com programas simulados, porque o autor usa Windows.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Redirecionar o endereço antigo para a VM (plano do 0020) | Deixa a VM como ponto único de falha |
| Só o Docker local como plano B | Os celulares não entram pelo `localhost`, e a demonstração depende deles |
| Uma segunda VM | Custo e configuração que não cabem antes da banca |

## Consequências

* **Positivas:** se a VM cair, a demonstração continua com os celulares, num
  endereço HTTPS público.
* **Negativas:**
  * a reserva só existe com o Mac do PO ligado, como no [ADR 0019](0019-demonstracao-publica-cloudflare-tunel.md);
  * os dados da reserva são os do último backup, então o que for feito depois
    dele fica de fora;
  * enquanto a reserva não é ativada, o endereço antigo mostra uma versão velha e
    não deve ser divulgado.
