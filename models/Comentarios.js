const pool = require('../config/database');

class Comentarios {
    static async criar(idAtualizacao, idUsuario, conteudo, gifUrl = null) {
        try {
            console.log('Comentarios.criar() - Parâmetros recebidos:', {
                idAtualizacao,
                idUsuario,
                conteudo: conteudo?.substring(0, 50) + '...',
                gifUrl
            });
            
            // Validar parâmetros antes de inserir
            if (!idAtualizacao || !idUsuario || !conteudo) {
                throw new Error(`Parâmetros inválidos: idAtualizacao=${idAtualizacao}, idUsuario=${idUsuario}, conteudo=${conteudo ? 'OK' : 'NULL'}`);
            }
            
            // Verificar se devemos incluir gif_url baseado se o parâmetro foi fornecido
            let query, params;
            if (gifUrl && gifUrl.trim() !== '') {
                // Tentar inserir com gif_url primeiro
                try {
                    query = `INSERT INTO comentarios (id_atualizacao, id_usuario, conteudo, gif_url) VALUES (?, ?, ?, ?)`;
                    params = [idAtualizacao, idUsuario, conteudo, gifUrl];
                } catch (error) {
                    if (error.code === 'ER_BAD_FIELD_ERROR') {
                        // Se gif_url não existe, usar query sem gif_url
                        query = `INSERT INTO comentarios (id_atualizacao, id_usuario, conteudo) VALUES (?, ?, ?)`;
                        params = [idAtualizacao, idUsuario, conteudo];
                    } else {
                        throw error;
                    }
                }
            } else {
                // Inserir sem gif_url
                query = `INSERT INTO comentarios (id_atualizacao, id_usuario, conteudo) VALUES (?, ?, ?)`;
                params = [idAtualizacao, idUsuario, conteudo];
            }
            
            let result;
            try {
                [result] = await pool.safeQuery(query, params);
            } catch (error) {
                if (error.code === 'ER_BAD_FIELD_ERROR' && query.includes('gif_url')) {
                    // Fallback: tentar sem gif_url se a coluna não existir
                    console.log('Coluna gif_url não existe, inserindo sem ela...');
                    query = `INSERT INTO comentarios (id_atualizacao, id_usuario, conteudo) VALUES (?, ?, ?)`;
                    params = [idAtualizacao, idUsuario, conteudo];
                    [result] = await pool.safeQuery(query, params);
                } else {
                    throw error;
                }
            }
            
            console.log('Comentário inserido com sucesso, ID:', result.insertId);
            
            return {
                id: result.insertId,
                idAtualizacao,
                idUsuario,
                conteudo,
                gifUrl,
                dataComentario: new Date()
            };
        } catch (error) {
            console.error('Erro detalhado no modelo Comentarios.criar():', error);
            console.error('SQL State:', error.sqlState);
            console.error('SQL Message:', error.sqlMessage);
            throw error;
        }
    }
    static async listarPorAtualizacao(idAtualizacao) {
    try {
        // Verifica se a coluna gif_url existe
        const [columns] = await pool.safeQuery(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'comentarios' 
               AND COLUMN_NAME = 'gif_url'`
        );
        
        const hasGifUrl = columns.length > 0;
        
        let query;
        if (hasGifUrl) {
            query = `SELECT c.*, 
                            u.nome AS nome_usuario, 
                            u.foto_perfil,
                            a.id_usuario AS id_autor_atualizacao
                     FROM comentarios c
                     JOIN usuarios u ON c.id_usuario = u.id
                     JOIN atualizacoes a ON c.id_atualizacao = a.id
                     WHERE c.id_atualizacao = ?
                     ORDER BY c.data_comentario ASC`;
        } else {
            query = `SELECT c.id, c.id_atualizacao, c.id_usuario, c.conteudo, c.data_comentario,
                            NULL as gif_url, 
                            u.nome AS nome_usuario, 
                            u.foto_perfil,
                            a.id_usuario AS id_autor_atualizacao
                     FROM comentarios c
                     JOIN usuarios u ON c.id_usuario = u.id
                     JOIN atualizacoes a ON c.id_atualizacao = a.id
                     WHERE c.id_atualizacao = ?
                     ORDER BY c.data_comentario ASC`;
        }
        
        const [rows] = await pool.safeQuery(query, [idAtualizacao]);
        return rows;
    } catch (error) {
        console.error('Erro ao listar comentários:', error);
        throw error;
    }
}

    static async obterPorId(id) {
    try {
        const [rows] = await pool.safeQuery(
            `SELECT c.*, 
                    u.nome as nome_usuario, 
                    u.foto_perfil,
                    a.id_usuario AS id_autor_atualizacao
             FROM comentarios c
             JOIN usuarios u ON c.id_usuario = u.id
             JOIN atualizacoes a ON c.id_atualizacao = a.id
             WHERE c.id = ?`,
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Erro ao obter comentário por ID:', error);
        throw error;
    }
}

    
    static async atualizar(id, conteudo, gifUrl = null) {
        try {
            const [result] = await pool.safeQuery(
                `UPDATE comentarios 
                 SET conteudo = ?, gif_url = ?, data_comentario = NOW()
                 WHERE id = ?`,
                [conteudo, gifUrl, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar comentário:', error);
            throw error;
        }
    }
    
    static async excluir(id) {
        try {
            const [result] = await pool.safeQuery(
                'DELETE FROM comentarios WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            throw error;
        }
    }
    
    static async contarPorAtualizacao(idAtualizacao) {
        try {
            const [rows] = await pool.safeQuery(
                'SELECT COUNT(*) as total FROM comentarios WHERE id_atualizacao = ?',
                [idAtualizacao]
            );
            
            return rows[0]?.total || 0;
        } catch (error) {
            console.error('Erro ao contar comentários:', error);
            throw error;
        }
    }
    
    static async verificarPermissao(idComentario, idUsuario) {
        try {
            const [rows] = await pool.safeQuery(
                'SELECT id_usuario FROM comentarios WHERE id = ?',
                [idComentario]
            );
            
            if (rows.length === 0) {
                return false;
            }
            
            return rows[0].id_usuario === idUsuario;
        } catch (error) {
            console.error('Erro ao verificar permissão do comentário:', error);
            throw error;
        }
    }
}

module.exports = Comentarios;
