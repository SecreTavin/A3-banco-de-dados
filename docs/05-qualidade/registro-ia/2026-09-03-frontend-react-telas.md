# 2026-09-03 — Frontend React: telas de apostas, votação, ranking e perfil

| Campo | Valor |
| --- | --- |
| **Data** | 2026-09-03 |
| **Responsável** | Arthur Marzano |
| **Ferramenta** | Claude Code (Opus) |
| **Artefato afetado** | `apps/web/src/` — `App.tsx`, `main.tsx`, `shared/api/`, `shared/auth/AuthContext.tsx`, `shared/ui/status.ts`, `features/{apostas,votacao,ranking,perfil,grupos,autenticacao}/`, `apps/web/package.json` |

## O que foi pedido

Completar o app React: criar as features `apostas`, `votacao`, `ranking` e
`perfil` seguindo a estrutura de `features/grupos/` (pasta `hooks/` com um
arquivo por query ou command, `components/` só com componentes burros, `views/`
com a tela e um `.module.css` por feature), montar as rotas e a navegação, e
fazer o `npm run build` passar.

## O que a IA produziu

As quatro features completas, mais as views que faltavam em `grupos`
(`GruposView`, `DetalheGrupoView`), o `App.tsx` com guarda de rota e o
`main.tsx`. Também produziu a camada de leitura/escrita própria
(`shared/api/useConsulta.ts` e `useComando.ts`) que substituiu o React Query.

O `useVotacaoAoVivo` saiu correto quanto à regra do ADR 0011: o hub só avisa que
a transação commitou, então `votacaoAtualizada` e `apostaEncerrada` fazem a mesma
coisa — recarregar a lista. Nenhum dos dois tenta decidir resultado no cliente.

## O que a IA errou

Cinco problemas reais, todos encontrados antes do merge:

1. **Código pré-existente não compilava.** `LoginView.tsx` importava
   `shared/api/useRequisicao` e um componente `Erro` — nenhum dos dois existe no
   repositório. A tela nunca teria buildado.
2. **Dependência fora do acordado.** Todos os hooks de `grupos` e `autenticacao`
   usavam `@tanstack/react-query`, que não faz parte das dependências do projeto.
   Foram reescritos com `useState`/`useEffect` e a lib saiu do `package.json`;
   `shared/api/chaves.ts` (fábrica de chaves do React Query) virou código morto e
   foi removido.
3. **Componente escrito contra assinaturas inventadas.** Uma versão gerada do
   `CardEvidenciaVotavel` chamava `Badge` com prop `rotulo`, `Campo` com
   `valor`/`aoMudar`/`placeholder` e tratava `descreverPrazo()` como se
   devolvesse string. Nada disso existe em `shared/ui` — `Badge` recebe
   `children`, `Campo` recebe `children`, e `descreverPrazo` devolve
   `{ texto, vencido, urgente }`. Reescrito contra os componentes reais.
4. **`shared/api/tipos.ts` desatualizado em relação à API.** Faltavam campos que
   os endpoints já devolvem: `idGrupo` em `ApostaResumo`, `avatarUrl` em
   participante/comentário/ranking, `quorum`, `totalValidadores`,
   `votosFavoraveis`, `votosContra` e `dataLimiteVotacao` em `Evidencia`,
   `dataEncerramento` e `motivoCancelamento` em `ApostaDetalhe`, `dataCadastro`
   no usuário do perfil e `aposta` no extrato. Sem isso a tela de detalhe e a
   central de votação não teriam o que mostrar.
5. **Colisão de nome.** O tipo `LinhaRanking` e o componente `LinhaRanking`
   ocupavam o mesmo identificador. O tipo virou `PosicaoRanking`.

Ponto menor de UX: dois `EstadoVazio` receberam um `<Link>` cru como ação, que o
reset global (`a { color: inherit; text-decoration: none }`) renderizava como
texto comum — o usuário não veria que era clicável. Trocados por `Botao`.

## Como o time validou

- `npm run build` (`tsc -b && vite build`, com `noUnusedLocals` e
  `noUnusedParameters` ligados) executado até passar: 137 módulos, build limpo.
- Cada DTO de `shared/api/tipos.ts` conferido campo a campo contra os `SELECT ...
  AS "campo"` dos endpoints em `apps/api/EuDuvido.Api/Modules/` — a API foi
  tratada como fonte da verdade, não a suposição da IA.
- Nomes dos eventos e do método do hub conferidos contra
  `Shared/Realtime/VotacaoHub.cs` (`votacaoAtualizada`, `apostaEncerrada`,
  `EntrarNoGrupo`) e a rota contra `Program.cs` (`/hubs/votacao`).
- Regras de tela conferidas contra `docs/04-ux/telas/24` a `29` — em especial o
  teto de 5 evidências (RN10), o júri congelado no envio (RN14) e o motivo
  obrigatório no cancelamento (RN12).
- Script conferindo que toda classe `estilos.x` referenciada em `.tsx` existe no
  `.module.css` correspondente: zero divergências.

## Decisão final

Entrou tudo, com as cinco correções acima aplicadas. A convenção de CQRS foi
mantida no nome dos hooks (`useXQuery` para leitura, `useXCommand` para escrita),
agora sobre `useConsulta`/`useComando` em vez do React Query. `useComando`
devolve um `Resultado<S>` discriminado em vez de lançar, porque o `erro` do
estado só chega no render seguinte e a tela precisa decidir na hora — é o mesmo
espírito do Result Pattern usado na API.

A edição de perfil descrita no documento 29 ficou de fora: não existe endpoint de
escrita para ela.
