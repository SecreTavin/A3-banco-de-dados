namespace EuDuvido.Api.Shared.Ia;

// Falha de infraestrutura, nao regra de negocio (CLAUDE.md): provedor fora do
// ar, timeout, resposta fora do formato combinado. Sobe como excecao e vira 503
// em TratadorIaIndisponivel. Nunca aprova em silencio um conteudo nao avaliado
// (ADR 0015).
public class IaIndisponivelException(string mensagem, Exception? causa = null)
    : Exception(mensagem, causa);
