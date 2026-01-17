-- =====================================================
-- 🔐 MIGRATIONS DE SEGURANÇA - LOOM
-- =====================================================
-- Execute este script para adicionar tabelas de segurança
-- mysql -u root -p loom_db < migrations-seguranca.sql

-- 1. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  acao VARCHAR(50) NOT NULL,
  tabela VARCHAR(100),
  dados LONGTEXT,
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_usuario (id_usuario),
  KEY idx_acao (acao),
  KEY idx_data (criado_em),
  KEY idx_tabela (tabela),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE TENTATIVAS DE LOGIN
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  sucesso BOOLEAN DEFAULT FALSE,
  tentativa_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent VARCHAR(500),
  KEY idx_email (email),
  KEY idx_ip (ip),
  KEY idx_data (tentativa_em),
  INDEX idx_email_ip_tempo (email, ip, tentativa_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE SENHAS ANTIGAS (PARA EVITAR REUTILIZAÇÃO)
CREATE TABLE IF NOT EXISTS password_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  hash_senha VARCHAR(255) NOT NULL,
  alterada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_usuario (id_usuario),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE SESSSÕES ATIVAS (PARA RASTREAMENTO)
CREATE TABLE IF NOT EXISTS session_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  ativo BOOLEAN DEFAULT TRUE,
  login_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_em TIMESTAMP NULL,
  KEY idx_usuario (id_usuario),
  KEY idx_session (session_id),
  KEY idx_ativo (ativo),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE BLOQUEIOS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS security_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45),
  email VARCHAR(255),
  motivo VARCHAR(255),
  bloqueado_ate TIMESTAMP,
  bloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removido_em TIMESTAMP NULL,
  KEY idx_ip (ip),
  KEY idx_email (email),
  KEY idx_ate (bloqueado_ate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELA DE ATIVIDADES SUSPEITAS
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  tipo VARCHAR(100),
  descricao TEXT,
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  severidade ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
  resolvida BOOLEAN DEFAULT FALSE,
  detectada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_usuario (id_usuario),
  KEY idx_tipo (tipo),
  KEY idx_severidade (severidade),
  KEY idx_resolvida (resolvida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ADICIONAR COLUNA DE SOFT DELETE AOS USUÁRIOS
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS motivo_delecao TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dados_criptografados LONGTEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso_ip VARCHAR(45);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso_em TIMESTAMP;

-- 8. ADICIONAR ÍNDICES DE SEGURANÇA
ALTER TABLE usuarios ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE usuarios ADD INDEX IF NOT EXISTS idx_deletado (deletado_em);
ALTER TABLE usuarios ADD UNIQUE INDEX IF NOT EXISTS unq_email_ativo (email, deletado_em);

-- 9. TABELA DE TOKENS 2FA
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  secret VARCHAR(255) NOT NULL,
  habilitado BOOLEAN DEFAULT FALSE,
  backup_codes LONGTEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABELA DE TOKENS 2FA TEMPORÁRIOS
CREATE TABLE IF NOT EXISTS two_factor_temp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP,
  tentativas INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VIEWS PARA ANÁLISE DE SEGURANÇA
-- =====================================================

-- View de atividade recente
CREATE OR REPLACE VIEW vw_atividade_recente AS
SELECT 
  u.id,
  u.nome,
  u.email,
  sa.login_em,
  sa.ultimo_acesso,
  sa.ip,
  COUNT(DISTINCT la.id) as tentativas_login_24h
FROM usuarios u
LEFT JOIN session_activity sa ON u.id = sa.id_usuario AND sa.ativo = TRUE
LEFT JOIN login_attempts la ON u.id = (SELECT id_usuario FROM usuarios WHERE email = la.email) 
  AND la.tentativa_em >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY u.id;

-- View de atividades suspeitas não resolvidas
CREATE OR REPLACE VIEW vw_suspeitas_pendentes AS
SELECT 
  sa.*,
  u.nome,
  u.email
FROM suspicious_activity sa
LEFT JOIN usuarios u ON sa.id_usuario = u.id
WHERE sa.resolvida = FALSE
ORDER BY sa.severidade DESC, sa.detectada_em DESC;

-- =====================================================
-- PROCEDURES PARA LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Procedure para limpar dados expirados
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_limpar_dados_expirados()
BEGIN
  -- Limpar login attempts antigos (30 dias)
  DELETE FROM login_attempts 
  WHERE tentativa_em < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  -- Limpar bloqueios expirados
  UPDATE security_blocks 
  SET removido_em = NOW() 
  WHERE bloqueado_ate < NOW() AND removido_em IS NULL;
  
  -- Limpar 2FA temporário expirado
  DELETE FROM two_factor_temp 
  WHERE expires_at < NOW();
  
  -- Arquivar audit logs antigos (manter 90 dias)
  DELETE FROM audit_logs 
  WHERE criado_em < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //
DELIMITER ;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_data 
ON audit_logs(id_usuario, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_tempo 
ON login_attempts(email, ip, tentativa_em DESC);

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_severidade_data 
ON suspicious_activity(severidade, detectada_em DESC);

-- =====================================================
-- GRANTS PARA USUÁRIO DE APLICAÇÃO (CRIAR NOVO USER)
-- =====================================================
-- Descomentar e customizar conforme necessário
-- CREATE USER 'loom_app'@'localhost' IDENTIFIED BY 'SENHA_SEGURA_AQUI';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON loom_db.* TO 'loom_app'@'localhost';
-- GRANT EXECUTE ON loom_db.* TO 'loom_app'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- FIM DAS MIGRATIONS DE SEGURANÇA
-- =====================================================
