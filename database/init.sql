-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS teste_loom;
USE teste_loom;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'admin') DEFAULT 'usuario',
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE usuarios 
ADD COLUMN estado ENUM('ativo', 'inativo','suspenso') DEFAULT 'ativo';

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
ALTER TABLE clubes 
ADD COLUMN modelo ENUM('hibrido', 'online', 'presencial') DEFAULT 'online',
ADD COLUMN leitura_atual VARCHAR(255) DEFAULT NULL;

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
DROP TABLE IF EXISTS atualizacoes;

CREATE TABLE IF NOT EXISTS atualizacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_leitura INT NOT NULL,
  conteudo TEXT,
  data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP,
  porcentagem_leitura INT,
  FOREIGN KEY (id_clube) REFERENCES clubes(id),
  FOREIGN KEY (id_leitura) REFERENCES leituras(id)
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relação entre clubes e categorias
CREATE TABLE IF NOT EXISTS clube_categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_categoria INT NOT NULL,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_clube_categoria (id_clube, id_categoria)
);

INSERT INTO usuarios (nome, email, senha, tipo) 
VALUES ('Administrador', 'admin@loom.com', '123', 'admin')
ON DUPLICATE KEY UPDATE id=id;

CREATE TABLE leituras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_clube INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    status ENUM('atual', 'anterior') DEFAULT 'atual',
    data_inicio DATE,
    data_fim DATE,
    FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE
);

ALTER TABLE leituras 
ADD COLUMN imagemUrl VARCHAR(255),
ADD COLUMN paginas INT;

ALTER TABLE atualizacoes 
ADD COLUMN id_usuario INT NOT NULL,
ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id);


--curtidas atualizações
CREATE TABLE IF NOT EXISTS curtidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_atualizacao INT NOT NULL,
  id_usuario INT NOT NULL,
  data_curtida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_atualizacao) REFERENCES atualizacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_curtida (id_atualizacao, id_usuario)
);
CREATE TABLE IF NOT EXISTS encontros (
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
);
CREATE TABLE IF NOT EXISTS participantes_encontro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_encontro INT NOT NULL,
  id_usuario INT NOT NULL,
  status ENUM('confirmado', 'talvez', 'recusado') DEFAULT 'confirmado',
  data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_encontro) REFERENCES encontros(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participante_encontro (id_encontro, id_usuario)
);
ALTER TABLE usuarios 
ADD COLUMN biografia TEXT,
ADD COLUMN foto_perfil VARCHAR(255) DEFAULT 'default-profile.jpg';

CREATE TABLE IF NOT EXISTS denuncias (
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
);
-- Adiciona campos cidade e estado em clubes
ALTER TABLE clubes
ADD COLUMN cidade VARCHAR(100),
ADD COLUMN estado VARCHAR(100);

-- Tabela de sugestões de leitura
CREATE TABLE IF NOT EXISTS sugestoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  id_usuario INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  justificativa TEXT,
  imagemUrl VARCHAR(255),
  paginas INT;
  data_sugestao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de votações
CREATE TABLE IF NOT EXISTS votacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_clube INT NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio DATETIME NOT NULL,
  data_fim DATETIME NOT NULL,
  encerrada BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE
);

-- Tabela de opções de votação (cada opção representa uma sugestão de leitura)
CREATE TABLE IF NOT EXISTS opcoes_votacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_votacao INT NOT NULL,
  id_sugestao INT NOT NULL,
  FOREIGN KEY (id_votacao) REFERENCES votacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_sugestao) REFERENCES sugestoes(id) ON DELETE CASCADE
);

-- Tabela de votos
CREATE TABLE IF NOT EXISTS votos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_votacao INT NOT NULL,
  id_usuario INT NOT NULL,
  id_opcao INT NOT NULL,
  data_voto DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_votacao) REFERENCES votacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_opcao) REFERENCES opcoes_votacao(id) ON DELETE CASCADE,
  UNIQUE KEY unique_voto_usuario (id_votacao, id_usuario)
);
