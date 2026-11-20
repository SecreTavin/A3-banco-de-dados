-- Categorias de desafio: lista fixa, sem tela de gestão.
-- Carga mínima de um banco sem o seed (scripts/demo/recriar-banco.sh --vazio):
-- sem categoria, nenhum desafio pode ser criado. O seed.sql insere a mesma
-- lista; mudando aqui, mude lá também.
INSERT INTO categoria_desafio (nome, descricao) VALUES
('Esportes & Fitness', 'Desafios de corrida, academia, flexoes e partidas de futebol'),
('Prendas & Zoeira',   'Desafios comicos com prendas em publico ou redes sociais'),
('Games & E-sports',   'Desafios em partidas de FIFA, CS, LoL ou x1 de videogame'),
('Acadêmico',          'Desafios relacionados a notas de provas e entrega de projetos');
