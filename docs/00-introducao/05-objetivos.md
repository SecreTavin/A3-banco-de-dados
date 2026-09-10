# 05 - Objetivos

## Objetivo Geral
Desenvolver um protótipo funcional do sistema **Eu Duvido!**, estruturado sobre um Banco de Dados relacional normalizado, povoado e integrado a uma interface de gerenciamento de apostas, prendas e votações.

## Objetivos Específicos

* Modelar um esquema relacional normalizado para o domínio de apostas
  sociais, organizado em módulos (`identidade`, `grupos`, `apostas`,
  `validacao`, `economia`, `notificacoes`), com integridade referencial
  garantida pelo SGBD entre os módulos.
* Implementar a apuração de quórum de validação e a liquidação do saldo de
  CP como lógica transacional dentro do PostgreSQL (procedure), eliminando a
  possibilidade de estado em que a evidência foi aceita e o CP não foi
  transferido.
* Garantir um ledger de transações de CP append-only e auditável, sem
  divergência entre saldo calculado e saldo lançado (RNF03).
* Construir uma API e um frontend que leiam e escrevam no banco pelo padrão
  CQRS (leitura via Dapper, escrita via EF Core), demonstrando uso efetivo —
  não apenas incidental — do Banco de Dados modelado.
* Prover validação de evidências por votação dos membros do grupo, com
  atualização em tempo real da contagem (RF07, RNF02).
* Produzir consultas analíticas sobre os dados povoados — ranking por grupo,
  histórico de apostas e percentual de aprovação (RF08) — que evidenciem o
  aproveitamento do modelo relacional para além do CRUD básico.
