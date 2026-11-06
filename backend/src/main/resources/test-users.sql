-- Usuários de teste com senhas conhecidas

-- ALUNO
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at)
VALUES (9000001, 'aluno@teste.com', '$2b$10$mC41wC7m5pFAXbmzuK2KEOvLPOne/ax.ExkvlpVOXsSP/rJ6P4E5.', FALSE, TRUE, '2026-11-04');
INSERT INTO tb_user_role (user_id, role_id) VALUES (9000001, 1);

-- PROFESSOR
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at)
VALUES (9000002, 'professor@teste.com', '$2b$10$zyMV7g8nFnle0eYaqeJAkevD7Qvo7.AoN97svEdeq/MW9tznmfCE6', FALSE, TRUE, '2026-11-04');
INSERT INTO tb_user_role (user_id, role_id) VALUES (9000002, 2);

-- RESPONSÁVEL
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at, terms_accepted_at)
VALUES (9000003, 'responsavel@teste.com', '$2b$10$lEFQ83zqQ8cFRS6i.WoAcuK5ZEXnfmd5GXa52gtMvy1D8pC.JoRN2', FALSE, TRUE, '2026-11-04', '2026-11-04T08:00:00');
INSERT INTO tb_user_role (user_id, role_id) VALUES (9000003, 3);

-- ADMIN
INSERT INTO tb_user (id, email, password, first_login, ativo, created_at)
VALUES (9000004, 'admin@teste.com', '$2b$10$Sfit1MIKg4QUFD6TK4QsNOrb3MM6emSjJVMCa93JQicL0ZV4EhwQG', FALSE, TRUE, '2026-11-04');
INSERT INTO tb_user_role (user_id, role_id) VALUES (9000004, 4);
