-- Script para deploy no servidor hospedado
-- Execute este script no phpMyAdmin

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Remover tabelas existentes na ordem correta
DROP TABLE IF EXISTS votos;
DROP TABLE IF EXISTS opcoes_votacao;
DROP TABLE IF EXISTS votacoes;
DROP TABLE IF EXISTS sugestoes;
DROP TABLE IF EXISTS denuncias;
DROP TABLE IF EXISTS curtidas;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS participantes_encontro;
DROP TABLE IF EXISTS encontros;
DROP TABLE IF EXISTS atualizacoes;
DROP TABLE IF EXISTS leituras;
DROP TABLE IF EXISTS clube_categorias;
DROP TABLE IF EXISTS participacoes;
DROP TABLE IF EXISTS clubes;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS sessions;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Tabela de usuários
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'admin') DEFAULT 'usuario',
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('ativo', 'inativo','suspenso') DEFAULT 'ativo',
  biografia TEXT,
  foto_perfil VARCHAR(255) DEFAULT 'default-profile.jpg',
  reset_token VARCHAR(255) NULL,
  reset_token_expira DATETIME NULL,
  INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de categorias
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de clubes
CREATE TABLE clubes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  id_criador INT NOT NULL,
  visibilidade ENUM('publico', 'privado') DEFAULT 'publico',
  senha_acesso VARCHAR(255) DEFAULT NULL,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  modelo ENUM('hibrido', 'online', 'presencial') DEFAULT 'online',
  leitura_atual VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (id_criador) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de participação em clubes
CREATE TABLE participacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_clube INT NOT NULL,
  data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participacao (id_usuario, id_clube)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de relação entre clubes e categorias
CREATE TABLE clube_categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_categoria INT NOT NULL,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_clube_categoria (id_clube, id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de leituras
CREATE TABLE leituras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_clube INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    status ENUM('atual', 'anterior') DEFAULT 'atual',
    data_inicio DATE,
    data_fim DATE,
    imagemUrl VARCHAR(255),
    paginas INT,
    FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de atualizações
CREATE TABLE atualizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_leitura INT NOT NULL,
  conteudo TEXT,
  data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP,
  porcentagem_leitura INT,
  id_usuario INT NOT NULL,
  gif_url VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_leitura) REFERENCES leituras(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de curtidas
CREATE TABLE curtidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_atualizacao INT NOT NULL,
  id_usuario INT NOT NULL,
  data_curtida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_atualizacao) REFERENCES atualizacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_curtida (id_atualizacao, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de comentários
CREATE TABLE comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_atualizacao INT NOT NULL,
  id_usuario INT NOT NULL,
  conteudo TEXT NOT NULL,
  gif_url VARCHAR(500) DEFAULT NULL,
  data_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_atualizacao) REFERENCES atualizacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de encontros
CREATE TABLE encontros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_encontro DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME,
  local VARCHAR(255),
  link VARCHAR(255),
  tipo ENUM('presencial', 'online', 'hibrido') NOT NULL,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de participantes em encontros
CREATE TABLE participantes_encontro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_encontro INT NOT NULL,
  id_usuario INT NOT NULL,
  status ENUM('confirmado', 'talvez', 'recusado') DEFAULT 'confirmado',
  data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_encontro) REFERENCES encontros(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participante_encontro (id_encontro, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de denúncias
CREATE TABLE denuncias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_denunciante INT NOT NULL,
  id_denunciado INT NOT NULL,
  id_atualizacao INT NOT NULL,
  motivo ENUM('spam', 'conteudo_inadequado', 'assedio', 'discurso_odio', 'outro') NOT NULL,
  descricao TEXT,
  status ENUM('pendente', 'analisada', 'rejeitada') DEFAULT 'pendente',
  data_denuncia DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_analise DATETIME NULL,
  id_admin_analise INT NULL,
  observacoes_admin TEXT NULL,
  FOREIGN KEY (id_denunciante) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_denunciado) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_atualizacao) REFERENCES atualizacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_admin_analise) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de sugestões de leitura
CREATE TABLE sugestoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_usuario INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  justificativa TEXT,
  imagemUrl VARCHAR(255),
  paginas INT,
  data_sugestao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de votações
CREATE TABLE votacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio DATETIME NOT NULL,
  data_fim DATETIME NOT NULL,
  encerrada BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de opções de votação
CREATE TABLE opcoes_votacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_votacao INT NOT NULL,
  id_sugestao INT NOT NULL,
  FOREIGN KEY (id_votacao) REFERENCES votacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_sugestao) REFERENCES sugestoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de votos
CREATE TABLE votos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_votacao INT NOT NULL,
  id_usuario INT NOT NULL,
  id_opcao INT NOT NULL,
  data_voto DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_votacao) REFERENCES votacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_opcao) REFERENCES opcoes_votacao(id) ON DELETE CASCADE,
  UNIQUE KEY unique_voto_usuario (id_votacao, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de sessões (para express-session)
CREATE TABLE sessions (
  session_id VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  expires INT(11) UNSIGNED NOT NULL,
  data MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir usuário administrador padrão
INSERT INTO usuarios (nome, email, senha, tipo) 
VALUES ('Administrador', 'admin@loom.com', '$2b$10$YyImAmnQU8ozALP3p6pyY.1gykg0Dgi3w4w60d7p.e6AH/2jhD6.O', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Inserir categorias básicas
INSERT INTO categorias (nome) VALUES 
('Ficção'), 
('Romance'), 
('Terror'), 
('Fantasia'), 
('Biografia'), 
('História'), 
('Ciência'),
('Autoajuda')
ON DUPLICATE KEY UPDATE id=id;
