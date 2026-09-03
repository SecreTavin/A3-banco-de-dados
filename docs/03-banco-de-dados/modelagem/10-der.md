# 10 - Diagrama Entidade-Relacionamento (DER)

Entidades agrupadas pelos seis módulos do sistema. Cada módulo corresponde a um
schema no PostgreSQL ([ADR 0005](../../02-arquitetura/adr/0005-schema-por-modulo-postgres.md));
as chaves estrangeiras atravessam schemas normalmente.

```mermaid
erDiagram
    USUARIO ||--o{ CREDENCIAL_USUARIO : autentica_por
    USUARIO ||--o{ MEMBRO_GRUPO : participa
    GRUPO_AMIGOS ||--o{ MEMBRO_GRUPO : contem
    GRUPO_AMIGOS ||--o{ CONVITE_GRUPO : gera
    USUARIO ||--o{ CONVITE_GRUPO : cria

    USUARIO ||--o{ APOSTA : cria
    GRUPO_AMIGOS ||--o{ APOSTA : hospeda
    CATEGORIA_DESAFIO ||--o{ APOSTA : classifica
    APOSTA ||--o{ PARTICIPANTE_APOSTA : possui
    USUARIO ||--o{ PARTICIPANTE_APOSTA : aposta
    APOSTA ||--o{ COMENTARIO_APOSTA : discute
    USUARIO ||--o{ COMENTARIO_APOSTA : escreve

    APOSTA ||--o{ EVIDENCIA : recebe
    USUARIO ||--o{ EVIDENCIA : envia
    EVIDENCIA ||--o{ VALIDADOR_EVIDENCIA : congela_jurados
    USUARIO ||--o{ VALIDADOR_EVIDENCIA : elegivel
    VALIDADOR_EVIDENCIA ||--o| VOTO_EVIDENCIA : exerce

    GRUPO_AMIGOS ||--o{ TRANSACAO_CP : movimenta
    USUARIO ||--o{ TRANSACAO_CP : titular
    APOSTA ||--o{ TRANSACAO_CP : escrow

    USUARIO ||--o{ NOTIFICACAO : recebe
    USUARIO ||--o{ PUSH_SUBSCRIPTION : registra
```

## Entidades por módulo

| Módulo | Entidades |
| --- | --- |
| `identidade` | `usuario`, `credencial_usuario` |
| `grupos` | `grupo_amigos`, `membro_grupo`, `convite_grupo` |
| `apostas` | `categoria_desafio`, `aposta`, `participante_aposta`, `comentario_aposta` |
| `validacao` | `evidencia`, `validador_evidencia`, `voto_evidencia` |
| `economia` | `transacao_cp` |
| `notificacoes` | `notificacao`, `push_subscription` |

## Entidades associativas

Quatro relações N:N foram resolvidas por entidade associativa:

| Associativa | Resolve | Atributos próprios |
| --- | --- | --- |
| `membro_grupo` | Usuário × Grupo | `papel`, `saldo_cp`, `data_entrada` |
| `participante_aposta` | Usuário × Aposta | `papel_aposta`, `escolha` |
| `validador_evidencia` | Usuário × Evidência | — (snapshot puro) |
| `voto_evidencia` | Validador × Evidência | `voto`, `justificativa` |

`validador_evidencia` merece destaque: não é uma associativa comum, é um
**snapshot congelado** dos elegíveis a votar no momento em que a evidência foi
enviada. Sem ela, o quórum flutuaria com o tamanho do grupo e o resultado de uma
aposta poderia mudar sozinho
([ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md)).

Note também que `voto_evidencia` tem chave estrangeira **composta** apontando
para `validador_evidencia (id_evidencia, id_usuario)` — é o banco garantindo que
ninguém vota fora do júri congelado.
