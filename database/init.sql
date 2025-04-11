-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS loom_db;
USE loom_db;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'admin') DEFAULT 'usuario',
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clubes
CREATE TABLE IF NOT EXISTS clubes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  id_criador INT NOT NULL,
  visibilidade ENUM('publico', 'privado') DEFAULT 'publico',
  senha_acesso VARCHAR(255) DEFAULT NULL,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_criador) REFERENCES usuarios(id)
);

-- Tabela de participação em clubes
CREATE TABLE IF NOT EXISTS participacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_clube INT NOT NULL,
  data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  FOREIGN KEY (id_clube) REFERENCES clubes(id),
  UNIQUE KEY unique_participacao (id_usuario, id_clube)
);

-- Tabela de atualizações
CREATE TABLE IF NOT EXISTS atualizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  conteudo TEXT,
  data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_clube) REFERENCES clubes(id)
);

-- admin padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, tipo) 
VALUES ('Administrador', 'admin@loom.com', '123', 'admin')
ON DUPLICATE KEY UPDATE id=id;
