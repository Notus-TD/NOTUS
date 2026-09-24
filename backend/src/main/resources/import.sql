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
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000006, 'juliana.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000007, 'bruno.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000008, 'carla.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000009, 'bruno.costa.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000010, 'fernanda.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', TRUE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000011, 'camila.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');
INSERT INTO tb_user (id, email, password, first_login, created_at) VALUES (2026000012, 'diego.aluno@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', FALSE, '2026-02-01');

-- 3. Vínculo Usuário ↔ Role
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

-- 4. Responsáveis (herança JOINED: mesmo id do tb_user)
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000003, 'Marta Responsável', '11977770000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000005, 'Carlos Costa', '11966660000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000006, 'Juliana Santos', '11955550000');
INSERT INTO tb_responsible (id, name, phone) VALUES (2026000010, 'Fernanda Rocha', '11955550000');

-- 4.1 Professores (herança JOINED: mesmo id do tb_user)
INSERT INTO tb_professor (id, full_name) VALUES (2026000002, 'Pedro Professor');

-- 5. Disciplinas
INSERT INTO tb_disciplina (title, description, created) VALUES ('Matemática', 'Disciplina de Matemática do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Português', 'Disciplina de Língua Portuguesa.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Ciências', 'Disciplina de Ciências do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Educação Física', 'Disciplina de Educação Física.', '2026-02-01T08:00:00');

-- 6. Turmas
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano A', '2026');
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano B', '2026');

-- 7. Alunos (herança JOINED: mesmo id do tb_user, vinculados ao responsável e à turma correspondentes)
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000001, 'Ana Aluna', 20260001, '2012-05-10', 'ATIVA', 2026000003, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000007, 'Bruno Ferreira', 20260002, '2012-08-15', 'ATIVA', 2026000005, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000008, 'Carla Santos', 20260003, '2013-01-22', 'ATIVA', 2026000006, 1);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000009, 'Bruno Costa', 20260005, '2012-09-22', 'ATIVA', 2026000005, 2);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000011, 'Camila Rocha', 20260006, '2013-01-30', 'ATIVA', 2026000010, 2);
INSERT INTO tb_student (id, full_name, matricula, birth_date, status_matricula, responsible_id, turma_id) VALUES (2026000012, 'Diego Rocha', 20260007, '2011-11-05', 'ATIVA', 2026000010, 2);

-- 7.1 Lecionamentos (vínculo professor ↔ turma ↔ disciplina; cada professor leciona uma
-- única disciplina, mas pode dar aula em várias turmas. Pedro Professor = 2026000002, Matemática.)
INSERT INTO tb_lecionamento (turma_id, disciplina_id, professor_id) VALUES (1, 1, 2026000002);
INSERT INTO tb_lecionamento (turma_id, disciplina_id, professor_id) VALUES (2, 1, 2026000002);

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

-- 11. Aulas registradas (denominador do % de presença) — Matemática e Português já
-- com um histórico de algumas semanas; Ciências com só 2 aulas; Educação Física
-- fica sem nenhuma aula ainda, pra testar o estado "nenhuma aula registrada".
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-02', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-09', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-16', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-23', 1);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-03', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-10', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-17', 2);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-05', 3);
INSERT INTO tb_aula_registro (data, disciplina_id) VALUES ('2026-03-12', 3);

-- 12. Faltas (quantidade sempre 1 = 1 aula perdida, alinhado com 1 registro de aula
-- por dia; registrado_por_id=2026000002 é Pedro Professor)
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-02', 1, '2026-03-02T08:10:00', 2026000001, 1, 2026000002);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-10', 1, '2026-03-10T08:10:00', 2026000001, 2, 2026000002);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-12', 1, '2026-03-12T08:15:00', 2026000007, 3, 2026000002);
