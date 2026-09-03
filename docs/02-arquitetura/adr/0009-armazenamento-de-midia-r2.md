# 0009 - Midia em Cloudflare R2 com upload por URL assinada

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

A evidencia e o centro do produto: quem aceita um desafio prova que cumpriu
enviando **foto ou video**, e o grupo vota olhando esse arquivo. Sao arquivos
grandes — video de celular passa facil de 20 MB — e sao **assistidos varias
vezes**: cada validador abre a evidencia pelo menos uma vez, e as boas viram
piada recorrente do grupo e sao reabertas depois.

O schema ja resolvia metade disso: `validacao.evidencia.url_comprovante
VARCHAR(500)`. O banco guarda uma URL, nao o arquivo. Faltava decidir **onde o
arquivo mora**, **quem faz o upload** e **em que ordem** a linha e criada.

Restricoes:

* A disciplina e Banco de Dados. Tempo gasto com infraestrutura de midia e tempo
  que nao foi para modelagem, constraints e consultas.
* Projeto de faculdade, sem orcamento. Custo previsivel importa mais que
  performance.
* Backup e restore do banco precisam ser rapidos — o banco e restaurado
  repetidamente durante o desenvolvimento e a demonstracao.

## Decisao

**Os arquivos de evidencia ficam no Cloudflare R2, fora do banco.** O banco
guarda **apenas a URL** em `evidencia.url_comprovante` — que e o que o schema ja
fazia; esta decisao formaliza a contraparte de infraestrutura.

**Upload por URL assinada (presigned URL):**

1. O cliente pede a API uma URL de upload, informando tipo e tamanho do arquivo.
2. A API valida (membro do grupo, aposta em estado que aceita evidencia, tipo de
   midia permitido) e devolve uma **presigned URL** com expiracao curta.
3. O **navegador envia o arquivo direto ao R2**. O byte nao passa pela API.
4. O R2 confirma o upload ao cliente.
5. So entao o cliente chama a API, que **cria a linha em `validacao.evidencia`**
   e grava o snapshot de validadores ([0008](0008-quorum-congelado.md)) na mesma
   transacao.

**Regra critica — a ordem nao e negociavel:**

> A linha em `evidencia` so e criada **depois** que o upload confirma.

Criar a linha antes deixaria `url_comprovante` apontando para um objeto que pode
nunca existir — upload abortado, aba fechada, rede caindo. E como a insercao da
evidencia e o que dispara `EM_VOTACAO` e congela o juri, o grupo estaria
**votando numa evidencia que nao existe**. `url_comprovante` e `NOT NULL` no
schema justamente por isso: nao ha estado intermediario valido.

O custo dessa ordem e conhecido e aceito: um upload que sobe e nunca vira linha
deixa um objeto orfao no bucket. Orfao no storage e lixo barato; linha apontando
para o vazio e um bug de correcao.

**R2 e nao S3 porque o R2 nao cobra egress.** Video de evidencia e assistido
repetidamente pelo mesmo grupo, entao o egress — nao o armazenamento — seria o
custo dominante. A API do R2 e compativel com S3, entao a decisao nao amarra:
trocar de provedor e trocar endpoint e credencial.

O bucket e **privado para escrita e para leitura**; a leitura tambem sai por URL
assinada, com expiracao. Evidencia de aposta e conteudo de grupo fechado, nao
material publico.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Upload passando pela API | Um endpoint so; validacao antes do byte chegar ao storage | O arquivo trafega duas vezes (cliente -> API -> R2); a API fica ocupada segurando upload de video em rede de celular; limites de tamanho de requisicao | Custo de banda e de processo dobrado sem ganho — a presigned URL ja valida antes de emitir |
| Bucket publico para escrita | Trivial de configurar | Qualquer um sobe qualquer coisa no bucket do projeto | Nunca |
| Blob no proprio banco (`BYTEA` / large object) | Backup unico; integridade transacional entre arquivo e linha | Infla o banco em ordens de grandeza; `pg_dump` e restore ficam inviaveis; toda leitura de video passa pelo Postgres | Descartado — o custo cai justamente em cima do que a materia avalia, e nao e o que ela quer ver |
| Amazon S3 | Padrao de mercado, ferramental maduro | Cobra egress, que aqui e o custo dominante | Mesmo modelo de API, custo pior para o padrao de acesso do produto |
| Servir por CDN publica com URL nao adivinhavel | Leitura mais simples e cacheavel | Seguranca por obscuridade; URL vazada e acesso permanente | Evidencia e conteudo de grupo fechado |

## Consequencias

**Positivas:** o banco fica pequeno e o `pg_dump` continua rapido — restore de
ambiente e questao de segundos, o que importa durante a demonstracao. A API nao
lida com upload de arquivo grande. O custo de egress e zero, que e o unico
custo que escalaria com o uso real. E o schema nao muda: `url_comprovante` ja
era a modelagem correta.

**Negativas:** o estado passa a viver em dois lugares, e o banco nao consegue
garantir que a URL aponta para um objeto existente — nao ha FK para o R2. Isso
cria duas obrigacoes: a ordem de escrita descrita acima, e uma rotina de limpeza
de objetos orfaos (fora do MVP, divida registrada). Deletar uma evidencia
tambem passa a ser dois passos, e o `ON DELETE CASCADE` da linha nao apaga o
arquivo. Por fim, entra uma credencial externa no ambiente — mais uma variavel
de configuracao a gerenciar em cada deploy.

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md) (Cloudflare R2),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md) (fluxo de upload em tres passos),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md)
(semantica de `url_comprovante`),
[26-tela-detalhe-aposta.md](../../04-ux/telas/26-tela-detalhe-aposta.md) (envio de evidencia),
[27-tela-central-votacao.md](../../04-ux/telas/27-tela-central-votacao.md) (exibicao da midia).
