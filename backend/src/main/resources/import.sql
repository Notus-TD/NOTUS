-- 1. Roles
INSERT INTO tb_role (authority) VALUES ('ROLE_ALUNO');
INSERT INTO tb_role (authority) VALUES ('ROLE_PROFESSOR');
INSERT INTO tb_role (authority) VALUES ('ROLE_RESPONSAVEL');

-- 2. Usuários (senha para todos: 123456; first_login=FALSE pois já têm senha definida)
INSERT INTO tb_user (name, email, password, phone, address, first_login) VALUES ('Ana Aluna', 'ana.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', '11999990000', 'Rua A, 123', FALSE);
INSERT INTO tb_user (name, email, password, phone, address, first_login) VALUES ('Pedro Professor', 'pedro.professor@gmail.com', '$2a$10$HiGKZgV0susl4kodrIibkOlc.QPUmCK6D0o2.SqWLZa.Yg2vhOZwS', '11988880000', 'Rua B, 456', FALSE);
INSERT INTO tb_user (name, email, password, phone, address, first_login) VALUES ('Marta Responsável', 'marta.responsavel@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', '11977770000', 'Rua C, 789', FALSE);

-- 3. Vínculo Usuário ↔ Role
INSERT INTO tb_user_role (user_id, role_id) VALUES (1, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2, 2);
INSERT INTO tb_user_role (user_id, role_id) VALUES (3, 3);

-- 4. Responsável (1:1 com o User via @MapsId — mesmo id do usuário)
INSERT INTO tb_responsible (id, name, email, phone, cpf) VALUES (3, 'Marta Responsável', 'marta.responsavel@gmail.com', '11977770000', '123.456.789-00');

-- 5. Aluno (1:1 com o User via @MapsId, vinculado ao responsável acima)
INSERT INTO tb_student (id, responsible_id) VALUES (1, 3);

-- 6. Disciplinas
INSERT INTO tb_disciplina (title, description, created) VALUES ('Matemática', 'Disciplina de Matemática do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Português', 'Disciplina de Língua Portuguesa.', '2026-02-01T08:00:00');

-- 7. Turmas
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano A', '2026');
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano B', '2026');

-- 8. Atividades
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Lista de Exercícios 1', 'Resolver os exercícios das páginas 10 a 15.', 'ABERTA', 1);
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Redação Dissertativa', 'Escrever uma redação sobre o tema sorteado em sala.', 'ABERTA', 2);

-- 9. Boletins
INSERT INTO tb_boletim (period, final_average, status) VALUES ('1º Bimestre', 8.5, 'APROVADO');
INSERT INTO tb_boletim (period, final_average, status) VALUES ('1º Bimestre', 7.0, 'APROVADO');

-- 10. Notas (Vinculadas OBRIGATORIAMENTE à Entrega e ao Boletim)
INSERT INTO tb_nota (period, rate,  boletim_id) VALUES ('1º Bimestre', 8.5, 1);
INSERT INTO tb_nota (period, rate, boletim_id) VALUES ('1º Bimestre', 7.0, 2);

-- 11. Faltas (aluno_id=1 é Ana Aluna, registrado_por_id=2 é Pedro Professor)
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-02', 1, '2026-03-02T08:10:00', 1, 1, 2);
INSERT INTO tb_falta (data, quantidade, registrado_em, student_id, disciplina_id, registrado_por_id) VALUES ('2026-03-09', 2, '2026-03-09T08:10:00', 1, 2, 2);