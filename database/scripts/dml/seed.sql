-- DML Seed Eu Duvido!
INSERT INTO usuario (nome, email, apelido, senha_hash) VALUES
('Octávio Augusto', 'octavio@email.com', 'Tavin', '$2b$12$hash1'),
('Gabriel Santos', 'gabriel@email.com', 'Biel', '$2b$12$hash2'),
('Matheus Ferreira', 'matheus@email.com', 'Theus', '$2b$12$hash3'),
('Larissa Mendes', 'larissa@email.com', 'Lari', '$2b$12$hash4'),
('Felipe Silva', 'felipe@email.com', 'Lipe', '$2b$12$hash5');

INSERT INTO grupo_amigos (nome, descricao, id_criador) VALUES
('Os Inimigos do Fim', 'Grupo oficial de desafios, futebol e apostas da faculdade', 1);

INSERT INTO membro_grupo (id_grupo, id_usuario, papel) VALUES
(1, 1, 'ADMIN'),
(1, 2, 'MEMBRO'),
(1, 3, 'MEMBRO'),
(1, 4, 'MEMBRO'),
(1, 5, 'MEMBRO');

INSERT INTO categoria_desafio (nome, descricao) VALUES
('Esportes & Fitness', 'Desafios de corrida, academia, flexões e partidas de futebol'),
('Prendas & Zoeira', 'Desafios cômicos com prendas em público ou redes sociais'),
('Games & E-sports', 'Apostas em partidas de FIFA, CS, LoL ou x1 de videogame'),
('Acadêmico', 'Desafios relacionados a notas de provas e entrega de projetos');

INSERT INTO aposta (id_grupo, id_criador, id_categoria, titulo, descricao, tipo_recompensa, valor_monetario, descricao_prenda, data_limite, status) VALUES
(1, 1, 1, 'Correr 5km abaixo de 25 minutos', 'Biel duvidou que Tavin faz 5km em menos de 25 minutos no Parque Municipal.', 'MONETARIA', 50.00, NULL, '2026-09-15 18:00:00', 'EM_VOTACAO'),
(1, 2, 2, 'Ir fantasiado de dinossauro na aula', 'Theus duvidou que Lipe vai para a aula do Prof. Mário de dinossauro inflável.', 'PRENDA_ACAO', NULL, 'Pagar 1 rodada de açaí para todo o grupo', '2026-10-05 19:00:00', 'EM_ANDAMENTO'),
(1, 3, 3, 'Ganhar de 3 gols de diferença no FIFA', 'X1 clássico no PS5 entre Gabriel e Matheus.', 'MONETARIA', 100.00, NULL, '2026-09-01 22:00:00', 'FINALIZADA_CUMPRIU'),
(1, 4, 4, 'Tirar nota máxima no projeto A3', 'Lari duvidou que o grupo tira 40/40 na banca EXPOUNA.', 'PRENDA_ACAO', NULL, 'Usar a foto de perfil do grupo escolhida pelos amigos por 1 semana', '2026-12-05 23:59:59', 'ABERTA');

INSERT INTO participante_aposta (id_aposta, id_usuario, papel_aposta, escolha) VALUES
(1, 1, 'DESAFIADO', 'VAI_CUMPRIR'),
(1, 2, 'DESAFIANTE', 'NAO_VAI_CUMPRIR'),
(1, 3, 'APOSTADOR', 'VAI_CUMPRIR'),
(2, 5, 'DESAFIADO', 'VAI_CUMPRIR'),
(2, 3, 'DESAFIANTE', 'NAO_VAI_CUMPRIR');

INSERT INTO evidencia (id_aposta, id_usuario, tipo_midia, url_comprovante, comentario) VALUES
(1, 1, 'FOTO', 'https://storage.euduvido.app/provas/strava_5km_tavin.png', 'Print do Strava comprovando 5.02 km em 24min32s!');

INSERT INTO voto_evidencia (id_evidencia, id_usuario, voto, justificativa) VALUES
(1, 2, 'VALIDO', 'O tempo bateu com o GPS, aposta paga com justiça.'),
(1, 3, 'VALIDO', 'Vi no Strava em tempo real, cumpriu!'),
(1, 4, 'VALIDO', 'Evidência clara e sem cortes.');
