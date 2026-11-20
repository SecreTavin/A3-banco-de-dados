# 0022 - Foto da prova no MinIO, enviada e lida pela API

* **Status:** Aceita (implementada em 20/11/2026). Substitui o [ADR 0009](0009-armazenamento-de-midia-r2.md)
* **Data:** 2026-11-20
* **Decisores:** Rafael Alves, Octávio Augusto Arruda dos Prazeres (Product Owner)

## Contexto

O [ADR 0009](0009-armazenamento-de-midia-r2.md) previa a mídia da evidência no
Cloudflare R2, com envio direto do navegador por URL assinada. Ele nunca foi
implementado: o desafiado colava o link de uma foto hospedada fora do sistema
([registro de 30/10](../../05-qualidade/registro-ia/2026-10-30-upload-de-evidencia-nao-implementado.md)).

Na revisão de 31/10 o professor abriu uma prova e a foto não apareceu: os links
do seed apontam para um domínio que não existe. Para a banca, os participantes
vão popular o sistema pelo celular, e pedir a cada um que hospede a foto em
outro site e cole o link não funciona.

O que já existia:

* um MinIO no `docker compose`, com o bucket `evidencias`, que a API não usava;
* a demonstração numa VM com uma única origem pública: o nginx atende o site e
  repassa `/api` para a API. O MinIO não tem porta pública;
* nenhuma conta R2 provisionada.

## Decisão

A foto vai para o MinIO **passando pela API**:

1. O navegador reduz a foto para no máximo 1600 px no lado maior (JPEG 85%) e
   envia por `POST /api/midia` (multipart, só com login).
2. A API confere o tipo pelos **primeiros bytes** (JPEG, PNG ou WebP), não pelo
   nome nem pelo `Content-Type`. O limite é de 8 MB. Ela grava no bucket com um
   nome aleatório (`<guid>.<ext>`) e responde `201` com `/api/midia/<nome>`.
3. O front grava essa URL, absoluta, em `evidencia.url_comprovante` pelo envio de
   evidência que já existia. O banco e o schema não mudam.
4. A leitura é `GET /api/midia/<nome>`, também só com login. O front busca a
   imagem com o token e a exibe por um *object URL*. O bucket é privado.

A ordem da RN22 se mantém: a linha em `evidencia` só nasce depois de o storage
confirmar o arquivo (o `201`). Vídeo continua entrando como link.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| R2 com URL assinada ([ADR 0009](0009-armazenamento-de-midia-r2.md)) | Exige conta e bucket R2 e CORS no bucket, e o navegador passa a falar com um segundo domínio. Era o desenho para escala, não para o protótipo da banca |
| MinIO com URL assinada | O navegador precisaria alcançar o MinIO: abrir porta ou rota pública na VM só para isso |
| Bucket com leitura anônima | Segurança por obscuridade, já recusada no ADR 0009: quem tem o link vê a prova sem login |
| Imagem no banco (`BYTEA`) | Já recusada no ADR 0009: infla o banco e o `pg_dump` |

## Consequências

**Positivas:** a foto funciona na mesma origem do site, inclusive pelo túnel e
pelo nginx da VM, sem infraestrutura nova. O tipo do arquivo é conferido no
servidor antes de chegar ao storage. A foto reduzida tem algumas centenas de KB,
então o custo de o arquivo passar pela API, que o ADR 0009 apontava, é pequeno
nesta escala.

**Negativas e limites:**

* A leitura exige login, mas não confere se quem lê é do grupo da prova.
  Qualquer usuário logado com a URL vê a foto; o nome tem 128 bits aleatórios.
  Conferir o grupo exigiria ligar o objeto à evidência antes de ela existir.
* Foto enviada e não usada (o desafiado desiste antes de mandar ao júri) fica
  órfã no bucket. É a mesma dívida de limpeza que o ADR 0009 previa.
* O MinIO entra no backup: um `pg_dump` sozinho não leva as fotos.
* O proxy na frente da API precisa aceitar o corpo da requisição: no nginx da
  VM, `client_max_body_size 10m` em `/api` (o padrão do nginx é 1 MB).
