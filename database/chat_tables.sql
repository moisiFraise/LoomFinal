-- Tabelas para chat de grupo dos clubes
-- Banco de dados: loom_db

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS mensagens_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_clube INT NOT NULL,
    id_usuario INT NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editada BOOLEAN DEFAULT FALSE,
    data_edicao TIMESTAMP NULL,
    excluida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_clube) REFERENCES clubes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_mensagens_clube_data ON mensagens_chat(id_clube, data_envio DESC);
CREATE INDEX idx_mensagens_usuario ON mensagens_chat(id_usuario);
CREATE INDEX idx_mensagens_data ON mensagens_chat(data_envio);
