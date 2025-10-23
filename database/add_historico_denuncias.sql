-- Script para adicionar tabela historico_denuncias em banco existente
-- Execute este script no phpMyAdmin se a tabela não existir

-- Criar tabela de histórico de denúncias
CREATE TABLE IF NOT EXISTS historico_denuncias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_denuncia INT NOT NULL,
  id_admin INT NOT NULL,
  acao VARCHAR(100) NOT NULL,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  observacoes TEXT,
  data_acao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_denuncia) REFERENCES denuncias(id) ON DELETE CASCADE,
  FOREIGN KEY (id_admin) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificar se a tabela foi criada
SELECT 'Tabela historico_denuncias criada com sucesso!' as status;
