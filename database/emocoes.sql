-- Script para adicionar sistema de emoções
USE teste_loom;

-- Tabela de emoções
CREATE TABLE IF NOT EXISTS emocoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  emoji VARCHAR(10) NOT NULL,
  cor VARCHAR(7) DEFAULT '#6c5ce7',
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir emoções padrão
INSERT INTO emocoes (nome, emoji, cor) VALUES 
('Feliz', '😊', '#28a745'),
('Empolgado', '🤩', '#ffc107'),
('Relaxado', '😌', '#17a2b8'),
('Triste', '😢', '#6f42c1'),
('Frustrado', '😤', '#fd7e14'),
('Surpreso', '😮', '#e83e8c'),
('Pensativo', '🤔', '#6c757d'),
('Inspirado', '✨', '#20c997')
ON DUPLICATE KEY UPDATE nome=nome;

-- Modificar tabela atualizacoes para incluir emoção
ALTER TABLE atualizacoes 
ADD COLUMN id_emocao INT DEFAULT NULL,
ADD FOREIGN KEY (id_emocao) REFERENCES emocoes(id) ON DELETE SET NULL;

-- Também adicionar gif_url se não existir ainda
ALTER TABLE atualizacoes 
ADD COLUMN gif_url VARCHAR(255) DEFAULT NULL;
