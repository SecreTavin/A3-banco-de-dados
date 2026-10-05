# 0015 - Idade mínima de acesso e moderação de desafios por IA

* **Status:** Aceita — a escolha do provedor (Groq) foi substituída pelo [ADR 0017](0017-ia-propria-e-verificacao-de-prova.md); o resto segue em vigor
* **Data:** 2026-09-12
* **Decisores:** Octávio Arruda (Product Owner)

## Contexto

Na revisão da Entrega 1 (RT01, 11/09/2026), o professor orientador observou
que o tom "de zoeira" do app — apostas e desafios entre amigos — pode levar um
usuário a propor um desafio com risco real à integridade física ou à
reputação de outro membro, e que o sistema precisa de um mecanismo de
controle para isso, não depender só do bom senso do grupo.

Como PO, a decisão de produto ataca dois vetores desse risco, independentes
entre si: quem pode usar o app, e o que pode ser proposto dentro dele.

## Decisão

**1. Idade mínima de 16 anos**, verificada a partir da data de nascimento
capturada no cadastro do usuário. Usuário abaixo disso não é criado — RN26.

**2. Todo desafio passa por moderação de um modelo de linguagem antes de ser
gravado no banco.** O nível de rigor é configurado por grupo, pelo admin, na
criação do grupo (padrão `MODERADO`) — RN27:

| Nível | Comportamento |
| --- | --- |
| `LEVE` | Deixa passar desafios mais pesados; recusa apenas o absurdo (ex.: incitação a automutilação). |
| `MODERADO` | Meio-termo entre os outros dois níveis. |
| `PESADO` | Rigor voltado a grupos com adolescentes; recusa qualquer coisa que arrisque a imagem ou a reputação de um membro. |

Desafio reprovado **não é criado**; a API devolve o motivo indicado pela IA —
RN28.

A moderação usa a **API da Groq** (inferência de modelos abertos como Llama,
com tier gratuito), escolhida por não exigir cartão de crédito — restrição
real de uma disciplina sem orçamento. Se a Groq estiver indisponível, a
criação falha como **exceção de infraestrutura**, na mesma lógica da tabela de
Result Pattern do `CLAUDE.md`: um provedor externo fora do ar nunca deve
resultar em aprovação silenciosa de um desafio não avaliado.

### Detalhamento do modelo de dados

Fechado na revisão da modelagem (02/10/2026), sem mudar a decisão acima:

* **Idade mínima por trigger, não `CHECK`.** A regra depende da data corrente
  e o PostgreSQL só aceita expressão imutável em `CHECK`.
* **`moderacao_desafio` não tem FK obrigatória para `aposta`.** Desafio
  reprovado não é criado, mas a avaliação precisa ficar gravada; por isso a
  tabela guarda título e descrição avaliados, e `id_aposta` é opcional
  (preenchido só se aprovado).
* **O nível de filtro é copiado para a avaliação.** O admin pode mudar o nível
  do grupo depois; a cópia preserva o que valia no momento da moderação.
* **Backfill de `data_nascimento`.** Usuários já existentes não têm o dado: a
  migration cria a coluna nula, preenche e só então aplica `NOT NULL`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Moderação só pelo júri do grupo, sem IA | Zero dependência externa | É exatamente o cenário que motivou a observação do professor — o bom senso do grupo já existia e não impediu desafio arriscado | Não resolve o requisito |
| Lista fixa de palavras proibidas (blocklist) | Sem custo, sem API externa, determinístico | Fácil de burlar com paráfrase; não distingue contexto ("pular do telhado" de "pular a corda") | Falso senso de segurança |
| Nível de filtro único, fixo para o app inteiro | Mais simples de implementar | Ignora que grupos diferentes toleram coisas diferentes (grupo de atletas adultos vs. grupo com adolescentes) | O produto pede granularidade por grupo |
| Aprovar o desafio e moderar depois, de forma assíncrona | Não trava a criação; resposta mais rápida ao usuário | O desafio arriscado fica visível no grupo até a moderação rodar — o risco já aconteceu | Contradiz o pedido do professor: prevenir, não remediar |
| Grok (xAI) como provedor de IA | Modelo de propósito geral mais forte | API paga por token, exige cartão de crédito cadastrado | Inviável para o orçamento zero de um projeto acadêmico |

## Consequências

**Positivas:** o apontamento do professor fica endereçado por uma regra de
negócio auditável — toda avaliação (aprovada ou não) é gravada em
`apostas.moderacao_desafio`, o que também vira fonte de consulta analítica
para a Entrega 3 (ex.: taxa de bloqueio por nível de filtro). Idade mínima e
moderação de conteúdo são regras independentes: uma não bloqueia a outra.

**Negativas:** a criação de aposta passa a depender de um serviço externo,
ainda que gratuito — antes dependia só do próprio banco. O prompt de
moderação precisa ser calibrado com casos de teste reais; é esperado revisar
os três níveis numa próxima revisão em sala.

**Impacto na documentação:**
[08-regras-de-negocio.md](../../01-negocio/08-regras-de-negocio.md) (RN26,
RN27, RN28),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md) (nova tabela
`moderacao_desafio`, novas colunas em `usuario` e `grupo_amigos`),
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md),
[12-ddl-schema.md](../../03-banco-de-dados/implementacao/12-ddl-schema.md),
[16-consultas-sql.md](../../03-banco-de-dados/implementacao/16-consultas-sql.md).
