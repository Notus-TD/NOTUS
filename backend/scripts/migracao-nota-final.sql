BEGIN;

DROP TABLE IF EXISTS tb_presenca;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = 'tb_lecionamento'::regclass AND contype = 'u' LOOP
        EXECUTE format('ALTER TABLE tb_lecionamento DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;
ALTER TABLE tb_lecionamento ADD CONSTRAINT uk_lecionamento_turma_disciplina UNIQUE (turma_id, disciplina_id);

ALTER TABLE tb_nota ADD COLUMN IF NOT EXISTS descricao varchar(255);
ALTER TABLE tb_nota ADD COLUMN IF NOT EXISTS bimestre varchar(255);
ALTER TABLE tb_nota ADD COLUMN IF NOT EXISTS student_id bigint;

UPDATE tb_nota n
SET student_id = b.student_id,
    bimestre = CASE
        WHEN b.period ILIKE '1%' THEN 'PRIMEIRO'
        WHEN b.period ILIKE '2%' THEN 'SEGUNDO'
        WHEN b.period ILIKE '3%' THEN 'TERCEIRO'
        WHEN b.period ILIKE '4%' THEN 'QUARTO'
        ELSE 'PRIMEIRO'
    END,
    descricao = COALESCE(NULLIF(TRIM(n.period), ''), 'Avaliação')
FROM tb_boletim b
WHERE b.id = n.boletim_id;

DELETE FROM tb_nota WHERE student_id IS NULL;

ALTER TABLE tb_nota ALTER COLUMN descricao SET NOT NULL;
ALTER TABLE tb_nota ALTER COLUMN bimestre SET NOT NULL;
ALTER TABLE tb_nota ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE tb_nota ADD CONSTRAINT fk_nota_student FOREIGN KEY (student_id) REFERENCES tb_student (id);
ALTER TABLE tb_nota DROP COLUMN boletim_id;
ALTER TABLE tb_nota DROP COLUMN period;

DELETE FROM tb_boletim;
ALTER TABLE tb_boletim
    DROP COLUMN IF EXISTS period,
    DROP COLUMN IF EXISTS final_average,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS situacao,
    DROP COLUMN IF EXISTS fechado_em;
ALTER TABLE tb_boletim
    ADD COLUMN bimestre varchar(255) NOT NULL,
    ADD COLUMN nota_final real NOT NULL,
    ADD COLUMN lancado_em timestamp(6) NOT NULL,
    ADD COLUMN disciplina_id bigint NOT NULL REFERENCES tb_disciplina (id),
    ADD COLUMN lancado_por_id bigint NOT NULL REFERENCES tb_user (id);
ALTER TABLE tb_boletim ADD CONSTRAINT uk_boletim_aluno_disciplina_bimestre UNIQUE (student_id, disciplina_id, bimestre);

ALTER TABLE tb_notificacao DROP CONSTRAINT IF EXISTS tb_notificacao_tipo_check;
UPDATE tb_notificacao SET status = 'CANCELADA' WHERE tipo = 'BOLETIM_FECHADO' AND status = 'PENDENTE';
UPDATE tb_notificacao SET tipo = 'NOTA_FINAL' WHERE tipo = 'BOLETIM_FECHADO';

ALTER TABLE tb_entrega DROP CONSTRAINT IF EXISTS tb_entrega_status_check;
UPDATE tb_entrega SET status = 'ENTREGUE' WHERE status = 'AVALIADA';
DELETE FROM tb_entrega WHERE status IS NULL OR status = 'PENDENTE';
DELETE FROM tb_entrega e
USING tb_entrega d
WHERE e.atividade_id = d.atividade_id
  AND e.student_id = d.student_id
  AND e.id < d.id;
ALTER TABLE tb_entrega
    DROP COLUMN IF EXISTS content,
    DROP COLUMN IF EXISTS submitted_at,
    DROP COLUMN IF EXISTS grade;
ALTER TABLE tb_entrega ALTER COLUMN status SET NOT NULL;
ALTER TABLE tb_entrega ADD CONSTRAINT uk_entrega_atividade_aluno UNIQUE (atividade_id, student_id);

ALTER TABLE tb_atividade ADD COLUMN IF NOT EXISTS bimestre varchar(255);
UPDATE tb_atividade
SET bimestre = CASE
    WHEN EXTRACT(MONTH FROM COALESCE(publicada_em::date, prazo)) <= 4 THEN 'PRIMEIRO'
    WHEN EXTRACT(MONTH FROM COALESCE(publicada_em::date, prazo)) <= 7 THEN 'SEGUNDO'
    WHEN EXTRACT(MONTH FROM COALESCE(publicada_em::date, prazo)) <= 9 THEN 'TERCEIRO'
    ELSE 'QUARTO'
END
WHERE bimestre IS NULL;
ALTER TABLE tb_atividade ALTER COLUMN bimestre SET NOT NULL;
ALTER TABLE tb_atividade DROP COLUMN IF EXISTS status;

COMMIT;
