-- 1. Roles
INSERT INTO tb_role (authority) VALUES ('ROLE_ALUNO');
INSERT INTO tb_role (authority) VALUES ('ROLE_PROFESSOR');

-- 2. Usuários
INSERT INTO tb_user (id, name, email, password, phone, address) VALUES (1, 'Ana Aluna', 'ana.aluna@gmail.com', '$2a$10$.mmz3OqUecF234Bic.FuYO5uZF9eZZGYM7aDkVLpqGVKUqBfhwrAC', '11999990000', 'Rua A, 123');
INSERT INTO tb_user (id, name, email, password, phone, address) VALUES (2, 'Pedro Professor', 'pedro.professor@gmail.com', '$2a$10$HiGKZgV0susl4kodrIibkOlc.QPUmCK6D0o2.SqWLZa.Yg2vhOZwS', '11988880000', 'Rua B, 456');

-- 3. Vínculo Usuário ↔ Role
INSERT INTO tb_user_role (user_id, role_id) VALUES (1, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2, 2);

-- 4. Disciplinas
INSERT INTO tb_disciplina (title, description, created) VALUES ('Matemática', 'Disciplina de Matemática do ensino fundamental.', '2026-02-01T08:00:00');
INSERT INTO tb_disciplina (title, description, created) VALUES ('Português', 'Disciplina de Língua Portuguesa.', '2026-02-01T08:00:00');

-- 5. Turmas
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano A', '2026');
INSERT INTO tb_turma (name, school_year) VALUES ('9º Ano B', '2026');

-- 6. Atividades
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Lista de Exercícios 1', 'Resolver os exercícios das páginas 10 a 15.', 'ABERTA', 1);
INSERT INTO tb_atividade (title, content, status, disciplina_id) VALUES ('Redação Dissertativa', 'Escrever uma redação sobre o tema sorteado em sala.', 'ABERTA', 2);

-- 8. Boletins
INSERT INTO tb_boletim (period, final_average, status) VALUES ('1º Bimestre', 8.5, 'APROVADO');
INSERT INTO tb_boletim (period, final_average, status) VALUES ('1º Bimestre', 7.0, 'APROVADO');

-- 9. Notas (Vinculadas OBRIGATORIAMENTE à Entrega e ao Boletim)
INSERT INTO tb_nota (period, rate,  boletim_id) VALUES ('1º Bimestre', 8.5, 1);
INSERT INTO tb_nota (period, rate, boletim_id) VALUES ('1º Bimestre', 7.0, 2);