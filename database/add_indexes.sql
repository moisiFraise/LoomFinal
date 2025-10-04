-- Script de otimização: Adicionar índices para melhorar performance
-- Banco de dados: loom_db

-- Índices em usuarios
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_reset_token ON usuarios(reset_token);

-- Índices em clubes
CREATE INDEX idx_clubes_criador ON clubes(id_criador);
CREATE INDEX idx_clubes_visibilidade ON clubes(visibilidade);

-- Índices em participacoes (crítico para performance)
CREATE INDEX idx_participacoes_usuario ON participacoes(id_usuario);
CREATE INDEX idx_participacoes_clube ON participacoes(id_clube);
CREATE INDEX idx_participacoes_usuario_clube ON participacoes(id_usuario, id_clube);

-- Índices em atualizacoes
CREATE INDEX idx_atualizacoes_usuario_data ON atualizacoes(id_usuario, data_postagem);
CREATE INDEX idx_atualizacoes_clube ON atualizacoes(id_clube);
CREATE INDEX idx_atualizacoes_leitura ON atualizacoes(id_leitura);

-- Índices em curtidas
CREATE INDEX idx_curtidas_atualizacao ON curtidas(id_atualizacao);
CREATE UNIQUE INDEX ux_curtidas_usuario_atualizacao ON curtidas(id_usuario, id_atualizacao);

-- Índices em comentarios
CREATE INDEX idx_comentarios_atualizacao ON comentarios(id_atualizacao);
CREATE INDEX idx_comentarios_usuario ON comentarios(id_usuario);

-- Índices em leituras
CREATE INDEX idx_leituras_clube ON leituras(id_clube);
CREATE INDEX idx_leituras_status ON leituras(status);
CREATE INDEX idx_leituras_clube_status ON leituras(id_clube, status);

-- Índices em encontros
CREATE INDEX idx_encontros_clube ON encontros(id_clube);
CREATE INDEX idx_encontros_data ON encontros(data_encontro);

-- Índices em participantes_encontro
CREATE INDEX idx_participantes_encontro_encontro ON participantes_encontro(id_encontro);
CREATE INDEX idx_participantes_encontro_usuario ON participantes_encontro(id_usuario);

-- Índices em sugestoes
CREATE INDEX idx_sugestoes_clube ON sugestoes(id_clube);
CREATE INDEX idx_sugestoes_usuario ON sugestoes(id_usuario);

-- Índices em votacoes
CREATE INDEX idx_votacoes_clube ON votacoes(id_clube);

-- Índices em opcoes_votacao
CREATE INDEX idx_opcoes_votacao_votacao ON opcoes_votacao(id_votacao);

-- Índices em votos
CREATE INDEX idx_votos_opcao ON votos(id_opcao);
CREATE INDEX idx_votos_usuario ON votos(id_usuario);

-- Índices em denuncias
CREATE INDEX idx_denuncias_status ON denuncias(status);
CREATE INDEX idx_denuncias_denunciante ON denuncias(id_denunciante);
CREATE INDEX idx_denuncias_denunciado ON denuncias(id_denunciado);

-- Índices em sessions (caso exista)
CREATE INDEX idx_sessions_expires ON sessions(expires);

-- Mostrar índices criados
SHOW INDEX FROM usuarios;
SHOW INDEX FROM participacoes;
SHOW INDEX FROM atualizacoes;
SHOW INDEX FROM curtidas;
