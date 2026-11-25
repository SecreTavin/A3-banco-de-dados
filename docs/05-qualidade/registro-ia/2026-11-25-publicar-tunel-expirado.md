# 2026-11-25 — publicar.sh troca o túnel expirado

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-25 |
| **Responsável** | Arthur Araujo Marzano |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/cloudflare/publicar.sh`; `docs/02-arquitetura/16-execucao-local.md` |

## O que foi pedido

Resolver a issue #58: o `publicar.sh` reaproveitava um túnel rápido expirado só
porque o processo do `cloudflared` continuava vivo, e o site respondia HTTP 530.
Também avisar quando o checkout não está na `main`.

## Prompt utilizado

> Preciso que resolve as issues que estão no github... De maneira completa, e
> preciso do sistema todo funcionando... Pronto já... Lembre se de dar um pull
> para fazer onde está mais atualizado e abra um PR e coloque os revisores e me
> fale quando terminar https://github.com/SecreTavin/A3-banco-de-dados/issues/58
> https://github.com/SecreTavin/A3-banco-de-dados/issues/56

## O que a IA produziu

* `tunel_responde`: o túnel só é reaproveitado se `curl -fsS <túnel>/health`
  responder em até 10 s.
* `derrubar_tunel`: com o processo vivo e o túnel morto, encerra o processo
  (com `kill -9` só se ele não sair em 10 s) e sobe um túnel novo, sem precisar
  do `parar`.
* Depois de subir um túnel novo, espera até 60 s ele responder em `/health`; se
  só o DNS local ainda não resolver, avisa e publica mesmo assim.
* Aviso antes do build quando o checkout não está na `main` ou tem alterações
  não commitadas.
* `caffeinate` só quando existe, e a mensagem de instalação do `cloudflared`
  cita também o Linux.
* Seção "Publicar na Cloudflare (Mac do PO)" no documento 16, com a tabela de
  comportamento.

## O que a IA errou

* A primeira versão de `derrubar_tunel` mandava `kill -9` sempre, mesmo depois
  de o processo já ter saído. O PID pode ter sido reaproveitado por outro
  processo; passou a conferir com `kill -0` antes.
* O primeiro teste com comandos falsos não rodou: o `PATH` foi montado com
  `C:/...`, e o `:` do Windows quebrou a lista de pastas. O script parecia
  "sem cloudflared". Corrigido usando `/c/...` no teste; o script em si não
  tinha esse problema.
* A IA citou a seção "Publicar na Cloudflare" do documento 16 como existente,
  pela issue. Ela tinha sido removida quando o site foi para a VM (ADR 0020);
  a seção foi recriada como subseção do "Ambiente público".

## Como o time validou

* `bash -n scripts/cloudflare/publicar.sh` sem erros.
* Execução com `cloudflared`, `curl`, `npx`, `docker` e `npm` falsos no `PATH`,
  nos três cenários da issue:
  1. sem túnel: subiu `tunel-1` e publicou com `API_ORIGIN=https://tunel-1...`;
  2. túnel saudável: "Túnel já está no ar e responde", reaproveitou `tunel-1`;
  3. processo vivo e `/health` do túnel falhando: "não responde mais;
     derrubando o processo", subiu `tunel-2` e publicou com ele.
* `publicar.sh parar` depois do cenário 3: "Túnel derrubado."
* O aviso de branch apareceu no teste, que rodou na branch
  `fix/58-publicar-tunel-expirado`.
* Não foi testado com o `cloudflared` real: a máquina é Windows e o site
  divulgado está na VM (ADR 0020). Fica para o PO conferir no Mac.

## Decisão final

Entrou como está acima. O estado do túnel continua em `$TMPDIR`: mover para
`$HOME`, como pedia a #65, deixou de ser necessário porque o servidor usa túnel
nomeado.
