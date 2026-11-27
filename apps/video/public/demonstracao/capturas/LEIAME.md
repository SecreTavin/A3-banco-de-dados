# Capturas do vídeo "Demonstracao"

Telas reais da aplicação, capturadas por
[`scripts/capturar-demonstracao.mjs`](../../../scripts/capturar-demonstracao.mjs)
num sistema **local**, com contas e e-mails de exemplo (`arthur@exemplo.com` e
outros). Nada aqui vem de `euduvido.falveshub.com`.

## Como regenerar

Na raiz do repositório, com o Docker no ar. O projeto `euduvido-video` tem
volumes próprios e não mexe em outro banco local.

```bash
export COMPOSE_PROJECT_NAME=euduvido-video
docker compose -f docker-compose.yml -f scripts/testes/compose.ia-falsa.yml up -d --build
scripts/demo/recriar-banco.sh --vazio --sim
```

Depois, em `apps/video`:

```bash
npm ci
EUDUVIDO_DB=euduvido-video-db-1 node scripts/capturar-demonstracao.mjs
```

O script recusa rodar fora do `localhost` ou num banco com usuários. Para rodar de
novo, recrie o banco com o mesmo `recriar-banco.sh --vazio --sim`. No macOS,
informe `CHROME_PATH` (o padrão é o caminho do Chrome no Windows).

Ao terminar, desligue o ambiente: `docker compose down` (com `-v` para apagar os
volumes do projeto `euduvido-video`).

## O que sai

| Arquivo | O que é |
| --- | --- |
| `NN-nome.png` | Captura a 2x: desktop em 1440x900, celular (capítulos 5 e 6) em 390x844 |
| `07-antes.png` e `07-fecha.png` | Navegador do Octávio na Votação antes e depois do voto do Luís no celular. A página não recarrega entre as duas: o script confere isso, e o placar muda pelo SignalR |
| `capturas.json` | Tamanho de cada captura e as caixas dos elementos que o vídeo aponta, em px de CSS |
| `conferencia.txt` | O que o PostgreSQL mostrou em cada passo: saldos, pote, júri, status, extrato e as duas views |
| `prova-corrida.png` | Ilustração do print do app de corrida, desenhada pelo script |

## O que não é a aplicação real

| Item | Por quê | O que é real em volta |
| --- | --- | --- |
| Botão "Fazer login com o Google" | O script do Google não se automatiza e o ambiente local não tem `GOOGLE_CLIENT_ID`. Um substituto local desenha o botão | O formulário **Complete seu cadastro**, a chamada `POST /api/auth/cadastro` e a recusa de idade vêm da API real |
| Resposta da IA de moderação | Moderador simulado: aprova tudo, menos a vodka, com 2,5 s de demora | A tela, o registro em `moderacao_desafio` e a recusa sem linha em `desafio` |
| Foto da prova | Ilustração, para nenhuma imagem real entrar no repositório | O upload pela API, a linha em `evidencia` e o júri |

O script também bloqueia qualquer requisição que não vá para o `localhost`.
