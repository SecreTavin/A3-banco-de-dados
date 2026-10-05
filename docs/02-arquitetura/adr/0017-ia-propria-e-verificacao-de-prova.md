# 0017 - IA em servidor próprio via ngrok e verificação de prova por IA

* **Status:** Aceita
* **Data:** 2026-10-05
* **Decisores:** Arthur Marzano (dev)

## Contexto

O [ADR 0015](0015-idade-minima-e-moderacao-ia.md) fixou a moderação de desafios
por IA e escolheu a API da Groq como provedor. Na preparação da Entrega 4
(sistema funcionando) surgiram dois fatos novos:

* O time vai rodar o modelo numa máquina própria (Ollama ou LM Studio) e
  expô-lo à API publicada pelo **ngrok**. Com isso a disponibilidade, o modelo
  e a cota ficam sob controle do time, sem depender do tier gratuito de terceiros.
* Moderar só a criação do desafio deixa a outra ponta sem filtro: o desafiado
  pode mandar como prova uma foto qualquer, e o júri gasta votos com isso. O PO
  pediu que a IA também verifique se a prova mostra o que o desafio pede (por
  exemplo, se a foto de "fui à academia" é mesmo de uma academia).

## Decisão

**1. Provedor de IA é configuração, não código.** A API fala o protocolo de chat
da OpenAI (`POST {Ia:BaseUrl}/chat/completions`), que Ollama, LM Studio, Groq e
OpenAI aceitam. A URL do ngrok vai em `Ia:BaseUrl`, o modelo em `Ia:Modelo` e,
para foto, `Ia:ModeloVisao` (um modelo com visão, como `qwen2.5vl` ou
`llama3.2-vision`). A chave, quando existir, vem de variável de ambiente.

**2. Toda prova passa por triagem de IA antes do júri.** A IA recebe o título e
a descrição do desafio, o comentário de quem enviou e, quando é `FOTO`, a
própria imagem. Ela responde `aprovado` e um **parecer** curto.

| Resultado | Efeito |
| --- | --- |
| Reprovada (a prova claramente não comprova o desafio, é ilegível ou imprópria) | Não vira `evidencia`, não vai ao júri e **não gasta** uma das 5 tentativas da RN10. O desafiado vê o motivo e pode reenviar. |
| Aprovada | Vira `evidencia`, o júri é congelado e o parecer aparece para os jurados como **opinião consultiva**. |

A IA **não decide a aposta.** Ela só filtra o que é claramente inválido; na
dúvida, aprova e registra a dúvida no parecer. Quem decide continua sendo o
júri, e quem liquida o CP continua sendo a procedure `apurar_votacao`
([ADR 0003](0003-cqrs-dapper-ef.md)).

**3. Toda verificação fica gravada em `verificacao_evidencia`**, no mesmo
desenho de `moderacao_desafio`: uma linha por análise, aprovada ou não, com o
que foi analisado e o parecer. `id_evidencia` só é preenchido na aprovação
(`chk_verificacao_evidencia`).

**4. Falha do provedor continua sendo exceção de infraestrutura** (ADR 0015):
ngrok fora do ar, timeout ou resposta fora do formato viram HTTP 503 e nada é
criado. Não existe aprovação silenciosa.

**5. A foto é baixada pela API, com proteção contra SSRF.** Servidores locais
não buscam URL sozinhos, então a API baixa a imagem (até 5 MB, JPEG, PNG, WebP
ou GIF) e a envia em base64. O download só conecta em endereço IP público,
verificado no momento de abrir o socket, o que cobre redirect e DNS rebinding.
Um link que não pode ser baixado é erro de entrada (HTTP 400), não de
infraestrutura.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
| --- | --- | --- | --- |
| Manter a Groq como único provedor | Sem máquina própria ligada | Cota e catálogo de modelos fora do controle do time | Não foi descartada: o protocolo compatível mantém a Groq como opção por configuração |
| IA decide a evidência sozinha, sem júri | Resultado instantâneo | Tira do grupo a decisão que é o centro do produto e põe a liquidação de CP nas mãos de um modelo que erra | Contradiz o ADR 0003 e a RN15 |
| IA só opina, sem barrar nada | Nenhum falso negativo | O júri volta a gastar votos com foto de prato de comida | Não atende o pedido do PO |
| Gravar o parecer em coluna de `evidencia` | Uma tabela a menos | Prova reprovada não vira evidência e o parecer dela se perderia | A auditoria precisa das reprovações, como em `moderacao_desafio` |
| Mandar a URL da foto direto ao modelo | Sem download na API | Ollama e LM Studio não aceitam URL remota no protocolo compatível | Não funciona com o servidor escolhido |

## Consequências

**Positivas:** o júri recebe provas já triadas e com um parecer para orientar o
voto; toda decisão das duas IAs é auditável por consulta SQL; trocar de modelo
ou de provedor é mudar variável de ambiente.

**Negativas:** criar aposta e enviar evidência dependem de uma máquina do time
ligada e com o ngrok ativo. O endereço do ngrok gratuito muda a cada
reinício, então `Ia:BaseUrl` precisa ser atualizado no ambiente quando isso
acontece. Modelos locais erram mais que os comerciais: o prompt precisa de
calibração com casos reais, como o ADR 0015 já previa.

**Impacto na documentação:**
[08-regras-de-negocio.md](../../01-negocio/08-regras-de-negocio.md) (RN10,
RN28, RN29),
[10-der.md](../../03-banco-de-dados/modelagem/10-der.md) e
[11-modelo-logico.md](../../03-banco-de-dados/modelagem/11-modelo-logico.md)
(nova tabela `verificacao_evidencia`).
