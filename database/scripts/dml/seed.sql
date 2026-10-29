-- =============================================================================
-- DML Seed - Eu Duvido! (modelo v3)
-- =============================================================================
-- Massa de teste que prepara o estado ANTERIOR ao roteiro de demonstracao:
-- grupo formado, saldos iniciais, historico de desafios encerrados para o
-- ranking nao aparecer vazio, e um desafio parado em EM_VOTACAO faltando
-- exatamente um voto para o quorum.
--
-- Escrito a mao de proposito. Um seeder em C# que passasse pelo dominio nao
-- conseguiria criar estados intermediarios (desafio em votacao com escrow aberto)
-- sem simular o fluxo inteiro.
--
-- Ordem importa: o trigger trg_membro_credito_inicial lanca os 100 CP no ledger
-- automaticamente quando o membro entra, entao NAO inserimos CREDITO_INICIAL
-- manualmente.
--
-- Schema unico (public) desde o ADR 0016: nenhum nome leva prefixo de schema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Usuarios (RN05 - login Google, sem senha nem credencial guardada)
-- data_nascimento: todos com 16 anos ou mais. Um INSERT com menos que isso e
-- recusado pelo trigger trg_usuario_idade_minima (RN26).
-- -----------------------------------------------------------------------------
INSERT INTO usuario (nome, email, apelido, avatar_url, data_nascimento) VALUES
('Octávio Augusto',  'octavio@email.com', 'Tavin', 'https://lh3.googleusercontent.com/a/tavin', '2004-03-12'),
('Gabriel Santos',   'gabriel@email.com', 'Biel',  'https://lh3.googleusercontent.com/a/biel',  '2003-07-25'),
('Matheus Ferreira', 'matheus@email.com', 'Theus', 'https://lh3.googleusercontent.com/a/theus', '2004-11-02'),
('Larissa Mendes',   'larissa@email.com', 'Lari',  'https://lh3.googleusercontent.com/a/lari',  '2005-01-19'),
('Felipe Silva',     'felipe@email.com',  'Lipe',  'https://lh3.googleusercontent.com/a/lipe',  '2003-05-30');

-- -----------------------------------------------------------------------------
-- Grupo e membros - cada INSERT dispara 100 CP no ledger (RN06)
-- O ADMIN adiciona membros pelo e-mail (RN25); nao ha convite por codigo.
-- -----------------------------------------------------------------------------
INSERT INTO grupo_amigos (nome, descricao, id_criador, nivel_filtro) VALUES
('Os Inimigos do Fim', 'Grupo oficial de desafios, futebol e zoeira da faculdade', 1, 'MODERADO');

INSERT INTO membro_grupo (id_grupo, id_usuario, papel) VALUES
(1, 1, 'ADMIN'),
(1, 2, 'MEMBRO'),
(1, 3, 'MEMBRO'),
(1, 4, 'MEMBRO'),
(1, 5, 'MEMBRO');

-- -----------------------------------------------------------------------------
-- Categorias (lista fixa - sem tela de gestao)
-- -----------------------------------------------------------------------------
INSERT INTO categoria_desafio (nome, descricao) VALUES
('Esportes & Fitness', 'Desafios de corrida, academia, flexoes e partidas de futebol'),
('Prendas & Zoeira',   'Desafios comicos com prendas em publico ou redes sociais'),
('Games & E-sports',   'Desafios em partidas de FIFA, CS, LoL ou x1 de videogame'),
('Acadêmico',          'Desafios relacionados a notas de provas e entrega de projetos');

-- -----------------------------------------------------------------------------
-- Desafios
-- -----------------------------------------------------------------------------
-- 1: EM_VOTACAO - o estado que a demonstracao vai movimentar ao vivo.
-- 2: EM_ANDAMENTO - desafio aceito, aguardando cumprimento.
-- 3: FINALIZADA_CUMPRIU - historico para o ranking.
-- 4: ABERTA - ainda sem participantes.
-- descricao_recompensa e so descritiva: nenhum calculo a usa (RN02, ADR 0006).
INSERT INTO desafio
    (id_grupo, id_criador, id_categoria, titulo, descricao, valor_cp,
     tipo_recompensa, descricao_recompensa, data_limite, status,
     data_encerramento) VALUES
(1, 1, 1, 'Correr 5km abaixo de 25 minutos',
    'Biel duvidou que Tavin faz 5km em menos de 25 minutos no Parque Municipal.',
    20, 'MONETARIA', 'R$ 50,00', '2026-09-15 18:00:00-03', 'EM_VOTACAO', NULL),
(1, 2, 2, 'Ir fantasiado de dinossauro na aula',
    'Theus duvidou que Lipe vai para a aula do Prof. Mário de dinossauro inflável.',
    15, 'PRENDA_ACAO', 'Pagar 1 rodada de açaí para todo o grupo',
    '2026-10-05 19:00:00-03', 'EM_ANDAMENTO', NULL),
-- Entra como EM_VOTACAO e e encerrado pela procedure no fim deste script.
-- Semear direto como FINALIZADA_CUMPRIU faria a guarda de idempotencia de
-- encerrar_desafio retornar sem pagar, deixando o pote preso no escrow.
(1, 3, 3, 'Ganhar de 3 gols de diferença no FIFA',
    'X1 clássico no PS5 entre Gabriel e Matheus.',
    30, 'MONETARIA', 'R$ 100,00', '2026-09-01 22:00:00-03', 'EM_VOTACAO',
    NULL),
(1, 4, 4, 'Tirar nota máxima no projeto A3',
    'Lari duvidou que o grupo tira 40/40 na banca EXPOUNA.',
    25, 'PRENDA_ACAO', 'Usar a foto de perfil escolhida pelos amigos por 1 semana',
    '2026-12-05 23:59:59-03', 'ABERTA', NULL);

-- -----------------------------------------------------------------------------
-- Moderacao (RN28): todo desafio gravado passou pela IA, no nivel do grupo.
-- A avaliacao aprovada fica ligada ao desafio que ela liberou.
-- -----------------------------------------------------------------------------
INSERT INTO moderacao_desafio
    (id_grupo, id_criador, id_desafio, nivel_filtro, titulo, descricao, aprovado, motivo)
SELECT d.id_grupo, d.id_criador, d.id_desafio, 'MODERADO', d.titulo, d.descricao, TRUE,
       'Desafio leve, sem risco fisico relevante nem exposicao de ninguem.'
  FROM desafio d
 ORDER BY d.id_desafio;

-- -----------------------------------------------------------------------------
-- Participantes (RN09 - 1 DESAFIANTE e 1 DESAFIADO por desafio)
-- -----------------------------------------------------------------------------
INSERT INTO participante_desafio (id_desafio, id_usuario, papel_desafio, escolha) VALUES
-- Desafio 1: Tavin cumpre, Biel duvida, Theus aposta a favor.
(1, 1, 'DESAFIADO',  'VAI_CUMPRIR'),
(1, 2, 'DESAFIANTE', 'NAO_VAI_CUMPRIR'),
(1, 3, 'APOSTADOR',  'VAI_CUMPRIR'),
-- Desafio 2
(2, 5, 'DESAFIADO',  'VAI_CUMPRIR'),
(2, 3, 'DESAFIANTE', 'NAO_VAI_CUMPRIR'),
-- Desafio 3 (encerrado - Gabriel cumpriu)
(3, 2, 'DESAFIADO',  'VAI_CUMPRIR'),
(3, 3, 'DESAFIANTE', 'NAO_VAI_CUMPRIR');

-- -----------------------------------------------------------------------------
-- Escrow: CP debitado no aceite (RN18)
-- Cada chamada gera DOIS lancamentos - debito do usuario, credito do desafio.
-- -----------------------------------------------------------------------------
CALL debitar_escrow(1, 1);
CALL debitar_escrow(1, 2);
CALL debitar_escrow(1, 3);
CALL debitar_escrow(2, 5);
CALL debitar_escrow(2, 3);
CALL debitar_escrow(3, 2);
CALL debitar_escrow(3, 3);

-- -----------------------------------------------------------------------------
-- Evidencias
-- -----------------------------------------------------------------------------
-- Desafio 3: ja aceito, historico.
INSERT INTO evidencia
    (id_desafio, id_usuario, ordem, tipo_midia, url_comprovante, comentario,
     status, data_envio, data_limite_votacao, data_apuracao) VALUES
(3, 2, 1, 'VIDEO', 'https://midia.euduvido.app/provas/fifa_placar_final.mp4',
    'Placar final 4x1, print do PS5.', 'ACEITA',
    '2026-09-01 22:30:00-03', '2026-09-08 22:30:00-03', '2026-09-01 23:10:00-03');

-- Desafio 1: EM_VOTACAO - o alvo da demonstracao.
INSERT INTO evidencia
    (id_desafio, id_usuario, ordem, tipo_midia, url_comprovante, comentario,
     status, data_limite_votacao) VALUES
(1, 1, 1, 'FOTO', 'https://midia.euduvido.app/provas/strava_5km_tavin.png',
    'Print do Strava comprovando 5.02 km em 24min32s!', 'EM_VOTACAO',
    CURRENT_TIMESTAMP + INTERVAL '7 days');

-- -----------------------------------------------------------------------------
-- Juri congelado (RN14 - membros do grupo menos DESAFIANTE e DESAFIADO)
-- Cada jurado nasce sem voto; votar e preencher a linha (jurado_evidencia).
-- -----------------------------------------------------------------------------
-- Evidencia 1 (desafio 3): desafiado=Biel(2), desafiante=Theus(3).
-- Juri: Tavin(1), Lari(4), Lipe(5). Quorum = floor(3/2)+1 = 2.
INSERT INTO jurado_evidencia (id_evidencia, id_usuario) VALUES
(1, 1), (1, 4), (1, 5);

-- Evidencia 2 (desafio 1): desafiado=Tavin(1), desafiante=Biel(2).
-- Juri: Theus(3), Lari(4), Lipe(5). Quorum = 2.
INSERT INTO jurado_evidencia (id_evidencia, id_usuario) VALUES
(2, 3), (2, 4), (2, 5);

-- -----------------------------------------------------------------------------
-- Votos
-- -----------------------------------------------------------------------------
-- Evidencia 1: ja apurada (2 votos, quorum atingido).
-- Gravada com o trigger desligado porque trg_jurado_evidencia_valida so aceita
-- voto em evidencia EM_VOTACAO e dentro do prazo; este historico e anterior a
-- apuracao.
ALTER TABLE jurado_evidencia DISABLE TRIGGER trg_jurado_evidencia_valida;
UPDATE jurado_evidencia
   SET voto = 'VALIDO', justificativa = 'Video sem corte, placar claro.',
       data_voto = '2026-09-01 23:00:00-03'
 WHERE id_evidencia = 1 AND id_usuario = 1;
UPDATE jurado_evidencia
   SET voto = 'VALIDO', justificativa = 'Assisti ao vivo, ganhou limpo.',
       data_voto = '2026-09-01 23:05:00-03'
 WHERE id_evidencia = 1 AND id_usuario = 4;
ALTER TABLE jurado_evidencia ENABLE TRIGGER trg_jurado_evidencia_valida;

-- Evidencia 2: UM voto. Quorum e 2 - falta exatamente um para o desafio fechar.
-- E este voto que sera dado ao vivo na banca.
UPDATE jurado_evidencia
   SET voto = 'VALIDO', justificativa = 'O tempo bateu com o GPS, desafio pago com justiça.',
       data_voto = CURRENT_TIMESTAMP
 WHERE id_evidencia = 2 AND id_usuario = 3;

-- -----------------------------------------------------------------------------
-- Encerramento do desafio 3 (historico do ranking)
-- Distribui o pote de 60 CP para quem escolheu VAI_CUMPRIR.
-- -----------------------------------------------------------------------------
CALL encerrar_desafio(3, TRUE);

-- =============================================================================
-- Verificacao pos-seed
-- =============================================================================
-- Devem retornar ZERO linhas. Qualquer linha indica divergencia entre o saldo
-- materializado e o ledger, ou um pote preso num desafio encerrado - ou seja,
-- bug de contabilidade.
--
--   SELECT * FROM vw_reconciliacao_saldo;
--   SELECT * FROM vw_escrow_orfao;
--
-- Deve mostrar a evidencia 2 com votos_faltantes = 1:
--
--   SELECT * FROM vw_status_votacao WHERE status = 'EM_VOTACAO';
-- =============================================================================
