# 2026-11-20 — Banco da demonstração e SQL ao vivo

| Campo | Valor |
| --- | --- |
| **Data** | 2026-11-20 |
| **Responsável** | Octávio Arruda (Product Owner) |
| **Ferramenta** | Claude Code (Opus 5.5) |
| **Artefato afetado** | `scripts/demo/recriar-banco.sh`, `scripts/demo/conferir-demo.sh`, `scripts/demo/ver-sql.py` (novos), documento 16 |

## O que foi pedido

Duas coisas para a banca:
* uma forma segura de o Rafael recriar o banco da VM no estado do roteiro, sem
  errar;
* um jeito de mostrar à banca as chamadas ao banco enquanto a demonstração
  acontece.

## Prompt utilizado

> Escrever a seed que o Rafael tem que subir na VM dele, pra que ele não cometa erros com o roteiro de testes

> Temos que dar um jeito de mostrar as "calls" do db enquanto fazemos a apresentação

Escolha do PO, respondida a uma pergunta da IA:

> Calls do DB: terminal ao lado.

## O que a IA produziu

* **`recriar-banco.sh`:**
  * para a API e apaga só o schema `public`;
  * aplica o `schema.sql` e o `seed.sql` pelo `psql`, então funciona mesmo
    com o seed desligado no *initdb*, como na VM;
  * sobe a API e roda a conferência no fim;
  * pede para digitar `RECRIAR` antes de apagar.
* **`conferir-demo.sh`:** só lê o banco e confere 13 pré-condições do roteiro da
  banca (usuários, estados dos desafios, voto pendente da Lari, saldos e views
  vazias), com código de saída 1 se algo divergir.
* **`ver-sql.py`:**
  * liga `log_statement = 'all'` por `ALTER SYSTEM`, sem reiniciar o banco;
  * acompanha o log do contêiner e mostra cada comando da aplicação colorido,
    com os parâmetros preenchidos;
  * deixa de fora o `psql`, o `SELECT 1` do pool e os `SAVEPOINT` do EF Core;
  * desliga o log ao sair.

## O que a IA errou

* **Dois `ALTER SYSTEM` no mesmo `-c`.** O `psql` executa os comandos de um
  `-c` numa transação só, e `ALTER SYSTEM` não pode rodar dentro de transação.
  Corrigido passando um `-c` por comando.
* **O nome da aplicação quebrou o filtro.** O Npgsql não manda nome, e o
  PostgreSQL grava `[[unknown]]`, com colchetes dentro. O padrão
  `\[([^\]]*)\]` não reconhecia a linha, e nenhum comando aparecia. Corrigido.
* **Teste em segundo plano não desligava o log.** Um processo em segundo plano
  ignora o `Ctrl+C` (SIGINT), então o teste deixou o log ligado. O script também
  trata o SIGTERM. Na apresentação, ele roda em primeiro plano.

## Como o time validou

Num ambiente de ensaio (projeto Docker separado):

* **Conferência:** num banco já usado em testes, acusou 4 divergências e saiu
  com código 1.
* **Recriação:** depois de `recriar-banco.sh --sim`, que levou 6 segundos, as
  13 conferências passaram e a API respondeu ao `/health` e ao login.
* **SQL ao vivo:** com o voto da Lari, o `ver-sql.py` mostrou a transação
  inteira: `BEGIN`, o `UPDATE` em `jurado_evidencia`,
  `CALL apurar_votacao('2')` e `COMMIT`. Ao sair, `log_statement` voltou a
  `none`.

## Decisão final

Entram os três scripts e a documentação no documento 16. O roteiro da banca
passa a usar a conferência na preparação e o SQL ao vivo durante a
demonstração.
