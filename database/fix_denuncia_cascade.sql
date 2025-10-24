-- Corrigir cascata de denúncias
-- A denúncia não deve ser deletada quando a atualização é removida

-- Remover foreign key atual
ALTER TABLE denuncias 
DROP FOREIGN KEY denuncias_ibfk_3;

-- Atualizar id_atualizacao para permitir NULL
ALTER TABLE denuncias 
MODIFY COLUMN id_atualizacao INT NULL;

-- Adicionar colunas para guardar backup antes de deletar
ALTER TABLE denuncias 
ADD COLUMN conteudo_atualizacao_backup TEXT NULL AFTER id_atualizacao;

ALTER TABLE denuncias 
ADD COLUMN id_clube_backup INT NULL AFTER conteudo_atualizacao_backup;

-- Recriar foreign key SEM cascade delete
ALTER TABLE denuncias 
ADD CONSTRAINT denuncias_ibfk_3 
FOREIGN KEY (id_atualizacao) 
REFERENCES atualizacoes(id) 
ON DELETE SET NULL;

-- Preencher backup das denúncias existentes
UPDATE denuncias d
JOIN atualizacoes a ON d.id_atualizacao = a.id
SET d.conteudo_atualizacao_backup = a.conteudo,
    d.id_clube_backup = a.id_clube
WHERE d.conteudo_atualizacao_backup IS NULL;

SELECT 'Foreign key corrigida - denúncias não serão mais deletadas quando atualização for removida' as status;
