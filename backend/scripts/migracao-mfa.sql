BEGIN;

ALTER TABLE tb_user ADD COLUMN IF NOT EXISTS mfa_segredo varchar(255);
ALTER TABLE tb_user ADD COLUMN IF NOT EXISTS mfa_ativo boolean NOT NULL DEFAULT false;
ALTER TABLE tb_user ADD COLUMN IF NOT EXISTS mfa_ultimo_passo bigint;

COMMIT;
