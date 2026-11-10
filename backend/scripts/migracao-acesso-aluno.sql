BEGIN;

ALTER TABLE tb_student ADD COLUMN IF NOT EXISTS acesso_liberado_em timestamp;

UPDATE tb_student s SET acesso_liberado_em = now()
FROM tb_user u
WHERE u.id = s.id
  AND u.first_login = false
  AND u.anonimizado_em IS NULL
  AND s.acesso_liberado_em IS NULL;

ALTER TABLE tb_user ALTER COLUMN email DROP NOT NULL;

COMMIT;
