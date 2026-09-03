# 0012 - Contrato entre API e frontend gerado a partir do OpenAPI

* **Status:** Aceita
* **Data:** 2026-09-03
* **Decisores:** Octávio Arruda, Rafael Alves, Arthur Marzano

## Contexto

O [0001](0001-stack-tecnologica.md) escolheu C# no backend e TypeScript no
frontend. A consequencia direta e que **todo tipo que atravessa a fronteira
existe duas vezes**: um `record` em C# e uma `interface` em TypeScript,
descrevendo a mesma coisa em dois arquivos que nada obriga a concordar.

O problema piora com as decisoes de estrutura ja tomadas. O
[0002](0002-monolito-modular-vertical-slice.md) organiza o codigo em vertical
slices e o [0003](0003-cqrs-dapper-ef.md) separa Commands de Queries — entao nao
sao poucos tipos grandes, sao **muitos Commands e Queries pequenos**, um por
caso de uso, seis modulos. Manter isso sincronizado a mao com tres pessoas
trabalhando em branches paralelas e questao de tempo ate divergir.

E a divergencia e do pior tipo: **silenciosa**. Renomear um campo em C#, compilar
o backend, compilar o frontend — tudo passa. O erro so aparece em runtime, com o
campo chegando `undefined` na tela, e normalmente na hora de demonstrar.

## Decisao

**A Minimal API expoe o schema OpenAPI, e um passo de build gera o cliente
TypeScript a partir dele.**

* O backend e a **unica fonte da verdade** do contrato. O schema OpenAPI e
  derivado dos endpoints, nao escrito a mao.
* O cliente TypeScript — tipos e funcoes de chamada — e **gerado**, fica em
  `apps/web` e **nao e editado a mao**. Vale a mesma regra do
  [0004](0004-schema-sql-gerado-por-migration.md) para o `schema.sql`: arquivo
  gerado nao se edita, se regenera.
* Os hooks de cada feature em `apps/web/src/features/*/hooks/` consomem o
  cliente gerado. Nenhum componente monta URL nem digita um tipo de resposta.

**A geracao roda no CI.** O pipeline sobe a API, extrai o OpenAPI, regenera o
cliente e compara com o que esta commitado. Se diferir, o build quebra.

> Frontend fora de sincronia com a API **nao passa do pull request**. O erro
> deixa de ser um `undefined` em runtime na banca e vira uma falha de build antes
> do merge.

Como `main` e producao e o merge publica direto ([0010](0010-hospedagem-e-deploy.md)),
esse cheque e uma das poucas barreiras automaticas que existem antes do deploy —
e por isso ele bloqueia o merge em vez de apenas avisar.

**E aqui que o monorepo se paga.** `apps/api` e `apps/web` no mesmo repositorio
significam que o slice novo e o cliente regenerado entram **no mesmo commit, no
mesmo pull request, revisados juntos**. Cada Command ou Query novo aparece no
cliente TypeScript sem ninguem copiar nada — e sem a janela em que o backend ja
mudou e o frontend ainda nao sabe.

## Alternativas consideradas

| Alternativa | Pros | Contras | Por que nao |
| --- | --- | --- | --- |
| Escrever os tipos TypeScript a mao | Zero ferramenta, zero passo de build | Diverge em silencio; o compilador de nenhum dos dois lados percebe | E exatamente o problema que a decisao existe para resolver |
| Pasta `contracts/` mantida manualmente no monorepo | Contrato explicito e visivel, um lugar so | Mesma divergencia silenciosa, agora com mais cerimonia: tres arquivos para atualizar em vez de dois | Mais trabalho pelo mesmo risco |
| gRPC com `.proto` como fonte da verdade | Contrato forte de verdade, geracao para os dois lados | Exige gRPC-Web e proxy no navegador; ferramental e depuracao mais pesados | Nao encaixa num site responsivo simples consumindo REST — custo de infraestrutura sem ganho no que a materia avalia |
| GraphQL com schema tipado e codegen | Tipos gerados, cliente pede so o que precisa | Camada inteira nova sobre um monolito modular; resolvers e N+1 contra um banco de 20 conexoes | Complexidade grande para um problema que o OpenAPI ja resolve |
| Gerar o cliente so na maquina do desenvolvedor | Sem passo no CI, build mais rapido | Depende de alguem lembrar de rodar; commit desatualizado passa | Sem o cheque no CI a garantia vira convencao — e convencao nao quebra build |

## Consequencias

**Positivas:** o contrato deixa de ser acordo verbal e vira artefato verificado.
Renomear um campo em C# quebra o build do frontend imediatamente, com erro de
compilacao apontando o arquivo — em vez de um campo vazio na tela. A adicao de um
slice fica barata: escrever o handler e o endpoint ja entrega tipos prontos ao
frontend. E o documento 15, que precisa descrever a fronteira entre sistema e
banco, ganha um contrato concreto para exibir em vez de descrever prosa.

**Negativas:** entra um gerador de codigo no build, com a manutencao que isso
implica — versao presa, configuracao propria, saida as vezes menos elegante do
que codigo escrito a mao. O diff dos pull requests fica maior, porque o cliente
gerado e commitado junto. O CI fica mais lento: precisa subir a API para extrair
o schema. E surge uma regra que o time precisa respeitar: **editar o cliente
gerado e sempre errado** — o conserto e mudar o backend e regerar. Por fim, a
qualidade dos tipos gerados depende de os endpoints declararem corretamente seus
tipos de resposta e seus codigos de status; endpoint mal anotado gera cliente
mal tipado, e o gerador nao avisa.

**Impacto na documentacao:** [tecnologias.md](../tecnologias.md) (OpenAPI e
gerador de cliente), [13-visao-geral.md](../13-visao-geral.md),
[14-desenvolvimento-sistema.md](../14-desenvolvimento-sistema.md) (passo de
build e regra de arquivo gerado),
[15-integracao-sistema-bd.md](../15-integracao-sistema-bd.md) (contrato da
fronteira).
