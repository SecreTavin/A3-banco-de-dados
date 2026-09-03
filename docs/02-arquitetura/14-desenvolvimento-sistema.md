# 14 - Desenvolvimento do Sistema

Como o código é organizado nas duas aplicações. As decisões estruturais estão em
[ADR 0002](adr/0002-monolito-modular-vertical-slice.md) e
[ADR 0003](adr/0003-cqrs-dapper-ef.md); aqui está o que elas significam na
prática.

## Backend — monólito modular com vertical slice

Seis módulos de domínio, cada um com seu schema no PostgreSQL. Dentro de cada
módulo, a organização é por **feature**, não por camada técnica:

```text
Modules/Apostas/
  Domain/
    Aposta.cs                    # agregado rico: invariantes e transições
    ParticipanteAposta.cs
    ApostaErrors.cs              # erros de negócio como valores
  Features/
    CriarAposta/
      CriarApostaCommand.cs
      CriarApostaHandler.cs      # EF Core
      CriarApostaValidator.cs
      CriarApostaEndpoint.cs
    ListarApostasDoUsuario/
      ListarApostasQuery.cs
      ListarApostasHandler.cs    # Dapper
      ListarApostasEndpoint.cs
  Infrastructure/
    ApostaRepository.cs          # implementa a porta definida no Domain
```

Uma feature inteira vive numa pasta. Alterar "criar aposta" não exige navegar
por quatro diretórios diferentes — que é o custo real da organização por camadas.

### Hexagonal: onde ficam as portas

O domínio define interfaces (portas); a infraestrutura as implementa
(adaptadores). O domínio não conhece EF Core, Npgsql nem HTTP.

| Porta (Domain) | Adaptador (Infrastructure) |
| --- | --- |
| `IApostaRepository` | EF Core sobre `apostas.aposta` |
| `IArmazenamentoMidia` | Cliente do Cloudflare R2 |
| `INotificador` | Web Push + `notificacoes.notificacao` |

### Result Pattern

Erro de negócio é valor de retorno, não exceção:

```csharp
public Result<Voto> Votar(int idUsuario, TipoVoto voto)
{
    if (Status != StatusEvidencia.EmVotacao)
        return Result.Fail(EvidenciaErrors.NaoEstaEmVotacao);

    if (DateTimeOffset.UtcNow > DataLimiteVotacao)
        return Result.Fail(EvidenciaErrors.PrazoExpirado);

    return Result.Ok(new Voto(idUsuario, voto));
}
```

O limite importa: `Result` cobre regra de negócio; entrada inválida é barrada
por validador antes do handler; falha de infraestrutura permanece exceção.
Transformar tudo em `Result` esconderia bug real dentro de um
`if (result.IsFailure)`.

Biblioteca: `ErrorOr` ou `CSharpFunctionalExtensions`. Uniões discriminadas do
C# ainda são recurso de *preview* e não são opção.

## Frontend — três camadas por responsabilidade

```text
features/votacao/
  components/            # burros: recebem props, não sabem de onde vêm
    CardEvidencia.tsx
    ContadorVotos.tsx
  views/                 # visuais: compõem os burros, definem layout
    CentralVotacaoView.tsx
  hooks/                 # inteligência: estado, chamadas, cache
    useEvidenciasPendentesQuery.ts
    useVotarCommand.ts
```

A divisão existe para que o componente burro seja reutilizável e testável sem
mock: ele só recebe props. Toda decisão — o que buscar, quando invalidar, o que
fazer no erro — vive no hook.

### CQRS visível no front

A convenção de nome torna o lado da operação explícito no ponto de uso:

| Sufixo | Faz | Comportamento |
| --- | --- | --- |
| `useXQuery` | Lê | Cacheia |
| `useXCommand` | Escreve | Invalida o cache das queries afetadas |

### Tempo real

A Central de Votação assina um hub SignalR (`@microsoft/signalr`) e recebe a
contagem de votos e o encerramento da aposta sem recarregar. O evento chega
**depois** que a transação commitou — o socket informa, nunca decide.

## Telas

Refinamento de cada tela, com dados de origem e decisões, em
[04 - UX](../04-ux/README.md).

| Tela | Feature principal |
| --- | --- |
| Autenticação | Login Google |
| Meus Grupos | Grupos, convite por código, saldo de CP |
| Minhas Apostas | Dashboard filtrado por status |
| Criar Desafio | Criação com custo em CP e participantes |
| Detalhe da Aposta | Evidências, comentários, resultado |
| Central de Votação | Votação com atualização ao vivo |
| Ranking | Consultas analíticas por grupo |
| Perfil | Dados, histórico e extrato de CP |

## Contrato entre as duas aplicações

A API expõe OpenAPI; o cliente TypeScript é gerado a partir dele no CI. Se o
front sair de sincronia com a API, o build quebra antes do merge
([ADR 0012](adr/0012-contrato-openapi.md)). Nenhum tipo de request ou response é
escrito à mão no front.
