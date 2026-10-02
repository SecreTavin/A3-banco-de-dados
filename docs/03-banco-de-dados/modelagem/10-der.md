# 10 - Diagrama Entidade-Relacionamento (DER)

Dez entidades em um único schema, agrupadas em cinco áreas. O que mudou desde
o primeiro desenho e por quê está em [09 - Evolução](09-evolucao-modelagem.md).

```mermaid
erDiagram
    USUARIO ||--o{ MEMBRO_GRUPO : participa
    GRUPO_AMIGOS ||--o{ MEMBRO_GRUPO : contem
    USUARIO ||--o{ GRUPO_AMIGOS : cria

    GRUPO_AMIGOS ||--o{ APOSTA : hospeda
    USUARIO ||--o{ APOSTA : cria
    CATEGORIA_DESAFIO ||--o{ APOSTA : classifica
    GRUPO_AMIGOS ||--o{ MODERACAO_DESAFIO : audita
    USUARIO ||--o{ MODERACAO_DESAFIO : propoe
    APOSTA ||--o| MODERACAO_DESAFIO : aprovada_em
    APOSTA ||--o{ PARTICIPANTE_APOSTA : possui
    USUARIO ||--o{ PARTICIPANTE_APOSTA : aposta

    APOSTA ||--o{ EVIDENCIA : recebe
    USUARIO ||--o{ EVIDENCIA : envia
    EVIDENCIA ||--o{ JURADO_EVIDENCIA : convoca
    USUARIO ||--o{ JURADO_EVIDENCIA : julga

    GRUPO_AMIGOS ||--o{ TRANSACAO_CP : movimenta
    USUARIO ||--o{ TRANSACAO_CP : titular
    APOSTA ||--o{ TRANSACAO_CP : escrow
```

## Entidades por área

| Área | Entidades | Pergunta que responde |
| --- | --- | --- |
| identidade | `usuario` | Quem é a pessoa? |
| grupos | `grupo_amigos`, `membro_grupo` | Em qual turma, com qual papel e saldo? |
| apostas | `categoria_desafio`, `aposta`, `moderacao_desafio`, `participante_aposta` | Qual é o desafio, ele passou na moderação e quem participa? |
| validacao | `evidencia`, `jurado_evidencia` | Qual a prova e quem julga? |
| economia | `transacao_cp` | Para onde foi cada moeda? |

## Entidades associativas

Três relações N:N, cada uma resolvida por uma tabela própria:

| Associativa | Resolve | Atributos próprios |
| --- | --- | --- |
| `membro_grupo` | Usuário × Grupo | `papel`, `saldo_cp`, `data_entrada` |
| `participante_aposta` | Usuário × Aposta | `papel_aposta`, `escolha` |
| `jurado_evidencia` | Usuário × Evidência | `voto`, `justificativa`, `data_voto` |

## O júri em uma tabela só

`jurado_evidencia` junta duas ideias:

* **Quem pode votar.** Ao enviar a evidência, o sistema grava uma linha por
  integrante elegível, com `voto` nulo. Esse conjunto não muda mais — é o
  júri congelado ([ADR 0008](../../02-arquitetura/adr/0008-quorum-congelado.md)).
  Quem entrar no grupo depois não vota, e o quórum não flutua.
* **O que cada um votou.** Votar é preencher `voto` na linha que já existe.

Como a chave primária é `(id_evidencia, id_usuario)`, o banco garante sozinho
dois fatos: voto único por jurado e nenhum voto de quem não está no júri.
Quórum = `floor(count(*)/2) + 1` sobre as linhas da evidência.

## Moderação por IA

`moderacao_desafio` registra toda avaliação do desafio antes de ele existir. A
relação com `aposta` é **0..1**: desafio reprovado nunca vira aposta, então a FK
é opcional. Os outros dois elementos da exigência entram em entidades
existentes: `usuario.data_nascimento` (RN26) e `grupo_amigos.nivel_filtro`
(RN27). Origem: [ADR 0015](../../02-arquitetura/adr/0015-idade-minima-e-moderacao-ia.md).
