INSERT INTO tb_role (authority) VALUES ('ROLE_ALUNO');
INSERT INTO tb_role (authority) VALUES ('ROLE_PROFESSOR');
INSERT INTO tb_role (authority) VALUES ('ROLE_RESPONSAVEL');
INSERT INTO tb_role (authority) VALUES ('ROLE_ADMIN');

INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000001, 'ana.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000002, 'pedro.professor@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at, terms_accepted_at) VALUES (2026000003, 'marta.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01', '2026-02-01T08:00:00');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000004, 'admin@notus.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000005, 'carlos.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000006, 'juliana.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000007, 'bruno.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000008, 'carla.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000009, 'bruno.costa.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000010, 'fernanda.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000011, 'camila.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at) VALUES (2026000012, 'diego.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, TRUE, '2026-02-01');

INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000001, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000002, 2);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000003, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000004, 4);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000005, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000006, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000007, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000008, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000009, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000010, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000011, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000012, 1);

INSERT INTO tb_responsible (id, name, phone) VALUES (2026000003, 'Marta Responsável', '11977770000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000005, 'Carlos Costa', '11966660000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000006, 'Juliana Santos', '11955550000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000010, 'Fernanda Rocha', '11955550000');

INSERT INTO tb_professor (id, full_name) VALUES (2026000002, 'Pedro Professor');

INSERT INTO tb_disciplina (title, description, created) VALUES ('Matemática', 'Disciplina de Matemática do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Português', 'Disciplina de Língua Portuguesa.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Ciências', 'Disciplina de Ciências do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Educação Física', 'Disciplina de Educação Física.', '2026-02-01T08:00:00');

INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano A', '2026');
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano B', '2026');

INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000001, 'Ana Aluna', 20260001, '2012-05-10', 'ATIVA', 2026000003, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000007, 'Bruno Ferreira', 20260002, '2012-08-15', 'ATIVA', 2026000005, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000008, 'Carla Santos', 20260003, '2013-01-22', 'ATIVA', 2026000006, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000009, 'Bruno Costa', 20260005, '2012-09-22', 'ATIVA', 2026000005, 2);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000011, 'Camila Rocha', 20260006, '2013-01-30', 'ATIVA', 2026000010, 2);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000012, 'Diego Rocha', 20260007, '2011-11-05', 'ATIVA', 2026000010, 2);

INSERT INTO tb_lecionamento (turma_id, disciplina_id, professor_id) VALUES (1, 1, 2026000002);
INSERT INTO tb_lecionamento (turma_id, disciplina_id, professor_id) VALUES (2, 1, 2026000002);

INSERT INTO tb_atividade (title, content, bimestre, prazo, publicada_em, pontos, disciplina_id, turma_id) VALUES ('Lista de Exercícios 1', 'Resolver os exercícios das páginas 10 a 15. Vale 1 ponto na nota final.', 'QUARTO', '2026-10-30', '2026-10-13T10:00:00', 1.0, 1, 1);
INSERT INTO tb_atividade (title, content, bimestre, prazo, publicada_em, disciplina_id, turma_id) VALUES ('Redação Dissertativa', 'Escrever uma redação sobre o tema sorteado em sala.', 'QUARTO', '2026-10-15', '2026-10-06T10:00:00', 2, 1);
INSERT INTO tb_atividade (title, content, bimestre, prazo, publicada_em, pontos, disciplina_id, turma_id) VALUES ('Lista de Equações', 'Resolver as equações do 1º grau da página 42.', 'QUARTO', '2026-11-05', '2026-10-14T10:00:00', 2.0, 1, 2);

INSERT INTO tb_entrega (status, pontos_obtidos, atividade_id, student_id) VALUES ('ENTREGUE', 1.0, 1, 2026000001);
INSERT INTO tb_entrega (status, pontos_obtidos, atividade_id, student_id) VALUES ('ATRASADA', 0.5, 1, 2026000007);

INSERT INTO tb_nota (descricao, rate, bimestre, student_id, disciplina_id) VALUES ('Prova 1', 8.5, 'PRIMEIRO', 2026000001, 1);
INSERT INTO tb_nota (descricao, rate, bimestre, student_id, disciplina_id) VALUES ('Trabalho em grupo', 9.0, 'PRIMEIRO', 2026000001, 1);
INSERT INTO tb_nota (descricao, rate, bimestre, student_id, disciplina_id) VALUES ('Prova 1', 7.0, 'PRIMEIRO', 2026000001, 2);
INSERT INTO tb_nota (descricao, rate, bimestre, student_id, disciplina_id) VALUES ('Prova 2', 6.5, 'SEGUNDO', 2026000001, 1);

INSERT INTO tb_boletim (bimestre, nota_final, lancado_em, student_id, disciplina_id, lancado_por_id) VALUES ('PRIMEIRO', 9.0, '2026-04-30T18:00:00', 2026000001, 1, 2026000002);

INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-02', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-09', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-16', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-23', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-03', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-10', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-17', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-05', 3);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-12', 3);

INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-02', 1, '2026-03-02T08:10:00', 2026000001, 1, 2026000002);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-10', 1, '2026-03-10T08:10:00', 2026000001, 2, 2026000002);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-12', 1, '2026-03-12T08:15:00', 2026000007, 3, 2026000002);
