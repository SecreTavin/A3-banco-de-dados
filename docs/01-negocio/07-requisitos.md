# 07 - Requisitos do Sistema

## 7.1 Requisitos Funcionais (RF)

### Identidade e grupos

* **RF01:** Cadastro e autenticação de usuários via Google (OAuth/OIDC). O
  sistema não possui senha própria.
* **RF02:** Gestão de grupos privados de amigos, com papéis `ADMIN` e `MEMBRO`.
* **RF10:** Perfil do usuário com nome, apelido, avatar e histórico pessoal de
  desafios, participações e evidências.

### Desafios

* **RF03:** Categorias de desafios (Esportes, Jogos, Prendas, Acadêmico) — lista
  fixa, sem tela de gestão.
* **RF04:** Criação de desafios com custo em CP e recompensa monetária ou prenda.
* **RF05:** Registro de participantes com papel (`DESAFIANTE`, `DESAFIADO`,
  `APOSTADOR`) e escolha (`VAI_CUMPRIR`, `NAO_VAI_CUMPRIR`).
* **RF12:** Cancelamento de desafio com motivo, estornando o CP dos participantes.

### Validação

* **RF06:** Submissão de fotos, vídeos, links ou texto como evidência de
  cumprimento, com upload direto para o storage de objetos.
  **Estado:** implementada para link e texto; foto e vídeo entram como link
  externo (`url_comprovante`). O upload direto de arquivo para o storage
  **não foi implementado** — ver [19 - Limitações](../06-encerramento/19-limitacoes-e-melhorias.md).
* **RF07:** Votação de validação pelos membros do grupo, com justificativa.
* **RF13:** Apuração automática do resultado quando o quórum é atingido,
  encerrando o desafio e liquidando o CP na mesma transação.

### Moderação

* **RF16:** Idade mínima de 16 anos no cadastro e moderação por IA de todo
  desafio, no nível de filtro do grupo, com registro da avaliação.

### Economia e ranking

* **RF14:** Carteira de CP por grupo, com saldo e extrato de lançamentos.
* **RF08:** Ranking por grupo com histórico completo — maiores desafios,
  percentual de aprovação e desafios cumpridos versus perdidos.


## 7.2 Requisitos Não Funcionais (RNF)

* **RNF01:** Interface responsiva mobile-first, utilizável no navegador do
  celular sem instalação.
* **RNF02:** Atualização ao vivo da Central de Votação — a contagem de votos e o
  encerramento do desafio chegam sem recarregar a página.
* **RNF03:** Integridade referencial e transacional garantidas pelo SGBD, não
  apenas pela aplicação.
* **RNF04:** Observabilidade com logs estruturados, métricas de domínio e
  estatísticas de consultas (`pg_stat_statements`).
* **RNF05:** O DDL versionado deve ser válido e aplicável — verificado a cada
  commit pelo CI contra um PostgreSQL limpo.

## 7.3 Fora do escopo do MVP

Registrado aqui para que a ausência seja deliberada, não esquecimento. Ver
[19 - Limitações e Melhorias Futuras](../06-encerramento/19-limitacoes-e-melhorias.md).

| Item | Situação |
| --- | --- |
| Convite para grupo por código | Fora do escopo; o `ADMIN` adiciona membros |
| Comentários no desafio e chat por grupo | Fora do escopo |
| Notificações e Web Push | Fora do escopo |
| Login por email e senha | Fora do escopo; só Google |
| Upload de avatar próprio | Usa a foto do Google |
| Cache distribuído e fila de mensagens | Sem carga que justifique |
| Aplicativo nativo iOS/Android | Site responsivo atende |
