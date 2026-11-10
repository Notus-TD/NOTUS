BEGIN;

ALTER TABLE tb_aula_registro ADD COLUMN IF NOT EXISTS quantidade_aulas integer;
UPDATE tb_aula_registro SET quantidade_aulas = 1 WHERE quantidade_aulas IS NULL;
ALTER TABLE tb_aula_registro ALTER COLUMN quantidade_aulas SET NOT NULL;
ALTER TABLE tb_aula_registro ALTER COLUMN quantidade_aulas SET DEFAULT 1;

UPDATE tb_aula_registro a SET ano_letivo = t.school_year
FROM tb_turma t
WHERE a.turma_id = t.id AND a.ano_letivo IS NULL;

UPDATE tb_falta f SET ano_letivo = t.school_year
FROM tb_student s
JOIN tb_turma t ON t.id = s.turma_id
WHERE f.student_id = s.id AND f.ano_letivo IS NULL;

UPDATE tb_falta SET quantidade = 2 WHERE quantidade > 2;

COMMIT;
