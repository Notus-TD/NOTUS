-- Adicionar campo ano_letivo nas tabelas que faltam
ALTER TABLE tb_falta ADD COLUMN ano_letivo VARCHAR(4) DEFAULT '2026';
ALTER TABLE tb_atividade ADD COLUMN ano_letivo VARCHAR(4) DEFAULT '2026';
ALTER TABLE tb_aula_registro ADD COLUMN ano_letivo VARCHAR(4) DEFAULT '2026';
ALTER TABLE tb_comunicado ADD COLUMN ano_letivo VARCHAR(4) DEFAULT '2026';

-- Criar índices para performance
CREATE INDEX idx_falta_ano ON tb_falta(ano_letivo);
CREATE INDEX idx_atividade_ano ON tb_atividade(ano_letivo);
CREATE INDEX idx_aula_ano ON tb_aula_registro(ano_letivo);
CREATE INDEX idx_comunicado_ano ON tb_comunicado(ano_letivo);
