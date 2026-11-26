# 2026-11-26 — Cloudflare como reserva da VM e fechamento das pendências

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-26 |
| **Responsável** | Octávio Augusto Arruda dos Prazeres |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | ADR 0023 (novo), ADR 0020 e índice dos ADRs, documento 16, `tecnologias.md`, roteiro da demonstração, roteiro dos slides, documento 18 e `SUMMARY.md`, slide 21 |

## O que foi pedido

Mesclar as PRs do Marzano (#80 e #81), resolver o que estava pendente nelas e
registrar a decisão do time de manter a Cloudflare como reserva da VM.

## Prompt utilizado

> Sobre a Cloudflare, foi acordado após a PR do Marzano que vamos manter como um
> rollback de segurança para caso a VM venha a falhar por algum motivo.

> vamos finalizar esse projeto agora mesmo, atualmente ele já roda mas temos essas
> pendencias em aberto, vamos resolver os problemas e fazer o merge, após isso me
> retorne o estado atual do projeto.

## O que a IA produziu

* **#81 mesclada.** Na **#80**, o conflito com a #81 no documento 18 e no
  `SUMMARY.md` foi resolvido, mantendo as duas linhas de 25/11.
* **Contagem de registros corrigida.** As duas PRs acrescentavam um registro sem
  atualizar o total do documento 18, que ficaria em 68 com 70 linhas. O total foi
  acertado, e o slide 21 e a fala dele acompanham.
* **[ADR 0023](../../02-arquitetura/adr/0023-cloudflare-como-reserva-da-vm.md).** A
  VM continua principal, e o `secretavin.workers.dev` vira a reserva, ativada pelo
  `publicar.sh` no Mac do PO. O ADR traz os quatro pré-requisitos, que não ficam no
  repositório: as chaves no `.env` do Mac, o endereço nas origens do Client ID, o
  backup da VM restaurado e um ensaio real do script.
* O ADR 0020 ganhou só a linha "Complementado por", sem reescrita.
* **Documento 16:** a seção "Reserva na Cloudflare, se a VM falhar".
* **Roteiro da demonstração:**
  * o plano B passa a ser a reserva, com os celulares funcionando;
  * o Docker local no `localhost` vira a última opção;
  * a quinta ganhou o teste da reserva.

## O que a IA errou

* **Promessa sem condição.** A primeira versão do plano B dizia que os números do
  roteiro continuavam valendo na reserva. Eles só valem se o backup foi feito com o
  grupo Banca do A3 ainda sem uso. A frase foi corrigida antes do commit.

## Como o time validou

* Contagem conferida por script: arquivos de registro, linhas do documento 18,
  linhas do `SUMMARY.md` e o total escrito no texto batem.
* `gerar-entregas --check` sem pendências e `bash -n` no `publicar.sh` da #80.
* Links dos documentos alterados conferidos.
* **Não testado aqui:** a reserva em si. O `.env` deste Mac não tem as chaves, e as
  origens do Client ID ficam no Google Cloud. Os dois ficam com o PO.

## Decisão final

A #80 entra como o Marzano escreveu, com o conflito resolvido. O conteúdo do
`publicar.sh` não foi alterado. Os commits do Marzano mantêm a linha de atribuição
à IA que o `CLAUDE.md` do projeto pede.
