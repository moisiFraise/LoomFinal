-- Adicionar coluna gif_url à tabela comentarios
-- Este script corrige o erro "Unknown column 'gif_url' in 'field list'"

USE loom_db;

-- Verificar se a coluna já existe antes de tentar adicionar
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'loom_db' 
    AND TABLE_NAME = 'comentarios' 
    AND COLUMN_NAME = 'gif_url'
);

-- Adicionar a coluna somente se ela não existir
SET @sql = IF(@column_exists > 0, 
    'SELECT "Coluna gif_url já existe na tabela comentarios"',
    'ALTER TABLE comentarios ADD COLUMN gif_url VARCHAR(500) DEFAULT NULL'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar a estrutura da tabela após a alteração
DESCRIBE comentarios;
