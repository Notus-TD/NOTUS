-- 1. Roles
INSERT INTO tb_role (authority) VALUES ('ROLE_ALUNO');
INSERT INTO tb_role (authority) VALUES ('ROLE_PROFESSOR');
INSERT INTO tb_role (authority) VALUES ('ROLE_RESPONSAVEL');
INSERT INTO tb_role (authority) VALUES ('ROLE_ADMIN');

-- 2. Usuários (id = ano + sequência; senha para todos: 123456; first_login=FALSE pois já têm senha definida)
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000001, 'ana.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000002, 'pedro.professor@gmail.com', '$2a$10$HiGKZgV0susl4kodrIibkOlc.QPUmCK6D0o2.SqWLZa.Yg2vhOZwS', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000003, 'marta.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000004, 'admin@notus.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000005, 'carlos.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000006, 'bruno.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000007, 'fernanda.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000008, 'camila.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000009, 'diego.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');

-- 3. Vínculo Usuário ↔ Role
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000001, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000002, 2);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000003, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000004, 4);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000005, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000006, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000007, 3);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000008, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2026000009, 1);

-- 4. Responsável (herança JOINED: mesmo id do tb_user)
INSERT INTO tb_responsible (id, name, cpf, phone, address) VALUES (2026000003, 'Marta Responsável', '123.456.789-00', '11977770000', 'Rua C, 789');
INSERT INTO tb_responsible (id, name, cpf, phone, address) VALUES (2026000005, 'Carlos Costa', '234.567.890-11', '11966660000', 'Rua D, 123');
INSERT INTO tb_responsible (id, name, cpf, phone, address) VALUES (2026000007, 'Fernanda Rocha', '345.678.901-22', '11955550000', 'Rua E, 456');

-- 5. Aluno (herança JOINED: mesmo id do tb_user, vinculado ao responsável acima)
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id) VALUES (2026000001, 'Ana Aluna', 20260001, '2012-05-10', 'ATIVA', 2026000003);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id) VALUES (2026000006, 'Bruno Costa', 20260002, '2012-09-22', 'ATIVA', 2026000005);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id) VALUES (2026000008, 'Camila Rocha', 20260003, '2013-01-30', 'ATIVA', 2026000007);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id) VALUES (2026000009, 'Diego Rocha', 20260004, '2011-11-05', 'ATIVA', 2026000007);

-- 6. Disciplinas
INSERT INTO tb_disciplina (title, description, created) VALUES ('Matemática', 'Disciplina de Matemática do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Português', 'Disciplina de Língua Portuguesa.', '2026-02-01T08:00:00');

-- 7. Turmas
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano A', '2026');
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano B', '2026');

-- 8. Atividades
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Lista de Exercícios 1', 'Resolver os exercícios das páginas 10 a 15.', 'ABERTA', 1);
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Redação Dissertativa', 'Escrever uma redação sobre o tema sorteado em sala.', 'ABERTA', 2);

-- 9. Boletins (final_average = média das médias por disciplina das notas abaixo)
INSERT INTO tb_boletim (period, final_average, status, student_id) VALUES ('1º Bimestre', 8.75, 'APROVADO', 2026000001);
INSERT INTO tb_boletim (period, final_average, status, student_id) VALUES ('1º Bimestre', 7.0, 'APROVADO', 2026000001);

-- 10. Notas (cada uma vinculada a um Boletim E a uma Disciplina)
INSERT INTO tb_nota (period, rate, boletim_id, disciplina_id) VALUES ('1º Bimestre', 8.5, 1, 1);
INSERT INTO tb_nota (period, rate, boletim_id, disciplina_id) VALUES ('1º Bimestre', 9.0, 1, 2);
INSERT INTO tb_nota (period, rate, boletim_id, disciplina_id) VALUES ('1º Bimestre', 7.0, 2, 2);

-- 11. Faltas (aluno_id=1 é Ana Aluna, registrado_por_id=2 é Pedro Professor)
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-02', 1, '2026-03-02T08:10:00', 2026000001, 1, 2026000002);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-09', 2, '2026-03-09T08:10:00', 2026000001, 2, 2026000002);