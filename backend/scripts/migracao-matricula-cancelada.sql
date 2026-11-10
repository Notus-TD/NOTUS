BEGIN;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'tb_student'::regclass AND contype = 'c'
               AND pg_get_constraintdef(oid) ILIKE '%status_matricula%' LOOP
        EXECUTE format('ALTER TABLE tb_student DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

COMMIT;
